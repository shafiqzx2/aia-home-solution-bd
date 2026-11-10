-- Additional PostgreSQL invariants for the Phase A REVIEW proposal.
-- Requires staging integration tests before approval; NEVER auto-executed.
ALTER TABLE "QuotationVersion" ADD CONSTRAINT "quotation_financials_valid" CHECK (
  "subtotal" >= 0 AND "discount" BETWEEN 0 AND "subtotal" AND
  "taxPercent" BETWEEN 0 AND 100 AND "tax" >= 0 AND "charges" >= 0 AND
  "total" = "subtotal" - "discount" + "tax" + "charges" AND "revision" > 0 AND
  ("validUntil" IS NULL OR "validUntil" >= "documentDate") AND
  (("issuedAt" IS NULL AND "status" IN ('DRAFT','PENDING_APPROVAL','APPROVED')) OR
   ("issuedAt" IS NOT NULL AND "status" IN ('ISSUED','SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED')))
);
ALTER TABLE "QuotationItem" ADD CONSTRAINT "quote_line_valid" CHECK (
  "quantity" > 0 AND "unitPrice" >= 0 AND "lineTotal" = round("quantity" * "unitPrice", 2) AND "position" >= 0
);
ALTER TABLE "RequestItem" ADD CONSTRAINT "request_line_valid" CHECK ("quantity" > 0 AND num_nonnulls("productId", "serviceId") <= 1);
ALTER TABLE "CustomerRequest" ADD CONSTRAINT "request_identity_present" CHECK (num_nonnulls("customerId", "guestId") >= 1);
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "approval_single_target" CHECK (num_nonnulls("quotationVersionId", "documentVersionId") = 1);
ALTER TABLE "PortalGrant" ADD CONSTRAINT "grant_single_target" CHECK (num_nonnulls("quotationVersionId", "documentVersionId") = 1);
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "file_single_source" CHECK (num_nonnulls("quotationVersionId", "documentVersionId") = 1);
ALTER TABLE "EmailRecipient" ADD CONSTRAINT "email_recipient_kind" CHECK ("kind" IN ('TO','CC','BCC'));
ALTER TABLE "EmailMessage" ADD CONSTRAINT "email_review_required" CHECK (
  "state" IN ('DRAFT','FAILED') OR ("approvedRevision" IS NOT NULL AND "approvedRevision" = "revision" AND "approvedByAuditId" IS NOT NULL)
);
ALTER TABLE "PrivateProductPrice" ADD CONSTRAINT "private_price_nonnegative" CHECK ("unitPrice" >= 0);
ALTER TABLE "MediaAsset" ADD CONSTRAINT "private_asset_no_public_url" CHECK ("visibility" <> 'PRIVATE' OR "imageUrl" IS NULL);
ALTER TABLE "MediaAsset" ADD CONSTRAINT "asset_size_positive" CHECK ("bytes" > 0);
ALTER TABLE "NumberSequence" ADD CONSTRAINT "sequence_positive" CHECK ("nextValue" > 0);
ALTER TABLE "Category" ADD CONSTRAINT "category_not_self" CHECK ("parentId" IS NULL OR "parentId" <> "id");
ALTER TABLE "Visit" ADD CONSTRAINT "visit_real_location" CHECK (
  ("latitude" IS NULL AND "longitude" IS NULL) OR
  ("latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180 AND "locationConsentAt" IS NOT NULL)
);
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "address_real_location" CHECK (
  ("latitude" IS NULL AND "longitude" IS NULL) OR
  ("latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180 AND "consentAt" IS NOT NULL)
);
CREATE UNIQUE INDEX "one_verified_claim_per_request" ON "RequestClaim" ("requestId") WHERE "status" = 'VERIFIED';

CREATE FUNCTION aia_freeze_issued_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD."issuedAt" IS NOT NULL THEN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Issued versions cannot be deleted'; END IF;
    IF (to_jsonb(NEW) - 'status') IS DISTINCT FROM (to_jsonb(OLD) - 'status') THEN
      RAISE EXCEPTION 'Issued document content is immutable; create a new revision';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER quotation_version_frozen BEFORE UPDATE OR DELETE ON "QuotationVersion" FOR EACH ROW EXECUTE FUNCTION aia_freeze_issued_version();
CREATE TRIGGER document_version_frozen BEFORE UPDATE OR DELETE ON "DocumentVersion" FOR EACH ROW EXECUTE FUNCTION aia_freeze_issued_version();

CREATE FUNCTION aia_guard_quote_children() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_id text; frozen_at timestamp;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW."versionId" <> OLD."versionId" THEN RAISE EXCEPTION 'Cannot move version children'; END IF;
  IF TG_OP = 'DELETE' THEN target_id := OLD."versionId"; ELSE target_id := NEW."versionId"; END IF;
  SELECT "issuedAt" INTO frozen_at FROM "QuotationVersion" WHERE "id" = target_id FOR UPDATE;
  IF frozen_at IS NOT NULL THEN RAISE EXCEPTION 'Issued quotation lines and recipients are immutable'; END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER quotation_items_frozen BEFORE INSERT OR UPDATE OR DELETE ON "QuotationItem" FOR EACH ROW EXECUTE FUNCTION aia_guard_quote_children();
CREATE TRIGGER quotation_recipients_frozen BEFORE INSERT OR UPDATE OR DELETE ON "QuotationRecipient" FOR EACH ROW EXECUTE FUNCTION aia_guard_quote_children();

CREATE FUNCTION aia_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit, approval, template, and generated-file records are append-only'; END $$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON "AuditLog" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE TRIGGER approval_append_only BEFORE UPDATE OR DELETE ON "ApprovalRecord" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE TRIGGER template_append_only BEFORE UPDATE OR DELETE ON "TemplateVersion" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE TRIGGER generated_file_append_only BEFORE UPDATE OR DELETE ON "GeneratedDocument" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE TRIGGER quote_history_append_only BEFORE UPDATE OR DELETE ON "QuotationStatusEvent" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE TRIGGER request_history_append_only BEFORE UPDATE OR DELETE ON "RequestStatusEvent" FOR EACH ROW EXECUTE FUNCTION aia_append_only();

CREATE FUNCTION aia_guard_generated_asset() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "GeneratedDocument" WHERE "assetId" = OLD."id") THEN
    IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'Historical generated assets must be retained'; END IF;
    IF (to_jsonb(NEW) - 'archivedAt') IS DISTINCT FROM (to_jsonb(OLD) - 'archivedAt') THEN
      RAISE EXCEPTION 'Historical generated asset metadata is immutable';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER historical_asset_frozen BEFORE UPDATE OR DELETE ON "MediaAsset" FOR EACH ROW EXECUTE FUNCTION aia_guard_generated_asset();

CREATE FUNCTION aia_check_quote_issue() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE line_subtotal numeric; line_count integer;
BEGIN
  IF NEW."issuedAt" IS NOT NULL AND (TG_OP = 'INSERT' OR OLD."issuedAt" IS NULL) THEN
    SELECT coalesce(sum("lineTotal"), 0), count(*) INTO line_subtotal, line_count FROM "QuotationItem" WHERE "versionId" = NEW."id";
    IF line_count = 0 OR line_subtotal <> NEW."subtotal" OR NEW."tax" <> round((NEW."subtotal" - NEW."discount") * NEW."taxPercent" / 100, 2) THEN
      RAISE EXCEPTION 'Issued totals must match stored line items and the approved financial policy';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "ApprovalRecord" WHERE "quotationVersionId" = NEW."id" AND "decision" = 'APPROVED' AND "contentHash" = NEW."contentHash") THEN
      RAISE EXCEPTION 'Issuance requires approval of the current content hash';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER quote_issue_valid BEFORE INSERT OR UPDATE ON "QuotationVersion" FOR EACH ROW EXECUTE FUNCTION aia_check_quote_issue();

-- A pointer can never cross into a different quotation/document.
ALTER TABLE "Quotation" ADD CONSTRAINT "current_quote_belongs_to_quote" FOREIGN KEY ("id", "currentIssuedVersionId") REFERENCES "QuotationVersion" ("quotationId", "id") DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "BusinessDocument" ADD CONSTRAINT "current_document_belongs_to_document" FOREIGN KEY ("id", "currentIssuedVersionId") REFERENCES "DocumentVersion" ("documentId", "id") DEFERRABLE INITIALLY DEFERRED;

CREATE FUNCTION aia_require_latest_issued() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE aggregate_id text; current_id text; latest_id text;
BEGIN
  IF TG_TABLE_NAME = 'Quotation' THEN aggregate_id := NEW."id";
  ELSIF TG_TABLE_NAME = 'QuotationVersion' THEN aggregate_id := NEW."quotationId";
  ELSIF TG_TABLE_NAME = 'BusinessDocument' THEN aggregate_id := NEW."id";
  ELSE aggregate_id := NEW."documentId";
  END IF;
  IF TG_TABLE_NAME IN ('Quotation', 'QuotationVersion') THEN
    SELECT "currentIssuedVersionId" INTO current_id FROM "Quotation" WHERE "id" = aggregate_id;
    SELECT "id" INTO latest_id FROM "QuotationVersion" WHERE "quotationId" = aggregate_id AND "issuedAt" IS NOT NULL ORDER BY "revision" DESC LIMIT 1;
  ELSE
    SELECT "currentIssuedVersionId" INTO current_id FROM "BusinessDocument" WHERE "id" = aggregate_id;
    SELECT "id" INTO latest_id FROM "DocumentVersion" WHERE "documentId" = aggregate_id AND "issuedAt" IS NOT NULL ORDER BY "revision" DESC LIMIT 1;
  END IF;
  IF current_id IS DISTINCT FROM latest_id THEN RAISE EXCEPTION 'Current version must be the latest officially issued revision'; END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER quote_current_is_latest AFTER INSERT OR UPDATE ON "Quotation" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia_require_latest_issued();
CREATE CONSTRAINT TRIGGER quote_issued_pointer_consistent AFTER INSERT OR UPDATE ON "QuotationVersion" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia_require_latest_issued();
CREATE CONSTRAINT TRIGGER document_current_is_latest AFTER INSERT OR UPDATE ON "BusinessDocument" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia_require_latest_issued();
CREATE CONSTRAINT TRIGGER document_issued_pointer_consistent AFTER INSERT OR UPDATE ON "DocumentVersion" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia_require_latest_issued();

-- Serialize numbering inside the same transaction as issuing and auditing. Never
-- allocate a number for a preview or a draft. Gaps after voids are retained.
CREATE FUNCTION aia_next_number(sequence_scope text, sequence_period text) RETURNS bigint LANGUAGE sql AS $$
  INSERT INTO "NumberSequence" ("scope", "period", "nextValue") VALUES (sequence_scope, sequence_period, 2)
  ON CONFLICT ("scope", "period") DO UPDATE SET "nextValue" = "NumberSequence"."nextValue" + 1
  RETURNING "nextValue" - 1;
$$;
REVOKE ALL ON FUNCTION aia_next_number(text, text) FROM PUBLIC;

-- Supabase Data API roles must not acquire access through default grants.
-- Runtime/migration role provisioning and FORCE RLS policies need review against
-- the actual target before execution. Prisma service authorization is mandatory.
DO $$ DECLARE t text; r text;
BEGIN
  FOREACH t IN ARRAY ARRAY[__TABLES__] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC', t);
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', t, r); END IF;
    END LOOP;
  END LOOP;
END $$;
