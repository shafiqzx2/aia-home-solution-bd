-- AlterTable
ALTER TABLE "RefundRecord" ADD COLUMN     "returnId" TEXT;

-- CreateTable
CREATE TABLE "InternalTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "dueAt" TIMESTAMP(3),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerApplication" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobSnapshot" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'RECEIVED',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleReturn" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceRef" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "credit" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedAt" TIMESTAMP(3),

    CONSTRAINT "SaleReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleReturnItem" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "quantity" DECIMAL(16,4) NOT NULL,
    "restock" BOOLEAN NOT NULL,
    "credit" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "SaleReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InternalTask_assigneeId_state_createdAt_idx" ON "InternalTask"("assigneeId", "state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CareerApplication_reference_key" ON "CareerApplication"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "CareerApplication_idempotencyKey_key" ON "CareerApplication"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CareerApplication_jobId_state_createdAt_idx" ON "CareerApplication"("jobId", "state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SaleReturn_reference_key" ON "SaleReturn"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "SaleReturn_idempotencyKey_key" ON "SaleReturn"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SaleReturn_saleId_state_createdAt_idx" ON "SaleReturn"("saleId", "state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SaleReturnItem_returnId_saleItemId_key" ON "SaleReturnItem"("returnId", "saleItemId");

-- AddForeignKey
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "SaleReturn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTask" ADD CONSTRAINT "InternalTask_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalTask" ADD CONSTRAINT "InternalTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerApplication" ADD CONSTRAINT "CareerApplication_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ContentEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "SaleReturn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "InternalTask" ADD CONSTRAINT task_state CHECK (state IN ('OPEN','IN_PROGRESS','BLOCKED','DONE','CANCELLED') AND priority IN ('LOW','NORMAL','HIGH','URGENT') AND revision>0);
ALTER TABLE "CareerApplication" ADD CONSTRAINT application_state CHECK (state IN ('RECEIVED','REVIEWING','SHORTLISTED','INTERVIEW','HIRED','REJECTED','WITHDRAWN') AND revision>0);
ALTER TABLE "SaleReturn" ADD CONSTRAINT return_state CHECK (state IN ('DRAFT','APPROVED','POSTED','CANCELLED') AND credit>0 AND revision>0 AND ((state='POSTED')=("postedAt" IS NOT NULL)));
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT return_item_positive CHECK (quantity>0 AND credit>=0);
CREATE TRIGGER return_items_append_only BEFORE UPDATE OR DELETE ON "SaleReturnItem" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE TRIGGER email_template_append_only BEFORE UPDATE OR DELETE ON "EmailTemplate" FOR EACH ROW EXECUTE FUNCTION aia_append_only();
CREATE FUNCTION aia_return_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF TG_OP='DELETE' OR OLD.state='POSTED' THEN RAISE EXCEPTION 'Posted returns are immutable'; END IF;
 IF NEW."saleId" IS DISTINCT FROM OLD."saleId" OR NEW.credit IS DISTINCT FROM OLD.credit OR NEW.reason IS DISTINCT FROM OLD.reason OR NEW."evidenceRef" IS DISTINCT FROM OLD."evidenceRef" OR NEW."requestHash" IS DISTINCT FROM OLD."requestHash" OR NEW."idempotencyKey" IS DISTINCT FROM OLD."idempotencyKey" THEN RAISE EXCEPTION 'Return source is immutable'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER return_immutable BEFORE UPDATE OR DELETE ON "SaleReturn" FOR EACH ROW EXECUTE FUNCTION aia_return_immutable();
CREATE FUNCTION aia_return_consistency() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM "SaleReturnItem" i JOIN "SaleReturn" r ON r.id=i."returnId" JOIN "SaleItem" s ON s.id=i."saleItemId" WHERE r."saleId"<>s."saleId") THEN RAISE EXCEPTION 'Return item must belong to sale'; END IF;
 IF EXISTS(SELECT 1 FROM "SaleItem" s WHERE (SELECT coalesce(sum(i.quantity),0) FROM "SaleReturnItem" i JOIN "SaleReturn" r ON r.id=i."returnId" WHERE i."saleItemId"=s.id AND r.state<>'CANCELLED')>(SELECT coalesce(sum(d.quantity),0) FROM "DeliveryItem" d WHERE d."saleItemId"=s.id)) THEN RAISE EXCEPTION 'Returns exceed delivered quantities'; END IF;
 IF EXISTS(SELECT 1 FROM "Sale" s WHERE (SELECT coalesce(sum(r.credit),0) FROM "SaleReturn" r WHERE r."saleId"=s.id AND r.state<>'CANCELLED')>s.total) THEN RAISE EXCEPTION 'Return credit exceeds sale'; END IF;
 IF EXISTS(SELECT 1 FROM "SaleReturn" r WHERE r.credit<>(SELECT coalesce(sum(i.credit),0) FROM "SaleReturnItem" i WHERE i."returnId"=r.id) OR (SELECT coalesce(sum(f.amount),0) FROM "RefundRecord" f WHERE f."returnId"=r.id)>r.credit) THEN RAISE EXCEPTION 'Return credit or refund mismatch'; END IF;
 IF EXISTS(SELECT 1 FROM "RefundRecord" f JOIN "SaleReturn" r ON r.id=f."returnId" WHERE r.state<>'POSTED' OR NOT EXISTS(SELECT 1 FROM "PaymentAllocation" a WHERE a."paymentId"=f."paymentId" AND a."saleId"=r."saleId")) THEN RAISE EXCEPTION 'Refund requires posted return and matching allocated payment'; END IF;
 IF EXISTS(SELECT 1 FROM "PaymentAllocation" a WHERE (SELECT coalesce(sum(f.amount),0) FROM "RefundRecord" f JOIN "SaleReturn" r ON r.id=f."returnId" WHERE f."paymentId"=a."paymentId" AND r."saleId"=a."saleId")>a.amount) THEN RAISE EXCEPTION 'Refund exceeds sale allocation'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER return_consistency AFTER INSERT OR UPDATE ON "SaleReturn" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia_return_consistency();
CREATE CONSTRAINT TRIGGER return_line_consistency AFTER INSERT ON "SaleReturnItem" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia_return_consistency();
CREATE CONSTRAINT TRIGGER refund_return_consistency AFTER INSERT ON "RefundRecord" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia_return_consistency();
INSERT INTO "Permission"(scope) SELECT resource||'.'||action FROM unnest(ARRAY['tasks','applications','email','returns']) resource CROSS JOIN unnest(ARRAY['view','create','update','archive','publish','approve','issue','export','manage']) action ON CONFLICT DO NOTHING;

