-- REVIEW ONLY. Requires the reviewed Phase A proposal first. Nothing applied.
-- Offline schema diff; target-role, concurrency and restore tests remain Phase B gates.
BEGIN;
-- CreateEnum
CREATE TYPE "SaleState" AS ENUM ('DRAFT', 'COMMITTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "CommercialKind" AS ENUM ('MEMO', 'INVOICE', 'RECEIPT', 'CHALLAN');

-- CreateEnum
CREATE TYPE "LedgerState" AS ENUM ('POSTED', 'VOIDED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sku" TEXT;

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "reorderPoint" DECIMAL(16,4) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "customerId" TEXT,
    "sourceQuotationVersionId" TEXT,
    "state" "SaleState" NOT NULL DEFAULT 'DRAFT',
    "saleDate" DATE NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "customerSnapshot" JSONB NOT NULL,
    "companySnapshot" JSONB NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL,
    "taxPercent" DECIMAL(7,4) NOT NULL,
    "tax" DECIMAL(18,2) NOT NULL,
    "charges" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "committedAt" TIMESTAMP(3),
    "demoScope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "productId" TEXT,
    "snapshot" JSONB NOT NULL,
    "quantity" DECIMAL(16,4) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "lineTotal" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialDocument" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "documentVersionId" TEXT NOT NULL,
    "kind" "CommercialKind" NOT NULL,
    "paymentId" TEXT,
    "deliveryId" TEXT,
    "financialSnapshot" JSONB NOT NULL,

    CONSTRAINT "CommercialDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "methodId" TEXT NOT NULL,
    "externalRef" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BDT',
    "state" "LedgerState" NOT NULL DEFAULT 'POSTED',
    "evidence" JSONB NOT NULL,
    "demoScope" TEXT,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "PaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRecord" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "evidence" JSONB NOT NULL,

    CONSTRAINT "RefundRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryRecord" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL,
    "evidence" JSONB NOT NULL,

    CONSTRAINT "DeliveryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryItem" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "quantity" DECIMAL(16,4) NOT NULL,

    CONSTRAINT "DeliveryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "deliveryItemId" TEXT,
    "quantityDelta" DECIMAL(16,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "demoScope" TEXT,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_reference_key" ON "Sale"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_idempotencyKey_key" ON "Sale"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Sale_demoScope_state_saleDate_id_idx" ON "Sale"("demoScope", "state", "saleDate", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SaleItem_saleId_position_key" ON "SaleItem"("saleId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CommercialDocument_documentVersionId_key" ON "CommercialDocument"("documentVersionId");

-- CreateIndex
CREATE INDEX "CommercialDocument_saleId_kind_idx" ON "CommercialDocument"("saleId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_code_key" ON "PaymentMethod"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_reference_key" ON "PaymentRecord"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_idempotencyKey_key" ON "PaymentRecord"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PaymentRecord_demoScope_receivedAt_id_idx" ON "PaymentRecord"("demoScope", "receivedAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_methodId_externalRef_key" ON "PaymentRecord"("methodId", "externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAllocation_paymentId_saleId_key" ON "PaymentAllocation"("paymentId", "saleId");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRecord_reference_key" ON "RefundRecord"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRecord_idempotencyKey_key" ON "RefundRecord"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRecord_reference_key" ON "DeliveryRecord"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRecord_idempotencyKey_key" ON "DeliveryRecord"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryItem_deliveryId_saleItemId_key" ON "DeliveryItem"("deliveryId", "saleItemId");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_idempotencyKey_key" ON "StockMovement"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "StockMovement_deliveryItemId_key" ON "StockMovement"("deliveryItemId");

-- CreateIndex
CREATE INDEX "StockMovement_productId_recordedAt_id_idx" ON "StockMovement"("productId", "recordedAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sourceQuotationVersionId_fkey" FOREIGN KEY ("sourceQuotationVersionId") REFERENCES "QuotationVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDocument" ADD CONSTRAINT "CommercialDocument_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDocument" ADD CONSTRAINT "CommercialDocument_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDocument" ADD CONSTRAINT "CommercialDocument_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialDocument" ADD CONSTRAINT "CommercialDocument_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "DeliveryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT "PaymentAllocation_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRecord" ADD CONSTRAINT "RefundRecord_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "PaymentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRecord" ADD CONSTRAINT "DeliveryRecord_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "DeliveryRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_deliveryItemId_fkey" FOREIGN KEY ("deliveryItemId") REFERENCES "DeliveryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Review only. Currency and exact arithmetic constraints are defense in depth;
-- authorization, approval and actor audit inserts belong in one server transaction.
ALTER TABLE "Sale" ADD CONSTRAINT sale_money CHECK (
  "currency"='BDT' AND "subtotal">=0 AND "discount">=0 AND "discount"<="subtotal"
  AND "taxPercent" BETWEEN 0 AND 100 AND "charges">=0
  AND "tax"=round(("subtotal"-"discount")*"taxPercent"/100,2)
  AND "total"="subtotal"-"discount"+"tax"+"charges"
  AND "total" BETWEEN 0 AND 999999999999.99
  AND (("state"='DRAFT' AND "committedAt" IS NULL) OR ("state"<>'DRAFT' AND "committedAt" IS NOT NULL)));
ALTER TABLE "SaleItem" ADD CONSTRAINT sale_item_money CHECK ("position">0 AND "quantity">0 AND "unitPrice">=0 AND "lineTotal"=round("quantity"*"unitPrice",2));
ALTER TABLE "PaymentRecord" ADD CONSTRAINT payment_positive CHECK ("amount">0 AND "currency"='BDT');
ALTER TABLE "PaymentAllocation" ADD CONSTRAINT allocation_positive CHECK ("amount">0);
ALTER TABLE "RefundRecord" ADD CONSTRAINT refund_positive CHECK ("amount">0 AND length(trim("reason"))>0);
ALTER TABLE "DeliveryItem" ADD CONSTRAINT delivery_positive CHECK ("quantity">0);
ALTER TABLE "StockMovement" ADD CONSTRAINT movement_nonzero CHECK ("quantityDelta"<>0 AND length(trim("reason"))>0);
ALTER TABLE "Inventory" ADD CONSTRAINT inventory_nonnegative CHECK ("quantity">=0 AND "reorderPoint">=0);
ALTER TABLE "CommercialDocument" ADD CONSTRAINT commercial_event_kind CHECK (
  ("kind"='RECEIPT' AND "paymentId" IS NOT NULL AND "deliveryId" IS NULL) OR
  ("kind"='CHALLAN' AND "deliveryId" IS NOT NULL AND "paymentId" IS NULL) OR
  ("kind" IN ('MEMO','INVOICE') AND "paymentId" IS NULL AND "deliveryId" IS NULL));

-- Posted financial events are append-only. Corrections need compensating events,
-- with an approved refund/void policy before exposing a write API.
CREATE FUNCTION aia1_append_only() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  RAISE EXCEPTION 'Financial events are append-only; use an authorized compensating event';
END $$;
CREATE TRIGGER payment_append_only BEFORE UPDATE OR DELETE ON "PaymentRecord" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();
CREATE TRIGGER allocation_append_only BEFORE UPDATE OR DELETE ON "PaymentAllocation" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();
CREATE TRIGGER refund_append_only BEFORE UPDATE OR DELETE ON "RefundRecord" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();
CREATE TRIGGER delivery_append_only BEFORE UPDATE OR DELETE ON "DeliveryRecord" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();
CREATE TRIGGER delivery_item_append_only BEFORE UPDATE OR DELETE ON "DeliveryItem" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();
CREATE TRIGGER stock_append_only BEFORE UPDATE OR DELETE ON "StockMovement" FOR EACH ROW EXECUTE FUNCTION aia1_append_only();

CREATE FUNCTION aia1_sale_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE locked boolean; aggregate_id text;
BEGIN
  IF TG_TABLE_NAME='Sale' THEN locked:=OLD."state"<>'DRAFT';
  ELSE
    IF TG_OP='INSERT' THEN aggregate_id:=NEW."saleId"; ELSE aggregate_id:=OLD."saleId"; END IF;
    SELECT "state"<>'DRAFT' INTO locked FROM "Sale" WHERE "id"=aggregate_id;
    IF TG_OP='UPDATE' AND NEW."saleId" IS DISTINCT FROM OLD."saleId" THEN RAISE EXCEPTION 'Sale items cannot move between aggregates'; END IF;
  END IF;
  IF locked THEN RAISE EXCEPTION 'Committed sale snapshots are immutable'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER sale_immutable BEFORE UPDATE OR DELETE ON "Sale" FOR EACH ROW EXECUTE FUNCTION aia1_sale_immutable();
CREATE TRIGGER sale_item_immutable BEFORE INSERT OR UPDATE OR DELETE ON "SaleItem" FOR EACH ROW EXECUTE FUNCTION aia1_sale_immutable();

CREATE FUNCTION aia1_commercial_immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF EXISTS(SELECT 1 FROM "DocumentVersion" d WHERE d."id"=OLD."documentVersionId" AND d."issuedAt" IS NOT NULL)
  THEN RAISE EXCEPTION 'Issued commercial snapshots are immutable'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER commercial_immutable BEFORE UPDATE OR DELETE ON "CommercialDocument" FOR EACH ROW EXECUTE FUNCTION aia1_commercial_immutable();

CREATE FUNCTION aia1_check_sale_source() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF NEW."sourceQuotationVersionId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "QuotationVersion" q WHERE q."id"=NEW."sourceQuotationVersionId" AND q."status" IN ('APPROVED','ISSUED','SENT','VIEWED','ACCEPTED'))
  THEN RAISE EXCEPTION 'Sale source must be an approved quotation revision'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER sale_source_eligible BEFORE INSERT OR UPDATE ON "Sale" FOR EACH ROW EXECUTE FUNCTION aia1_check_sale_source();

-- Lock affected records in a stable order before calling this validation at the
-- service layer. These deferred triggers also guard malformed direct writes.
CREATE FUNCTION aia1_financial_consistency() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF EXISTS(SELECT 1 FROM "Sale" s WHERE s."state"='COMMITTED' AND
    (NOT EXISTS(SELECT 1 FROM "SaleItem" i WHERE i."saleId"=s."id") OR
     s."subtotal"<>(SELECT coalesce(sum(i."lineTotal"),0) FROM "SaleItem" i WHERE i."saleId"=s."id")))
  THEN RAISE EXCEPTION 'Committed sale requires exact item snapshots'; END IF;
  IF EXISTS(SELECT 1 FROM "PaymentRecord" p WHERE
     (SELECT coalesce(sum(a."amount"),0) FROM "PaymentAllocation" a WHERE a."paymentId"=p."id")>p."amount" OR
     (SELECT coalesce(sum(r."amount"),0) FROM "RefundRecord" r WHERE r."paymentId"=p."id")>p."amount")
  THEN RAISE EXCEPTION 'Payment allocation or refund exceeds recorded amount'; END IF;
  IF EXISTS(SELECT 1 FROM "PaymentAllocation" a JOIN "Sale" s ON s."id"=a."saleId" JOIN "PaymentRecord" p ON p."id"=a."paymentId"
     WHERE s."state"<>'COMMITTED' OR p."state"<>'POSTED' OR p."currency"<>s."currency" OR p."demoScope" IS DISTINCT FROM s."demoScope")
  THEN RAISE EXCEPTION 'Allocation requires matching committed sale and posted payment scope'; END IF;
  IF EXISTS(SELECT 1 FROM "Sale" s WHERE (SELECT coalesce(sum(a."amount"),0) FROM "PaymentAllocation" a WHERE a."saleId"=s."id")>s."total")
  THEN RAISE EXCEPTION 'Sale is overallocated'; END IF;
  IF EXISTS(SELECT 1 FROM "DeliveryItem" d JOIN "DeliveryRecord" r ON r."id"=d."deliveryId" JOIN "SaleItem" i ON i."id"=d."saleItemId"
     JOIN "Sale" s ON s."id"=i."saleId" WHERE i."saleId"<>r."saleId" OR s."state"<>'COMMITTED')
  THEN RAISE EXCEPTION 'Delivery item must belong to its committed sale'; END IF;
  IF EXISTS(SELECT 1 FROM "SaleItem" i WHERE (SELECT coalesce(sum(d."quantity"),0) FROM "DeliveryItem" d WHERE d."saleItemId"=i."id")>i."quantity")
  THEN RAISE EXCEPTION 'Delivery exceeds sale quantity'; END IF;
  IF EXISTS(SELECT 1 FROM "StockMovement" m JOIN "DeliveryItem" d ON d."id"=m."deliveryItemId" JOIN "SaleItem" i ON i."id"=d."saleItemId"
    JOIN "Sale" s ON s."id"=i."saleId" WHERE m."productId" IS DISTINCT FROM i."productId" OR m."quantityDelta"<>-d."quantity" OR m."demoScope" IS DISTINCT FROM s."demoScope")
  THEN RAISE EXCEPTION 'Stock delivery event must match product, scope and exact quantity'; END IF;
  IF EXISTS(SELECT 1 FROM "CommercialDocument" c WHERE
     (c."kind"='RECEIPT' AND NOT EXISTS(SELECT 1 FROM "PaymentAllocation" a JOIN "PaymentRecord" p ON p."id"=a."paymentId" WHERE a."paymentId"=c."paymentId" AND a."saleId"=c."saleId" AND p."state"='POSTED')) OR
     (c."kind"='CHALLAN' AND NOT EXISTS(SELECT 1 FROM "DeliveryRecord" d WHERE d."id"=c."deliveryId" AND d."saleId"=c."saleId")))
  THEN RAISE EXCEPTION 'Receipt/challan requires its actual allocated payment/delivery'; END IF;
  RETURN NEW;
END $$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['Sale','SaleItem','PaymentRecord','PaymentAllocation','RefundRecord','DeliveryRecord','DeliveryItem','CommercialDocument','StockMovement'] LOOP
    EXECUTE format('CREATE CONSTRAINT TRIGGER financial_consistency AFTER INSERT OR UPDATE OR DELETE ON %I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION aia1_financial_consistency()',t);
  END LOOP;
END $$;

ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "Sale" FROM PUBLIC;
ALTER TABLE "SaleItem" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "SaleItem" FROM PUBLIC;
ALTER TABLE "CommercialDocument" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "CommercialDocument" FROM PUBLIC;
ALTER TABLE "PaymentMethod" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "PaymentMethod" FROM PUBLIC;
ALTER TABLE "PaymentRecord" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "PaymentRecord" FROM PUBLIC;
ALTER TABLE "PaymentAllocation" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "PaymentAllocation" FROM PUBLIC;
ALTER TABLE "RefundRecord" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "RefundRecord" FROM PUBLIC;
ALTER TABLE "DeliveryRecord" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "DeliveryRecord" FROM PUBLIC;
ALTER TABLE "DeliveryItem" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "DeliveryItem" FROM PUBLIC;
ALTER TABLE "StockMovement" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "StockMovement" FROM PUBLIC;
DO $$ DECLARE t text; r text; BEGIN FOREACH t IN ARRAY ARRAY['Sale','SaleItem','CommercialDocument','PaymentMethod','PaymentRecord','PaymentAllocation','RefundRecord','DeliveryRecord','DeliveryItem','StockMovement'] LOOP FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON TABLE %I FROM %I',t,r); END IF; END LOOP; END LOOP; END $$;
COMMIT;
