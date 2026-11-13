-- Permit stock-only returns of free goods while retaining the posting invariants.
ALTER TABLE "SaleReturn" DROP CONSTRAINT return_state;
ALTER TABLE "SaleReturn" ADD CONSTRAINT return_state CHECK (state IN ('DRAFT','APPROVED','POSTED','CANCELLED') AND credit>=0 AND revision>0 AND ((state='POSTED')=("postedAt" IS NOT NULL)));
ALTER TABLE "InternalTask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CareerApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SaleReturn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SaleReturnItem" ENABLE ROW LEVEL SECURITY;
