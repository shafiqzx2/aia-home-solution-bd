export type QuoteLine = {
  id: string;
  code: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
};
export type QuoteInput = {
  items: QuoteLine[];
  discount: string;
  taxPercent: string;
  charges: string;
};
const ZERO = BigInt(0),
  TEN_THOUSAND = BigInt(10000);
const LIMIT = BigInt("99999999999999"); // 999,999,999,999.99 BDT

function scaled(value: string, places: number, label: string): bigint {
  if (
    typeof value !== "string" ||
    value.length > 24 ||
    !new RegExp(`^\\d{1,12}(?:\\.\\d{1,${places}})?$`).test(value)
  ) {
    throw new Error(
      `${label}: enter a non-negative decimal with at most ${places} decimal places.`,
    );
  }
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole + fraction.padEnd(places, "0"));
}
function bounded(value: bigint): bigint {
  if (value < ZERO || value > LIMIT)
    throw new Error("Amount exceeds the supported document limit.");
  return value;
}
function round(n: bigint, d: bigint): bigint {
  return (n + d / BigInt(2)) / d;
}
export function amount(value: string): bigint {
  return bounded(scaled(value, 2, "Amount"));
}
export function decimal(value: bigint): string {
  const s = value.toString().padStart(3, "0");
  return `${s.slice(0, -2)}.${s.slice(-2)}`;
}
export function money(value: string): string {
  const [whole, fraction] = decimal(amount(value)).split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction}`;
}

// One half-up rounding per line, then discount, then tax on net goods/services.
// Charges are explicitly outside the tax base in this first policy. Other tax
// policies require a versioned policy implementation before official issuance.
export function calculateQuote(input: QuoteInput) {
  if (!Array.isArray(input.items) || input.items.length > 200)
    throw new Error("Use at most 200 line items.");
  const lineTotals = input.items.map((line) => {
    const q = scaled(line.quantity, 4, "Quantity");
    if (q <= ZERO || q > BigInt("999999990000"))
      throw new Error("Quantity must be between 0.0001 and 99,999,999.");
    return bounded(round(q * amount(line.unitPrice), TEN_THOUSAND));
  });
  const subtotal = bounded(lineTotals.reduce((a, b) => a + b, ZERO));
  const discount = amount(input.discount);
  if (discount > subtotal)
    throw new Error("Discount cannot exceed the subtotal.");
  const rate = scaled(input.taxPercent, 2, "Tax percentage");
  if (rate > TEN_THOUSAND)
    throw new Error("Tax percentage cannot exceed 100%.");
  const tax = bounded(round((subtotal - discount) * rate, TEN_THOUSAND));
  const charges = amount(input.charges);
  const total = bounded(subtotal - discount + tax + charges);
  return {
    subtotal: decimal(subtotal),
    discount: decimal(discount),
    tax: decimal(tax),
    charges: decimal(charges),
    total: decimal(total),
  };
}
export function lineTotal(line: QuoteLine): string {
  return calculateQuote({
    items: [line],
    discount: "0",
    taxPercent: "0",
    charges: "0",
  }).total;
}
