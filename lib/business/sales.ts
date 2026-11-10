import { amount, calculateQuote, decimal, type QuoteLine } from "./finance.ts";
import { emptyQuotation, type QuotationDraft } from "./documents.ts";

export type SalesDocumentKind = "MEMO" | "INVOICE" | "RECEIPT" | "CHALLAN";
export type PaymentEntry = {
  id: string;
  amount: string;
  method: "CASH" | "BANK_TRANSFER" | "MOBILE_FINANCE";
  state: "POSTED" | "VOIDED";
  date: string;
  reference: string;
  demo: boolean;
};
export type SalesDraft = QuotationDraft & {
  kind: SalesDocumentKind;
  sourceQuotation: string | null;
  payments: PaymentEntry[];
  issuer: string;
  demo: boolean;
};
export function emptyMemo(kind: SalesDocumentKind = "MEMO"): SalesDraft {
  return {
    ...emptyQuotation(),
    kind,
    sourceQuotation: null,
    payments: [],
    issuer: "",
    demo: true,
  };
}
export function quotationToMemo(source: {
  id: string;
  status: "APPROVED" | "ISSUED" | "DRAFT";
  demo: true;
  draft: QuotationDraft;
}): SalesDraft {
  if (source.status !== "APPROVED" && source.status !== "ISSUED")
    throw new Error(
      "Select an approved or issued demonstration quotation. Draft offers cannot be converted.",
    );
  calculateQuote(source.draft);
  return {
    ...structuredClone(source.draft),
    items: source.draft.items.map((line, i) => ({
      ...line,
      id: `memo-${source.id}-${i}`,
    })),
    kind: "MEMO",
    sourceQuotation: source.id,
    payments: [],
    issuer: "",
    demo: true,
  };
}
export function paymentSummary(total: string, payments: PaymentEntry[]) {
  const ids = new Set<string>();
  let paid = BigInt(0);
  for (const p of payments) {
    if (ids.has(p.id))
      throw new Error(
        "Duplicate payment reference. A payment can only be counted once.",
      );
    ids.add(p.id);
    const value = amount(p.amount);
    if (value <= BigInt(0)) throw new Error("Payment amount must be positive.");
    if (p.state === "POSTED") paid += value;
  }
  const due = amount(total);
  if (paid > due)
    throw new Error(
      "Payments exceed this document total. Record an allocation, credit or refund separately.",
    );
  return {
    paid: decimal(paid),
    balance: decimal(due - paid),
    status: paid === BigInt(0) ? "UNPAID" : paid === due ? "PAID" : "PARTIAL",
  } as const;
}
export function validateMemo(draft: SalesDraft) {
  if (
    !draft.client.trim() ||
    draft.items.length === 0 ||
    draft.items.some((i) => !i.description.trim())
  )
    throw new Error("Enter a client and at least one described item.");
  if (
    draft.kind === "RECEIPT" &&
    !draft.payments.some((p) => p.state === "POSTED")
  )
    throw new Error("A receipt requires a recorded demonstration payment.");
  const totals = calculateQuote(draft);
  return { ...totals, ...paymentSummary(totals.total, draft.payments) };
}
export type DemoSale = {
  id: string;
  customerId: string;
  customer: string;
  date: string;
  items: QuoteLine[];
  discount: string;
  taxPercent: string;
  charges: string;
  status: "COMMITTED" | "VOIDED";
  payments: PaymentEntry[];
  demo: true;
};
export function aggregateSales(sales: DemoSale[], start: string, end: string) {
  let total = BigInt(0),
    paid = BigInt(0),
    count = 0;
  const paymentIds = new Set<string>();
  const products = new Map<
    string,
    { code: string; name: string; quantity: number; value: bigint }
  >();
  for (const sale of sales) {
    if (sale.status !== "COMMITTED" || sale.date < start || sale.date > end)
      continue;
    for (const p of sale.payments) {
      if (paymentIds.has(p.id))
        throw Error("A payment cannot be allocated to multiple demo sales.");
      paymentIds.add(p.id);
    }
    const sum = calculateQuote(sale),
      payment = paymentSummary(sum.total, sale.payments);
    total += amount(sum.total);
    paid += amount(payment.paid);
    count++;
    for (const item of sale.items) {
      const row = products.get(item.code) || {
        code: item.code,
        name: item.description,
        quantity: 0,
        value: BigInt(0),
      };
      row.quantity += Number(item.quantity);
      row.value += amount(
        calculateQuote({
          items: [item],
          discount: "0",
          taxPercent: "0",
          charges: "0",
        }).total,
      );
      products.set(item.code, row);
    }
  }
  return {
    total: decimal(total),
    paid: decimal(paid),
    outstanding: decimal(total - paid),
    count,
    products: [...products.values()]
      .map((p) => ({ ...p, value: decimal(p.value) }))
      .sort((a, b) => (amount(a.value) > amount(b.value) ? -1 : 1)),
  };
}
