# Existing-project Preview release checklist — November 13, 2026

Local implementation, isolated workflow tests and premium dark/light UI evidence are recorded in [phase-b-status.md](./phase-b-status.md). Earlier remote observations there are historical. Local HEAD and the read-only GitHub branch lookup confirm `7a17bcb` on `staging/vercel-preview`; subsequent implementation remains uncommitted. The owner reports that commit's Preview was Ready. Current Vercel environment and latest deployment have not been independently verified.

## Required owner configuration

- [ ] Personally rotate the previously exposed MFA at `/en/security`, save new recovery codes privately, then verify fresh Root login/logout. Existing onboarding is complete: do not create another Root, reuse old invitation tokens, reset MFA or disclose credentials.
- [ ] Use the existing Vercel project **aia-home-solution-bd**. Confirm its Git repository/branch and exact Preview URL. Keep Preview database and private storage separate from Production. Do not alter existing production domains or services.
- [ ] Provision managed PostgreSQL with TLS: privately configure pooled `DATABASE_URL` and migration-capable `DIRECT_URL`. Never expose local PostgreSQL. Preserve the original source records, Root, audit history and migration history; never import the isolated verification database.
- [ ] Preserve the **existing** `BETTER_AUTH_SECRET` when transferring encrypted MFA. Set exact HTTPS `BETTER_AUTH_URL`, `AIA_BUSINESS_ENABLED=true`, `AIA_MFA_ENABLED=true`. Set `AIA_PRODUCTION_AUTH_VERIFIED=true` only after actual target security/owner verification; production authentication fails closed otherwise. Preview requires HTTPS and must also undergo MFA/permission verification before promotion.
- [ ] Configure server-only private S3 settings from [.env.example](../.env.example): bucket, optional HTTPS endpoint, region, path-style setting and scoped access keys. Grant GetObject/PutObject for `images/*`, `documents/*`, **`resumes/*`**, without public access or DeleteObject. Verify policies/access before `AIA_STORAGE_PRIVATE_VERIFIED=true`; set `AIA_STORAGE_DRIVER=s3`. Enable provider versioning/retention.
- [ ] Configure private `AIA_PDF_BROWSER_WS` using a WSS Chromium CDP endpoint. Windows Edge/local disk are not cloud fallbacks. Verify English/Bengali A4 rendering, branding/fonts, private archival, checksum/download permissions and the route's 60-second budget on the actual Preview.
- [ ] Keep `AIA_EMAIL_SENDING_ENABLED=false` and `AIA_EMAIL_PROVIDER_VERIFIED=false`. Provider/domain/sender verification, signed webhook and authenticated POST worker schedule require separate verification/approval before sending. No external email was sent in local tests. PDF resumes remain quarantined and unavailable for download until a verified scanning/release integration exists; sanitized image/plain-text resumes work privately.

## Data transfer and migrations — approval required

1. Review all eight folders in [prisma/migrations](../prisma/migrations) against the chosen target's `_prisma_migrations`. A restored current source already includes them; an older cloud database may not. Do not rerun applied SQL manually.
2. After personal MFA rotation and before cutover, take a fresh encrypted/private source backup and any existing target backup, record SHA-256/manifests, enable provider PITR, and verify restore into a **new isolated database**. Prior local restore verification is retained; it does not prove the cloud target is recoverable.
3. Obtain target-specific approval for import/production migration. Preserve both composite document/quotation version foreign keys and frozen-document triggers. Never use reset, db push, migrate dev, diff-generated drops or demo seeding on a release database.
4. After approval only: run `pnpm exec prisma migrate status`, then `pnpm db:deploy` with the reviewed target environment loaded privately. Build generates Prisma, builds Next and packages/verifies PDF font traces; it does **not** migrate. With business features enabled, public CMS prerendering needs the migrated database reachable from the Vercel build as well as runtime. Separate runtime and migration credentials as supported by the provider.
5. Transfer any source assets with exact private object keys; logical bucket tag `aia-private-v1` is stable. Verify every MediaAsset checksum; do not rewrite immutable metadata. Retain original objects and backup for rollback.

## Safe GitHub update and existing Vercel Preview

- [ ] Review `git status --short`, `git diff --check`, then the intended source/test/migration changes. Include new imported files and all five new migration folders. Keep `.env*` (except the blank example), `.onboarding`, `.media`, backups, dumps, `.vercel`, caches and local evidence screenshots/PDFs out of the release commit. Do not blindly stage everything. No changes have been discarded or newly staged by this review.
- [ ] Obtain explicit commit/push approval, review the staged diff for secrets/private identities, then update the existing `staging/vercel-preview` branch. [CI](../.github/workflows/verify.yml) verifies PRs/manual runs and cannot migrate/deploy.
- [ ] Run `node scripts/release-preflight.mjs --env-file PRIVATE_PREVIEW_ENV_FILE` against a separately supplied ignored private file. It prints setting names only and changes nothing. Passing configuration checks is **not** runtime approval. Local development settings intentionally fail cloud preflight; remote settings remain unknown until supplied/inspected.
- [ ] Obtain separate Preview deployment approval. [vercel.json](../vercel.json) currently disables automatic Git deployment. Use an explicitly approved manual **Preview** on the existing project, or approve changing that gate. Local `.vercel/project.json` is needed for CLI linkage only; its absence does not mean the existing cloud project is missing.
- [ ] On the exact Preview URL verify Root MFA/session/logout, permitted/denied users, persisted CMS publishing/public bilingual pages, requests, documents/payment/stock invariants and private upload/PDF retrieval. Use isolated Preview records, never production financial test transactions. Inspect function logs for sanitized failures. Owner must perform actual Root credential verification privately.
- [ ] Only after connected Preview passes, request separate approval for production environment changes, import/migrations and Production deployment/promotion. A Ready build alone does not verify the Management System backend.

## Rollback

Retain the previous Production deployment/domain mapping and approve switching traffic back if necessary. Do not automatically reverse additive migrations. Recover data only through a separately approved restore into a new database; preserve transactions written since cutover and object versions. Never reset the original database or overwrite the only backup.

No commit, push, cloud migration, deployment or remote configuration change is authorized by this checklist.
