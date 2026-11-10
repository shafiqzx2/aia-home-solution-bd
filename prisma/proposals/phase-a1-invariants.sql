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
