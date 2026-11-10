# Production release checklist

- [ ] Owner privately completes staged MFA rotation at `/en/security`, saves new recovery codes, signs in with the replacement factor and verifies logout. Never share secrets in chat. Rotation revokes all existing sessions.
- [ ] Configure managed production PostgreSQL with TLS, reviewed pooling/direct URLs and least-privilege runtime access. Keep local PostgreSQL private. Review existing additive migrations, backup/restore and rollback before requesting explicit production migration approval.
- [ ] Link the intended Vercel project/branch and HTTPS domain. Configure production database URL, stable unique authentication secret, exact HTTPS `BETTER_AUTH_URL`, business/MFA flags and approved public content. Set the production authentication verification flag only after verification on the intended production configuration.
- [ ] Configure private object storage and validate uploads before enabling media mutations or issued-PDF archival. Current PDF workflow prints/downloads authorized immutable snapshots; files are not archived in storage.
- [ ] Confirm launch scope: basic customer register, manual audited stock adjustments, services/CMS, reviewed sales/payment records and documents. Advanced CRM, automatic stock fulfilment, trend analytics, email delivery and other unavailable modules remain incomplete/disabled.
- [ ] Verify authorized/denied staff roles, Root MFA/session handling, content publication, inquiries and issued documents against the release environment. Approve content and manual payment methods; never import verification transactions.
- [ ] Obtain separate explicit approval for production migrations, Git commit/push and deployment. No such operations have been performed.

Local verification and precise continuation status: [phase-b-status.md](./phase-b-status.md).

## Storage and deployment configuration prepared

- Local implementation now supports sanitized private/public images, permission-checked downloads, and append-only issued-PDF archival using existing tables. S3-compatible production storage still needs real-provider verification. Never set a public bucket policy.
- Configure the private server-only values listed in [.env.example](../.env.example): managed DATABASE_URL and DIRECT_URL with TLS, HTTPS BETTER_AUTH_URL, S3 endpoint/region/bucket/scoped access keys, and a private wss:// Chromium CDP endpoint for PDF rendering. Runtime storage credentials need GetObject/PutObject on images/* and documents/*, not DeleteObject. Enable versioning/retention in the provider for recovery; application checksums detect file changes.
- Preserve the existing BETTER_AUTH_SECRET privately when transferring the existing Root account and encrypted MFA records. Do not replace that key casually. Complete owner MFA rotation before approving transfer of the existing database/content and audit history. Keep the verification database separate.
- Run `node scripts/release-preflight.mjs` in the intended environment; it prints missing setting names, never secret values. The local environment intentionally fails production preflight.
- CI verification is prepared in [.github/workflows/verify.yml](../.github/workflows/verify.yml). It cannot migrate or deploy. [vercel.json](../vercel.json) disables automatic Git deployments until explicit deployment approval; remove that block only when approved, or use an explicitly approved manual deployment. No Vercel project settings were changed remotely.
- Before any approved production migration/import, enable provider PITR and export a fresh backup, verify a restore into an isolated non-production database, record source/target counts and archive checksums, and obtain target-specific approval. The existing migration history and both composite document-version guards must be preserved. Never reset or run schema-diff drops.
- Rollback: retain the previous Vercel deployment and switch traffic back if the application fails. Do not reverse additive migrations automatically. Recover data only through a separately approved restore into a new database, preserving post-cutover transactions and object versions.
- Current remote staging branch and local HEAD are ddc6898526e3de45abe71c071896d8d89cb4e16d; the new work remains uncommitted. Public review homepage responds 200, while /en/login and /api/admin/me respond 404: the connected application is not live there. Vercel project settings and cloud credentials cannot be verified without owner account access.

- Media records use logical bucket tag aia-private-v1. If local uploads exist before cutover, copy exact private object keys to the configured S3 bucket and verify SHA-256 against each MediaAsset before switching traffic. Do not rewrite append-only issued metadata. Keep the original files/backup for rollback.
- Git deployment gating follows the official [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration). It requires a deliberate approved deployment action.
