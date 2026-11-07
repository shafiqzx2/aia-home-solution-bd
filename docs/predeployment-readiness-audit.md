# Pre-deployment readiness audit

Date: 2026-11-07. Target: initial Vercel Preview, then real CMS implementation, then a separately approved production launch.

Follow-up: the [safe Preview preparation record](./vercel-preview-preparation.md) documents the subsequently implemented exclusions, build/runtime pins, draft wording, healthcheck, and controlled deployment configuration. This audit remains the original inspection snapshot; use the follow-up for current preparation status.

## Decision

**Conditional readiness for a protected, frontend-only Preview after the preparation items below. Not ready for real customer submission, CMS use, or production launch.** The current checkout must not be uploaded or broadly staged while its plaintext credential file remains unexcluded.

The unified customer/admin login was inspected and preserved. It is one shared **disabled preview**, not an implemented authentication system. There is no second login system to add: implement credential verification, sessions, and stored-role authorization behind this existing screen.

This audit changed no application source, credentials, schema, migrations, database, branch, or cloud configuration. It generated local build artifacts, exercised synthetic data in isolated browser contexts, and started/stopped a temporary loopback-only production server. The existing development server was left running. This report is the only new repository document; it has not been staged or committed.

## 1. Git and inspected scope

- Read [AGENTS.md](../AGENTS.md) and the installed Next.js guides before checking framework behavior.
- Current branch: `main`. Local HEAD and `origin/main` both point to `bd973366c2e41cc0ed06300b14e8decfcb1a3ae4`. A read-only remote-ref query confirmed the remote main tip matches; no fetch, commit, push, or branch operation was performed.
- Before this report, seven tracked paths differed from `origin/main`: [README](../README.md), [favicon](../app/favicon.ico), [global styles](../app/globals.css), the removed former root layout/page, [database guide](./database.md), and [deployment guide](./deployment.md). The removed root pages are replaced by localized routes, not missing features.
- There were **68 untracked files**, including the localized app routes, components, content/cart/request libraries, media/fonts, plans, and the local credential file. A tracked-only `git diff` omits these files and therefore does not represent the whole proposed deployment.
- The existing unified login, proxy, application routes/components, Prisma schema/migration, environment names, package/lock configuration, Docker setup, storage plans, and relevant official deployment documentation were inspected.

The remote branch contains the earlier database foundation; it does not yet contain the current working frontend. A future staging commit needs an explicit reviewed file manifest including additions and intended deletions.

## 2. Implemented and working

| Area | Observed implementation |
| --- | --- |
| Public site | English/Bengali localized pages, product/service concepts, detail routes, projects, contacts, themes, shared navigation/footer, and honest content/empty states. |
| Unified login | [Shared login UI](../components/auth/login-panel.tsx) and [localized login route](../app/[lang]/login/page.tsx). Username/password fields and sign-in action are disabled; no credentials are transmitted. [Proxy](../proxy.ts) redirects legacy localized admin-login URLs to the shared page. |
| Cart | [Client cart](../lib/cart.ts) stores product IDs/quantities, merges duplicate products, validates published static IDs, caps quantities, and handles storage errors. Production smoke: duplicate additions persisted as quantity 2 after navigation/reload; entering 1000 capped at 99. |
| Consultation/booking preview | [Request flow](../components/site/request-flow.tsx) supports direct, product/cart, service-only, and custom-service selection. Client validation, Dhaka date rules, review, and local document preparation exist. Real submission is disabled. |
| Documents | Local print DOM includes synthetic request details and an explicit unsubmitted draft label; its print container detaches after leaving the route. This audit checked the print DOM, not a newly exported PDF or physical printer. |
| Media | Three local concept WebP images and CSS/SVG illustrations render. Images currently use application-hosted assets and default Next image optimization. |
| Database tooling | Prisma client/schema, one initial technical-probe migration, local PostgreSQL configuration, backup/restore helpers, and mock restore safety tests exist. Live connectivity is currently unavailable. |
| Deployment foundation | Next.js standalone build and a multi-stage, non-root Docker runner exist. A fresh local production build and temporary standalone server both started successfully. |

Contact and floating WhatsApp links no longer show the former verification disclaimer. Facebook, Instagram, and YouTube links are still absent because `company.social` in [public content](../lib/public-content.ts) is empty and exact owner profile URLs have not been supplied.

## 3. Missing implementation and security findings

| Priority / gate | Finding and evidence | Required action |
| --- | --- | --- |
| P0: before staging/upload | [Local R2 credential file](../cf-r2-cred.txt) is untracked and not excluded by [Git exclusions](../.gitignore) or [Docker exclusions](../.dockerignore). No Vercel CLI exclusion file exists. The credential file was not found in public assets or the standalone root, and no tracked history for it was found; that does not make a broad upload safe. | Add an exact file exclusion to Git, Docker, and any CLI deployment packaging. Keep credentials outside staged/deployed source and use private environment configuration when integration exists. Review the entire staged/upload manifest. No credential relocation or rotation was performed. |
| P1: before real CMS/auth | No auth provider, password verification/hashing, session storage/cookies, role records, admin guard, account area, CMS pages, or protected business API/action exists. [Login fields/actions](../components/auth/login-panel.tsx) are disabled; [proxy](../proxy.ts) handles routing only. | Preserve this one login page; implement server-side credential verification and session lifecycle, then load stored roles and authorize each protected page/action/API. Never infer admin status from username text or a client-selected role. A redirect is not authorization. Keep sign-in disabled until this exists. |
| P1: before integrated staging | No Supabase connection is configured in inspected local environments; their database URLs target the local database. No R2 upload/download implementation or S3-compatible SDK is installed. | Provision/configure isolated Preview services only after approval; implement and verify adapters, grants, media lifecycle, and storage metadata. Do not copy local DB URLs/passwords into Vercel. |
| P1: before personal-data preview testing | Request copy says leaving clears details, but a synthetic filled draft survived client navigation away and browser Back in production. No matching customer marker was found in localStorage/sessionStorage. | Either clear the draft on route exit/Activity deactivation, or explicitly describe the actual in-memory/back-navigation retention and provide a clear/reset action. Recheck print and locale handoff after the chosen change. |
| P1: build reproducibility | [Build script](../package.json) runs only `next build`; there is no explicit Prisma generation hook or Node engine pin. Local success uses existing dependencies/generated client. | Pin Node 24.x, honor pnpm 12.16.1, use the frozen lockfile, and explicitly generate Prisma Client during the deployment build. Validate a clean Linux/Vercel install. Never add migrations to every Preview build. |
| P1: Preview access | No application authentication is protecting the site. Actual Vercel account/project settings were not accessed or certified. | Enable Vercel Deployment Protection for the Preview and verify it on the deployed URL. Keep all forms honest about unavailable submissions and use synthetic data only. Platform preview protection does not replace future application RBAC. |
| P1: before Docker/VPS release | [Docker healthcheck](../Dockerfile) requests `/` and requires 200; current [locale proxy](../proxy.ts) makes `/` return 307 to `/en`. | Point liveness at `/en` or a dedicated inexpensive health endpoint with the expected status. Rebuild/test the Linux container before VPS release. |
| P2: before full backend launch | No business Route Handlers, Server Actions, catalog/customer/request/CMS tables, real submissions, notifications, private document storage, or durable worker/outbox processing exist. | Implement the reviewed schema, authorization, transactional writes, idempotency, and durable job flow before enabling controls. |
| P2: performance | Full business arrays feed clients; filtering is browser-side; detail routes/static parameters are array-derived. Cache flags are enabled but there are no business cache selectors/tags, database pagination, or Redis integration. | Implement bounded localized card/detail/picker projections, stable server pagination, current-publication validation, and post-commit invalidation. CMS publishing must not depend on rebuilding a frozen slug allowlist. |
| P2: HTTP/SEO hardening | Local production responses lacked application CSP, frame restriction, nosniff, and referrer-policy headers. Public pages lack a whole-site Preview indexing rule; login/cart/request have local robots metadata. Canonicals are relative and there is no `metadataBase`, robots endpoint, or sitemap endpoint. | Verify platform-provided headers after Preview; add tested baseline headers and a CSP compatible with Next hydration/theme initialization. Verify whole-Preview noindex. Configure a deliberate absolute site origin before production SEO. Sitemap/production indexing are later launch work, not a reason to publish Preview. |

No authenticated authorization boundary currently exists to certify as secure. There is also no implemented CMS record endpoint found that exposes private data. This is an **absent security implementation**, not evidence that the disabled UI enforces access control.

Observed API paths returned 404. Nonexistent admin/account paths showed framework not-found behavior; initial streamed responses can carry 200 before later requests return 404, with noindex metadata. Do not mistake this for CMS access or use HTTP status alone as an authorization test. [Next.js documents streamed not-found status behavior](https://nextjs.org/docs/app/api-reference/file-conventions/not-found).

## 4. Actual storage and cache status

| Target | Actual state |
| --- | --- |
| Supabase PostgreSQL | Planned, not integrated. [Schema](../prisma/schema.prisma) contains only `DatabaseHealthCheck`; public pages do not import/query the Prisma client. |
| Cloudflare R2 | Planned, not integrated. Credential material on disk is not an integration. No bucket permissions, CORS, custom media domain, upload finalization, private signed downloads, or cloud connectivity were tested. |
| Direct image CDN delivery | Not implemented. Local production HTML references `/_next/image` and local image sources. Setting a remote source alone would still leave the default optimization proxy. R2 CDN caching requires a configured custom domain/cache behavior. [Cloudflare public bucket guidance](https://developers.cloudflare.com/r2/buckets/public-buckets/). |
| Next caching | Static prerendering/prefetching works; business read caching and mutation invalidation are not implemented. On Vercel, verify a supported shared/remote-cache path rather than assuming a process-local cache spans function instances. [Vercel Cache Components guidance](https://vercel.com/academy/nextjs-foundations/cache-components). |
| Redis | Not installed/configured and not required for the current frontend Preview. Introduce only with a defined shared cache/rate-limit contract. |
| Backups | Local Compose tools exist. They do not follow a remote database URL and are not a tested Supabase recovery solution. PostgreSQL backups do not include R2 bytes. |

The existing [storage plan](./data-store-logic.md) and [request backend plan](./request-backend-plan.md) remain implementation proposals. They must not be described as deployed functionality.

## 5. Environment variable names

Names only are listed below; no secret values or connection strings are included.

### Existing code and local tooling

| Context | Names | Status |
| --- | --- | --- |
| Prisma schema/database checks | `DATABASE_URL` | Existing required DB input when validating/connecting through Prisma. Local settings currently target loopback PostgreSQL. Current public rendering does not query it. |
| Next runtime | `NODE_ENV` | Platform-managed on Vercel; do not copy the local setting into project secrets. |
| Optional telemetry control | `NEXT_TELEMETRY_DISABLED` | Existing optional setting. |
| Vercel package-manager pinning | `ENABLE_EXPERIMENTAL_COREPACK` | Proposed build setting if Corepack is used to honor the existing packageManager pin; not currently read by application code. |
| Local Compose only | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` | Do not transfer these local database-bootstrap settings to Vercel. |
| Standalone/Docker only | `PORT`, `HOSTNAME` | Runtime/container binding settings, not Vercel business credentials. |

No current application code consumes Supabase API keys, R2 settings, Redis settings, or auth secrets. The successful local build loaded local environment files; it was not a clean Vercel build with an empty environment. A frontend-only Preview does not need newly invented Supabase/R2/auth credentials to render its present static content.

### Proposed contract for the later implementation

These are exact proposed names, **not existing requirements already implemented**:

| Feature | Proposed names |
| --- | --- |
| Runtime PostgreSQL and separate migration connection | `DATABASE_URL`, `DIRECT_URL` |
| R2 adapter and public media origin | `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_BUCKET`, `R2_PRIVATE_BUCKET`, `R2_PUBLIC_BASE_URL` |
| Portable absolute app origin | `APP_URL` |
| Optional Redis | `REDIS_URL` |

Authentication variables cannot be finalized until the provider/session implementation is chosen. The current screen does not imply that Supabase Auth, Auth.js, or a custom session secret already exists. Do not add provider-specific secrets speculatively. Worker authentication/scheduling requirements likewise follow the selected executor. No database, R2 secret, Redis credential, or session signing material may use a `NEXT_PUBLIC_` name. Preview and Production must use separate resources/credentials.

## 6. Prisma and migrations

- One on-disk migration exists: [initial technical-probe SQL](../prisma/migrations/20261107000000_initial/migration.sql).
- Prisma schema validation passed.
- Read-only migration status failed with `P1001`; a direct TCP check returned `ECONNREFUSED` against the configured local target. A read-only transaction could not connect either. Applied migrations and live drift therefore remain **unverified**, not “up to date.” No database/container was started to make the test pass.
- **No new migration is required for a frontend-only Preview.** Existing public pages have no DB dependency. Do not automatically apply the initial migration to an unknown Supabase project.
- Real backend work needs reviewed additive migrations for business content/translations/categories/relationships/media metadata, account/role mappings and sessions as appropriate to the auth design, requests/snapshots/status/history, idempotency, audit, and durable jobs/outbox. Add appropriate indexes, constraints, grants/private-schema or RLS policies.
- Add Prisma datasource `directUrl` support when introducing `DIRECT_URL`; it is absent today. Runtime pooling and the migration connection must be selected/tested for Prisma 6 and the actual Supabase pool mode. [Prisma 6 Supabase connection guidance](https://www.prisma.io/docs/orm/v6/overview/databases/supabase).
- Use a separate staging database/project, review migration SQL and imports, verify backup/restore, and obtain explicit migration approval before executing anything. Do not use reset, `db push`, or per-build migration execution as a shortcut.

## 7. Exact preparation before Vercel Preview

1. **Exclude private material first.** Add the exact credential-file exclusion to Git and Docker; add a reviewed CLI deployment exclusion file if using CLI uploads, including private env/backup/generated-output exclusions. Do not upload the generated standalone folder: this local standalone build contains a copied environment file. The public-artifact scan found no known secret matches, but generated server output is still private build material.
2. **Review the complete working-tree manifest.** Include intended localized routes, components, libraries, fonts/licenses, media, proxy and docs, plus intentional removal of the old root routes. Keep the credential file and real environments out. Do not use broad staging in this checkout before exclusions are fixed.
3. **Make build inputs explicit.** Pin Node 24.x in the package engine/project settings and retain pnpm 12.16.1 with its lockfile/build approvals. Vercel lists Node 24 and pnpm 12 support; ensure the exact package manager is selected, rather than relying on lockfile-version inference. [Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [package managers](https://vercel.com/docs/package-managers).
4. **Generate Prisma Client deterministically.** Proposed package build command: `prisma generate && next build`, or equivalent explicit Vercel build preparation. Keep migration commands separate. Existing Docker already generates the client, but the package build does not. [Prisma 6 Vercel build guidance](https://www.prisma.io/docs/orm/v6/prisma-client/deployment/serverless/deploy-to-vercel).
5. **Use native Next.js hosting settings.** Vercel root is this repository root, framework preset Next.js, normal Next output detection, and a frozen install using the pinned manager. Do not configure Vercel's output directory as the standalone subfolder or run the Dockerfile there. Preserve standalone generation for Docker; audit found no need to replace the framework or duplicate it. Verify the first real Linux build and function/asset tracing.
6. **Protect and label the Preview.** Enable Deployment Protection; verify the whole Preview sends noindex and is not mapped to a production domain. Leave login/submission disabled, and fix the draft retention mismatch or use synthetic inputs only pending that fix. Vercel provides Preview protection and Preview noindex behavior, but the actual project must be checked. [Protection](https://vercel.com/docs/deployment-protection), [response headers](https://vercel.com/docs/headers/response-headers).
7. **Choose the Preview scope explicitly.** For frontend review, Supabase/R2 can remain deferred with honest disabled controls. If the Preview must demonstrate the target architecture, first implement isolated Supabase reads and R2 direct delivery/metadata; add real writes only after auth, validation, retention, and jobs exist. Do not present the frontend-only deployment as a working CMS.
8. **Repeat checks on the exact approved branch.** Frozen clean install, lint, TypeScript, production build, dependency advisories, asset/routing/mobile/cart/request checks, and exclusion/staged-diff review. Add CI for these checks when preparing the readiness patch. No real customer data or production secrets in CI/Preview.

Static application pages, Proxy locale redirects, Next Image, fonts, Suspense and Cache Components built locally. Vercel documents Next.js Cache Components support; actual project adapter/function behavior still needs the first protected deployment smoke test. [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

## 8. Proposed staging branch and deployment workflow

Proposed branch: `staging/vercel-preview`. It has **not** been created.

1. Approve a concrete readiness patch covering the exclusions/build settings and the selected Preview scope. Carry the current uncommitted work onto the proposed branch without resetting or discarding it.
2. Review an explicit staging manifest and full staged diff; run a secret scan and checks. Keep `main` unchanged until a reviewed merge is appropriate. Commit and push only with explicit approval.
3. Configure/link the intended Vercel project only with approval. Start with automatic Git deployments disabled so a source-control action cannot accidentally publish; Vercel supports `git.deploymentEnabled: false`. Verify the project's Production branch, scopes, root/runtime/build settings, and Preview protection. Do not treat an initial Git import as guaranteed to be Preview-only. [Git deployment controls](https://vercel.com/docs/project-configuration/git-configuration).
4. After separate deployment approval, target **Preview explicitly**, for example `vercel deploy --target=preview`, against the reviewed commit/checkout with exclusions verified. Do not use production promotion or a production flag. The CLI target is documented; no deployment command was executed here. [Deploy targets](https://vercel.com/docs/cli/deploy).
5. Verify environment/domain assignment, denied unauthenticated Preview access, noindex, EN/BN routes, redirects/unknown routes, image/font delivery, layout, cart, local forms/documents, console errors and logs on the actual Preview URL. Keep approved deployment/commit identifiers for reproducibility.
6. Implement CMS features in small feature branches against isolated staging services. Only then consider opt-in automatic previews for approved branches. Production deployment/domain changes, migrations, and merging remain separate approvals.

An initial Preview rollback simply retains/redeploys the previous reviewed frontend. Once staging/production accepts durable writes, rollback must preserve new requests and compatible schema/media versions; reverting code is not a database rollback.

## 9. CMS functions to implement next

| Order | Function | Prerequisites and boundary |
| --- | --- | --- |
| 1 | Real shared login, logout, session expiry/revocation, staff/customer destination selection, role permissions and audit | Reuse existing login UI. Verify credentials server-side, use secure cookie/session handling and generic failures/throttling; enforce roles on every operation. Administrator provisioning is a controlled server operation, never a public role selector. |
| 2 | Categories/subcategories and product/service CRUD, bilingual fields, publication and ordering | Reviewed Supabase schema, uniqueness/FKs/indexes, role-protected mutations, small public DTOs and pagination. Preserve no-public-pricing and concept labels. |
| 3 | R2 media library, logo slots, approved imagery and private documents | Public/private buckets, validated quarantine/finalization, immutable variants/URLs, reference-safe cleanup, authorized signed private downloads and metadata in PostgreSQL. |
| 4 | Company/contact/social/homepage settings, featured collections, projects, real jobs, consented reviews/logos/metrics | Approval/consent gates, explicit URLs/provenance, locale-aware projections, post-commit cache invalidation. Empty content remains empty. |
| 5 | Durable request submission and staff inbox/detail/status history | Server validation, current selected-ID lookup, atomic snapshots/idempotency/outbox, private/no-store responses, paging, retention and authorization. No appointment is confirmed simply by requesting a time. |
| 6 | Assignments, private quotations, reporting and notification/document jobs | Reliable workers/retries, permission checks, audit, recovery and operational monitoring. Redis only when justified, with shared invalidation tested. |

## 10. Docker/VPS portability

The current Docker design is a useful foundation: Node 24 Debian/OpenSSL-compatible stages, frozen pnpm install, Prisma generation, standalone output, copied static/public assets, a non-root runner, and persistent local PostgreSQL outside the repository. The audit did not rebuild a Linux container or modify Docker resources.

Before VPS use: fix the root-redirect healthcheck, rebuild on the target Linux architecture, verify the Prisma engine and image processing, configure TLS/reverse proxy/runtime secrets, and test backups/restore. Use the existing standalone server startup rather than assuming the package's `next start` command is the Docker entrypoint. Standalone output requires static/public assets to be copied; the Dockerfile already does this. [Next standalone guidance](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

Keep Supabase/R2 access behind portable server repositories. A move to VPS does not require moving the database or media provider. Do not rely on Vercel ephemeral filesystem storage or request-lifetime background work for uploads, PDFs, idempotency, or jobs. Multiple VPS replicas need shared cache/invalidation/worker coordination and a connection budget; Redis is optional, correct cross-instance behavior is not.

## 11. Verification results and limits

| Check | Result |
| --- | --- |
| `pnpm lint` | Passed. |
| `pnpm exec tsc --noEmit --incremental false` | Passed. |
| `pnpm build` | Passed: Next.js 16.4.4, 66 generated pages, shared login route and Proxy. No business API/CMS route in build output. |
| Prisma schema validation | Passed. |
| Read-only migration/live database checks | Blocked by local connection refusal; applied state not verified. |
| `pnpm db:restore:check` | All 7 mock-only tests passed; no live container/restore. |
| `pnpm audit --prod --json` | Zero reported production dependency advisories at audit time. Not a penetration test or a guarantee against undisclosed issues. |
| Git whitespace check | Passed. |
| Production layout smoke | 32 checks across home EN/BN, product/service lists, login EN/BN, request and cart, at measured CSS widths 320/390/768/1440: no horizontal overflow. |
| Cart/request smoke | Duplicate merge, persistence and 99 cap passed; service-only selected a service without a product; custom-service description required; direct inquiry reached review with disabled submission; no non-read requests in the tested cart/inquiry sequence. |
| Date/phone cases | Five checks passed: impossible date, Dhaka rollover/past date, current date, invalid phone, formatted phone. |
| Draft/privacy | No synthetic customer marker in browser persistent storage; draft nevertheless survived client navigation away/Back, contradicting current copy. |
| Print DOM | Synthetic details and unsubmitted draft label present; container detached after navigation. Print call was intercepted to avoid a system dialog. No new exported PDF verified. |
| Secret checks | Only environment names/presence/target classification were reported. No known database password/URL or hex-like R2 token match in 131 scanned public/build-page artifacts. Credential file is not ignored and local standalone output includes an environment file: fix packaging. This limited scan is not comprehensive. |
| Routing/headers | Locale and legacy login redirects observed; APIs absent; root 307 confirms Docker healthcheck issue; application security headers/whole-site local Preview noindex absent. |

Not certified here: actual Vercel Linux build/runtime/project protection, Supabase project access/RLS/pooling/migration state, R2 permissions/CORS/CDN/private downloads, authenticated role boundaries, real uploads/submission/delivery, comprehensive keyboard/screen-reader/cross-browser testing, physical devices, performance SLOs/load testing, or live recovery. No production launch is authorized by these audit results.
