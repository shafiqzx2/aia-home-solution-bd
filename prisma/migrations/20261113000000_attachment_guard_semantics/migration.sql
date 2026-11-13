-- Preserve orphan/draft deletion semantics while retaining frozen attachment guards.
CREATE OR REPLACE FUNCTION aia_private_attachment_guard() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM "CreditNote" n WHERE n."assetId"=OLD.id) THEN RAISE EXCEPTION 'Issued credit-note asset is immutable'; END IF;
 IF EXISTS(SELECT 1 FROM "CareerApplication" a WHERE a."resumeAssetId"=OLD.id) AND (TG_OP='DELETE' OR NEW."objectKey" IS DISTINCT FROM OLD."objectKey" OR NEW.bucket IS DISTINCT FROM OLD.bucket OR NEW.visibility<>'PRIVATE' OR NEW.sha256 IS DISTINCT FROM OLD.sha256 OR NEW."mimeType" IS DISTINCT FROM OLD."mimeType") THEN RAISE EXCEPTION 'Resume identity and private storage are immutable'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
CREATE OR REPLACE FUNCTION aia_email_content_frozen() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF OLD.state<>'DRAFT' AND (TG_OP='DELETE' OR NEW.subject IS DISTINCT FROM OLD.subject OR NEW.html IS DISTINCT FROM OLD.html OR NEW."senderSnapshot" IS DISTINCT FROM OLD."senderSnapshot" OR NEW.revision<>OLD.revision OR NEW."approvedRevision" IS DISTINCT FROM OLD."approvedRevision" OR NEW."approvedByAuditId" IS DISTINCT FROM OLD."approvedByAuditId") THEN RAISE EXCEPTION 'Reviewed email content is frozen'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
