-- AlterTable
ALTER TABLE "CareerApplication" ADD COLUMN     "resumeAssetId" TEXT,
ADD COLUMN     "resumeUploadExpiresAt" TIMESTAMP(3),
ADD COLUMN     "resumeUploadHash" TEXT;

-- CreateTable
CREATE TABLE "CreditNote" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "locale" VARCHAR(2) NOT NULL,
    "number" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "html" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_returnId_key" ON "CreditNote"("returnId");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_number_key" ON "CreditNote"("number");

-- CreateIndex
CREATE UNIQUE INDEX "CreditNote_assetId_key" ON "CreditNote"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerApplication_resumeAssetId_key" ON "CareerApplication"("resumeAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "CareerApplication_resumeUploadHash_key" ON "CareerApplication"("resumeUploadHash");

-- AddForeignKey
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_resumeAssetId_fkey" FOREIGN KEY ("resumeAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "SaleReturn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditNote" ADD CONSTRAINT "CreditNote_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CreditNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditNote" ADD CONSTRAINT credit_note_locale CHECK (locale IN ('en','bn'));
CREATE TRIGGER credit_note_append_only BEFORE UPDATE OR DELETE ON "CreditNote" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE FUNCTION aia_private_attachment_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM "CreditNote" n WHERE n."assetId"=OLD.id) THEN RAISE EXCEPTION 'Issued credit-note asset is immutable'; END IF;
 IF EXISTS(SELECT 1 FROM "CareerApplication" a WHERE a."resumeAssetId"=OLD.id) AND (TG_OP='DELETE' OR NEW."objectKey" IS DISTINCT FROM OLD."objectKey" OR NEW.bucket IS DISTINCT FROM OLD.bucket OR NEW.visibility<>'PRIVATE' OR NEW.sha256 IS DISTINCT FROM OLD.sha256 OR NEW."mimeType" IS DISTINCT FROM OLD."mimeType") THEN RAISE EXCEPTION 'Resume identity and private storage are immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER private_attachment_guard BEFORE UPDATE OR DELETE ON "MediaAsset" FOR EACH ROW EXECUTE FUNCTION aia_private_attachment_guard();
CREATE FUNCTION aia_resume_link_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD."resumeAssetId" IS NOT NULL AND NEW."resumeAssetId" IS DISTINCT FROM OLD."resumeAssetId" THEN RAISE EXCEPTION 'Resume cannot be detached or replaced'; END IF;
 IF NEW."resumeAssetId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "MediaAsset" a WHERE a.id=NEW."resumeAssetId" AND a.visibility='PRIVATE') THEN RAISE EXCEPTION 'Resume must be private'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER resume_link_guard BEFORE UPDATE ON "CareerApplication" FOR EACH ROW EXECUTE FUNCTION aia_resume_link_guard();
CREATE FUNCTION aia_credit_note_source_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM "SaleReturn" r JOIN "MediaAsset" a ON a.id=NEW."assetId" WHERE r.id=NEW."returnId" AND r.state='POSTED' AND r.credit=(NEW.snapshot->>'credit')::numeric AND a.visibility='PRIVATE' AND a.status='READY' AND a."mimeType"='application/pdf') THEN RAISE EXCEPTION 'Credit note requires posted credit and private PDF'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER credit_note_source_guard BEFORE INSERT ON "CreditNote" FOR EACH ROW EXECUTE FUNCTION aia_credit_note_source_guard();
CREATE FUNCTION aia_email_content_frozen() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD.state<>'DRAFT' AND (TG_OP='DELETE' OR NEW.subject IS DISTINCT FROM OLD.subject OR NEW.html IS DISTINCT FROM OLD.html OR NEW."senderSnapshot" IS DISTINCT FROM OLD."senderSnapshot" OR NEW.revision<>OLD.revision OR NEW."approvedRevision" IS DISTINCT FROM OLD."approvedRevision" OR NEW."approvedByAuditId" IS DISTINCT FROM OLD."approvedByAuditId") THEN RAISE EXCEPTION 'Reviewed email content is frozen'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER email_content_frozen BEFORE UPDATE OR DELETE ON "EmailMessage" FOR EACH ROW EXECUTE FUNCTION aia_email_content_frozen();
CREATE FUNCTION aia_email_parts_frozen() RETURNS trigger LANGUAGE plpgsql AS $$ DECLARE target_id text; BEGIN
 target_id:=CASE WHEN TG_OP='DELETE' THEN OLD."emailId" ELSE NEW."emailId" END;
 IF EXISTS(SELECT 1 FROM "EmailMessage" e WHERE e.id=target_id AND e.state<>'DRAFT') OR (TG_OP='UPDATE' AND EXISTS(SELECT 1 FROM "EmailMessage" e WHERE e.id=OLD."emailId" AND e.state<>'DRAFT')) THEN RAISE EXCEPTION 'Reviewed recipients and attachments are frozen'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
CREATE TRIGGER email_recipients_frozen BEFORE INSERT OR UPDATE OR DELETE ON "EmailRecipient" FOR EACH ROW EXECUTE FUNCTION aia_email_parts_frozen();
CREATE TRIGGER email_attachments_frozen BEFORE INSERT OR UPDATE OR DELETE ON "EmailAttachment" FOR EACH ROW EXECUTE FUNCTION aia_email_parts_frozen();

