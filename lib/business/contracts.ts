// Provider-neutral service boundaries; none are connected in Phase A.
export type PrivateAsset = {
  id: string;
  objectKey: string;
  sha256: string;
  mimeType: string;
  bytes: number;
};
export interface DocumentRenderer {
  render(
    html: string,
    options: { format: "A4"; landscape: boolean },
  ): Promise<Uint8Array>;
}
export interface PrivateStorage {
  put(
    bytes: Uint8Array,
    metadata: Omit<PrivateAsset, "id" | "objectKey">,
  ): Promise<PrivateAsset>;
  signedDownload(
    asset: PrivateAsset,
    expiresInSeconds: number,
  ): Promise<string>;
}
export type ReviewedEmail = {
  id: string;
  revision: number;
  approvedRevision: number;
  approvedBy: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  html: string;
  attachmentIds: string[];
};
export interface EmailProvider {
  send(
    email: ReviewedEmail,
    idempotencyKey: string,
  ): Promise<{ providerId: string; state: "ACCEPTED" }>;
  verifyWebhook(
    rawBody: Uint8Array,
    signature: string,
  ): Promise<{
    eventId: string;
    providerId: string;
    state: "DELIVERED" | "FAILED";
  }>;
}
export function assertEmailReviewed(email: ReviewedEmail): void {
  if (
    !email.approvedBy ||
    email.approvedRevision !== email.revision ||
    !email.to.length ||
    !email.subject.trim()
  ) {
    throw new Error(
      "The current email revision requires authorized review before dispatch.",
    );
  }
}
export function renderVariables(
  template: string,
  values: Record<string, string>,
): string {
  const residue = template.replace(/\{\{[^{}]*\}\}/g, "");
  if (/\{\{|\}\}/.test(residue))
    throw new Error("Malformed template variable.");
  return template.replace(/\{\{([^{}]*)\}\}/g, (_, variable: string) => {
    const name = variable.trim();
    if (!/^[a-z_]+$/.test(name))
      throw new Error(`Invalid template variable: ${name}`);
    if (!Object.hasOwn(values, name) || !values[name].trim())
      throw new Error(`Missing template variable: ${name}`);
    return values[name];
  });
}
