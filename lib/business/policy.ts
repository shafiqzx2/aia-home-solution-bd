export type Permission =
  | "requests.read"
  | "quotes.edit"
  | "quotes.approve"
  | "quotes.issue"
  | "documents.edit"
  | "email.send"
  | "settings.edit";
export type Principal = {
  id: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER";
  permissions: readonly Permission[];
};

// No provider exists in Phase A. Production code must never accept a principal
// supplied by browser input. Session verification belongs in a server-only adapter.
export function may(
  principal: Principal | null,
  permission: Permission,
): boolean {
  return (
    !!principal &&
    (principal.role === "SUPER_ADMIN" ||
      (principal.role !== "CUSTOMER" &&
        principal.permissions.includes(permission)))
  );
}
export type QuoteStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "ISSUED"
  | "SENT"
  | "VIEWED"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";
const transitions: Record<QuoteStatus, readonly QuoteStatus[]> = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["DRAFT", "APPROVED"],
  APPROVED: ["DRAFT", "ISSUED"],
  ISSUED: ["SENT", "EXPIRED"],
  SENT: ["VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"],
  VIEWED: ["ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};
export function assertQuoteTransition(
  from: QuoteStatus,
  to: QuoteStatus,
  principal: Principal | null,
): void {
  const permission =
    to === "APPROVED"
      ? "quotes.approve"
      : to === "ISSUED"
        ? "quotes.issue"
        : "quotes.edit";
  if (!may(principal, permission) || !transitions[from].includes(to))
    throw new Error("Quotation action is not authorized.");
}
export function canReadIssuedQuote(
  principal: Principal | null,
  grantedUserId: string | null,
  status: QuoteStatus,
): boolean {
  return (
    !!principal &&
    principal.id === grantedUserId &&
    ["ISSUED", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"].includes(
      status,
    )
  );
}
export function eligibleClaim(input: {
  verifiedContact: boolean;
  referenceProof: boolean;
  conflict: boolean;
  alreadyOwned: boolean;
  expired: boolean;
}): boolean {
  return (
    input.verifiedContact &&
    input.referenceProof &&
    !input.conflict &&
    !input.alreadyOwned &&
    !input.expired
  );
}
