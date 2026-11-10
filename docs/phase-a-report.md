# AIA Business Platform — Phase A delivery report

8 November 2026 · Existing repository · Branch `staging/vercel-preview` · Uncommitted local work only.

Phase A delivers a functioning **local review foundation**, an audited architecture, additive schema/SQL proposals, and actual rendered document samples. It does not deliver a connected production business system. No database changes, real approvals, email dispatch, R2 operations, commit, push or deployment occurred.

Open the [local workspace](http://localhost:3000/en/admin-preview) while the development server is running. The Bengali route is [available](http://localhost:3000/bn/admin-preview); admin interface copy remains English in this foundation, while public localization and Bengali document rendering are preserved. The preview cannot be enabled in a production build.

## 1. Existing project audit

| Area inspected | Finding at baseline |
| --- | --- |
| Instructions/Git | Read [AGENTS](../AGENTS.md) and installed Next.js 16.4.4 guides. Branch matched the brief and the working tree was clean. No pre-existing edits were overwritten. |
| Stack | Next.js 16.4.4 App Router, React 19.3, TypeScript, Prisma/Client 6.19, pnpm 12.16.1, Node 24.13. Native Vercel build and opt-in standalone Docker build already existed. |
| Public routes/design | EN/BN public route group, category homepage, catalog quick views, service pages, projects/about/careers/contact, unified login. Official logo variants, Geist/editorial/Bengali fonts, existing charcoal/ivory/gold design. |
| Cart/requests | Cart validates IDs/quantities and persists only selection data in localStorage. Customer request form is one page. Its submission handler explicitly reports that online submission is unavailable; local request documents are supported. No persisted request/reference or confirmed booking exists. |
| Database/migrations | [Active schema](../prisma/schema.prisma) has only DatabaseHealthCheck; one existing technical migration. No customer, quotation, permissions or CMS tables. Existing mock-only backup/restore tests exist. |
| Authentication | Unified disabled login UI; no provider, verified session, role repository, customer portal or working credential verification. |
| APIs/actions | No business API routes/server actions at baseline. No business persistence or authorization integration test could pass because those services did not exist. |
| Documents | Existing customer-prepared request print/PDF component is unpriced and distinct from an official approved quotation. No admin quotation or letter system existed. |
| Settings | Public company details were centralized in a static public-content object; there was no persisted CMS settings editor. |
| Email/R2/Supabase | No email provider, delivery webhook, S3 adapter, R2 media pipeline or Supabase business schema connected in application code. Ignored local credential material is not evidence of a working adapter. Environment variable names/presence were inspected without printing values. No live provider connection was attempted. |
| SEO/deployment | Localized metadata and canonical/alternate URLs, login/request exclusions, protected Preview configuration, portable Dockerfile and backup documentation. No sitemap/robots file generator was found. No remote deployment/account state was changed or certified. |

Reviewed the supplied [Kitchen Hood Dhaka reference](https://www.kitchenhooddhaka.com/) for service-entry, catalog and booking UX. No branding, claims, public prices, copy or design was copied. The existing approved AIA Products/Services pages were preserved.

## 2. Implemented changes and status

| Capability | Status and verified extent |
| --- | --- |
| Admin design system/workspace | **Implemented and verified locally:** official logo, collapsible/sidebar drawer navigation, mobile focus containment/Escape, search shortcut and module search, breadcrumbs, theme control, informative notification/account popovers, responsive surfaces/forms/tables and empty states. |
| Executive dashboard | **Implemented local foundation:** unavailable operational indicators, empty chart/date filters, catalog content counts clearly labeled, module entry points, CRM/operations empty states. No database aggregates or fabricated sales data. |
| Quotation preparation | **Implemented locally:** manual external client entry, catalog/service/custom lines, quantity/unit/private price input, exact financial math, dates/terms, live bilingual A4 preview, tab-local save/duplicate/reopen and JSON export. |
| Documents/email/settings | **Implemented locally:** editable letter drafts, placeholder workbench, branded email drafts, shared company identity and local settings preview. All backend writes/dispatch remain unconnected. |
| Protected entry points | **Implemented and tested:** production/local admin navigation returns a login redirect; admin APIs reject unauthenticated GET/POST/PUT/PATCH/DELETE; local review workspace excluded from production output and marked private/noindex. |
| Schema/architecture | **Prepared and validated offline:** complete domain proposal and ER diagram, generated additive SQL plus invariants, ownership/auth/workflow/provider/backup design. SQL execution and live behavior are unverified. |
| Persistence/auth/providers | **Planned / requires approved configuration and execution:** real Supabase business data, auth library integration, RBAC repositories, claims, issuance, revisions, private R2 files, transactional email and delivery evidence. |

This is not a role-authorized admin session. Static review navigation is not yet role-filtered. Customer/operations pages are explicitly disconnected states, not completed CRUD or maps.

## 3. Files changed

| Purpose | Files |
| --- | --- |
| New routes | [Local review route](../app/[lang]/admin-preview/[[...section]]/page.tsx), [closed admin route](../app/[lang]/admin/[[...section]]/page.tsx), [denied admin API](../app/api/admin/[[...path]]/route.ts). |
| Scoped design | [Admin styles](../app/admin.css). No public catalog/homepage/service design files were rewritten. |
| Modular UI | [Workspace shell](../components/admin/workspace.tsx), [shared UI](../components/admin/ui.tsx), [dashboard](../components/admin/dashboard.tsx), [quotation editor](../components/admin/quotation-editor.tsx), [Document Studio](../components/admin/document-studio.tsx), [Email Center](../components/admin/email-center.tsx), [directories/operations](../components/admin/directories.tsx), [settings](../components/admin/settings.tsx). |
| Domain foundation | [Company settings](../lib/business/company-settings.ts), [finance](../lib/business/finance.ts), [HTML documents](../lib/business/documents.ts), [policy predicates](../lib/business/policy.ts), [provider/template contracts](../lib/business/contracts.ts). |
| Small integration changes | [Public settings re-export](../lib/public-content.ts), [root Suspense boundary](../app/[lang]/layout.tsx), [loading Suspense boundary](../components/site/branded-loading.tsx), [closed-admin proxy](../proxy.ts), [private/noindex headers](../next.config.ts), [review/test scripts](../package.json), [TS test imports](../tsconfig.json), [proposal SQL allowlist](../.gitignore), [README entry point](../README.md). |
| Schema proposals | [Prisma](../prisma/proposals/phase-a.prisma), [generated SQL](../prisma/proposals/phase-a.sql), [extra invariants](../prisma/proposals/invariants.sql). Active schema/migration/lockfile/environment files are unchanged. |
| Reproducible QA | [Offline schema generator](../scripts/phase-a-schema.mjs), [11 domain tests](../scripts/phase-a.test.mjs), [browser/PDF review](../scripts/phase-a-browser.mjs), [local Chromium harness](../scripts/lib/cdp.mjs), [test-only fixtures](../scripts/fixtures/phase-a.mjs). |
| Review deliverables | [Architecture](./phase-a-architecture.md), [ER diagram](./phase-a-schema-erd.md), [migration/backup approval packet](./phase-a-migration-review.md), this report and [visual/PDF evidence](./phase-a-review/README.md). |
| Workspace task repair | Existing parent-workspace [task configuration](../../.vscode/tasks.json) now uses a forward-slash project argument. The task runner had cached its old Bash-invalid argument, so verification used a directly launched local dev server. This file is outside the repository. |

## 4. Database schema and Mermaid ER diagram

The [schema proposal](../prisma/proposals/phase-a.prisma) defines 58 new normalized tables across identity, CRM, catalog/services, operations, quotations, document templates/versions, communication, settings/content/media and outbox jobs. The [generated Mermaid ER diagram](./phase-a-schema-erd.md) records its foreign-key relationships; the [architecture](./phase-a-architecture.md) explains each domain and snapshot boundary.

The [SQL proposal](../prisma/proposals/phase-a.sql) preserves the existing health table, adds typed statuses/indexes/constraints, protects issued versions/children/generated assets, validates issuance against line totals and approved hashes, requires the latest issued pointer, and prepares RLS/revokes. Prisma syntax validates and the schema-to-schema diff is additive. SQL functions/triggers, permissions and concurrent transactions have NOT been run against PostgreSQL. This distinction is intentional.

The proposal is separate from the live schema and deployable migration history. Normal build/deploy scripts cannot apply it. The recommended first migration is a smaller identity/guest-request slice after auth-adapter reconciliation, not unreviewed execution of every proposed table.

## 5. Guest-to-account ownership model

The [ownership design](./phase-a-architecture.md#guest-requests-and-later-account-claiming) requires provider-verified contact ownership, a private request reference plus independent short-lived claim evidence, durable rate limits, one-use hashed challenges, locked transactional ownership checks, conflict handling and audit records. Shared/reassigned contacts and already-owned/incomplete records enter manual review. A contact match alone never claims a request or grants portal access.

The pure policy tests exercise eligibility/visibility rules. Live verification, identity claims, conflict resolution and database isolation remain Phase B work; no historical record has been attached to an account.

## 6. Authentication and permissions architecture

Recommended provider: a pinned, reviewed Better Auth Prisma/PostgreSQL integration; no custom password/session implementation was added. Adapter model details must be reconciled before migration. Unified login remains disabled until real verification exists. Server-only session checks, current scoped role assignments, customer ownership and explicit document grants must protect every repository/API/action. Public registration must not choose privileged roles. Initial Super Admin provisioning is a separate audited operator workflow.

The current production boundary fails closed. Tested responses include 307 to the shared login and 401 for administrative read/write APIs, with private/no-store/noindex headers. These denial tests do not establish working authorized staff access. See [auth details](./phase-a-architecture.md#authentication-and-configurable-permissions).

## 7. Quotation Studio status

Local editor and calculations are implemented. Tax/discount/charge policy is documented in the UI: round each line half-up, subtract fixed discount, calculate tax on net subtotal, then add untaxed charges. Financial values are decimal strings and BigInt internally; test totals retain exact cents up to BDT 999,999,999,999.99. Invalid quantities, precision, excessive discounts/rates/amounts and over-200-line inputs are rejected by the calculation engine.

Drafts can be saved/reopened/duplicated in the current tab and exported. Reload/close discards unexported draft state; no customer draft fields are stored in localStorage. Approval, official issue/download, sequence allocation, database revision/email history and request conversion remain unconnected. No official financial approval was created.

## 8. Manually created quotations

The owner can enter Quotation Studio directly, type an external company/client and recipient, select products/services or custom items, enter quantities/private prices, set terms and dates, and preview/print/export a draft. No incoming request or website account is required. Tested example: two units at BDT 100.25, BDT 10.50 discount, 7.50% tax and BDT 25 charges produces BDT 229.25.

Existing CRM client/organization selectors and new persisted client creation are Phase B/C work. Recipient email does not create customer access. Deliberate verified grants are required later for portal visibility.

## 9. Quotation PDF preview and test results

The reusable [HTML master](../lib/business/documents.ts) uses the official logo, trusted company snapshot, A4 print CSS, table-header repetition, whole totals panels, page numbering, escaped text, embedded/reliably loaded document fonts and Bengali shaping. Draft labels explicitly prevent confusion with issued official quotations. There is no fabricated reference number, signature, seal or legal/payment identifier.

| Actual rendered fixture | Result |
| --- | --- |
| [One-page quotation](./phase-a-review/quotation-1-page.pdf) | Exactly 1 page with one described line, all terms and footer. |
| [Two-page quotation](./phase-a-review/quotation-2-page.pdf) | Exactly 2 pages with 10 lines. |
| [Five-page quotation](./phase-a-review/quotation-5-page.pdf) | Exactly 5 pages with 37 lines; inspected first/middle/final pages, repeated headers and final totals/terms. |
| [Bengali quotation](./phase-a-review/quotation-bengali.pdf) | 2 pages; Bengali heading/content/terms render with embedded fonts. |
| [Long description](./phase-a-review/quotation-long-description.pdf) | 2 pages; continued description rows avoid a largely empty first page and do not repeat financial values. |
| [Large amount](./phase-a-review/quotation-large-amount.pdf) | 1 page; BDT 999,999,999,999.99 remains exact and the total stays on one line. |
| [Empty optional fields](./phase-a-review/quotation-empty-optional.pdf) | 1 page without fabricated optional details. |

All ten generated PDF artifacts, including letters/email review, contain embedded font streams and A4 portrait media boxes approximately 594.96 × 841.92 pt (Chromium rounding). Actual PDF-viewer captures were opened and inspected, not merely HTML screenshots. Initial pagination/long-row/large-total layout defects were corrected before the final run. See [captures](./phase-a-review/README.md).

UI print uses browser Print / Save PDF. Production server-side official rendering, immutable issuance, R2 persistence, secure downloads and landscape UI are not connected. Physical printing and every possible extreme content combination are not certified by these fixtures.

## 10. Document Studio status

Editable recipient/designation/organization/address/date/subject/body/sender fields, document type, tab-local saves/export, template text export, missing/malformed-variable rejection and live letterhead preview/print are implemented. [English](./phase-a-review/letter-en.pdf) and [Bengali](./phase-a-review/letter-bn.pdf) letter samples were rendered and inspected.

Persisted/versioned template libraries, official reference numbers, approvals, private attachments and actual dispatch remain planned. Selecting a document type does not invent or automatically write factual business content.

## 11. Email Center status

To/CC/BCC, subject/message editing, tab-local drafts/export and a branded escaped-text HTML preview are implemented. [Rendered preview](./phase-a-review/email-preview.pdf). Real provider send, rich-text editing, attachments, reviewed-send workflow, retries, idempotency and verified delivery webhooks are designed through contracts/schema and remain unconnected. No external email was sent; no provider acceptance was called delivery.

The [communication design](./phase-a-architecture.md#document-studio-and-email-center) describes provider-independent adapters, explicit current-revision review, safe retries, webhook authentication and SPF/DKIM/DMARC configuration.

## 12. Centralized Company Settings

Existing public company details now come from the [shared settings source](../lib/business/company-settings.ts), re-exported through the existing public interface. New quotation/letter/email previews use a snapshot of the same factual details and official artwork. A local settings interface applies edits to the current tab's previews; tests confirm propagation. It does not claim to update the live website or database.

The proposed CMS model includes contacts, branches, logo variants, public social/business hours, sender/reply-to, approved identifiers/payment data, terms, footers, currency and numbering preferences. Persisted editing, asset upload and live-public cache invalidation remain Phase B/D work. Issued content is designed to retain its original snapshots; no already-issued records existed or were rewritten during this task.

## 13. Admin screenshots and visual QA

Inspected actual light/dark desktop/mobile dashboard and quotation captures, Document Studio, email composer, CRM empty state, Bengali letter and quotation PDFs, long-description and large-total cases, and multi-page quotation continuation/final pages. The [evidence index](./phase-a-review/README.md) links the screenshots. Responsive checks cover seven modules × two themes × four widths: 320/390/768/1440 px, with no page overflow.

The design uses refined ivory light surfaces, charcoal/forest dark surfaces, restrained champagne accents, official artwork, readable forms, a distinct pipeline emphasis, clear grouping and deliberately honest empty data states. Local review banners explain limitations. Owner design acceptance remains a human decision; this report does not claim an external accessibility audit or production usability study.

## 14. SEO and performance implications

Public page designs, product/service route behavior, prices-hidden rules, cart logic, one-page request flow, fonts and assets remain intact. Admin/review/API URLs add private/no-store/noindex headers; review content is request-gated and absent from the production response. Browser inspection confirmed the real production build does not render local workspaces. Streaming not-found responses may retain HTTP 200 while rendering an unavailable page; confidentiality is tested by absence of workspace markup, not an asserted 404 code.

The admin stylesheet is route-loaded and scoped. No third-party UI/chart dependency, database startup connection, external renderer or provider call was added to public rendering. The standard production build passes. Real database pagination/aggregation, production latency, CMS metadata, sitemap/robots generators and safe cache invalidation remain future work. No production speed improvement is claimed without measurement.

## 15. Tests and failures

| Check | Final result |
| --- | --- |
| `pnpm lint` | Pass. |
| `pnpm exec tsc --noEmit --incremental false` | Pass. |
| `pnpm build` | Pass with the original active Prisma schema. |
| `pnpm review:phase-a-schema` | Valid schema and additive offline SQL; no DB connection/migration. |
| `pnpm test:phase-a` | 11/11 pass: exact finance, hostile/invalid input, scopes/transitions, visibility/claims, snapshots/escaping, templates/email review, long descriptions/dates and proposal safeguards. |
| `pnpm db:restore:check` | Existing 7/7 mock-only safety tests pass; no container/restore created. |
| `pnpm review:phase-a-browser` | 117/117 final checks pass; [machine-readable results](./phase-a-review/checks.json). Includes 56 viewport/theme/module overflow checks, real editor behavior, private route/API denial, production exclusion, PDF page counts/dimensions/fonts and zero browser runtime/console errors. |
| Editor diagnostics | No errors found. |
| `git diff --check` | Pass. Git emits its existing LF→CRLF conversion notices; no whitespace errors. |

Resolved during work: native task Bash path escaping; missing Suspense boundaries exposed by the new dynamic route; early lint/type issues; streamed redirect test expectation (proxy now gives a real 307); short-PDF pagination, a long-row gap, large-total wrapping and mobile text sizing. Local headless Edge initially crashed because the sandbox blocked child processes; the approved local QA run outside that sandbox completed. No automatic approval review rejection remains.

Node's direct TypeScript test imports emit a non-failing `MODULE_TYPELESS_PACKAGE_JSON` warning under the repository's existing package mode. Package runtime mode was preserved. No live persistence, provider authorization, Supabase RLS, migration SQL or worker integration test is claimed.

## 16. Required configuration names

No new secrets/configuration are required for the Phase A local editor/build. Existing environments were not edited. The [configuration inventory](./phase-a-architecture.md#proposed-environment-names) lists proposed names for `DATABASE_URL`/`DIRECT_URL`, auth, R2, email, optional renderer/rate-limit/SMS/maps. Those adapter configurations are planned and must be wired/verified when implemented.

Implemented QA options: `AIA_REVIEW_BROWSER` selects a local Chromium executable; `AIA_REVIEW_PRODUCTION_URL` overrides the default `http://localhost:3002` test server. Do not place privileged values in `NEXT_PUBLIC_*` variables or source code.

## 17. Proposed database migrations

Review [Prisma](../prisma/proposals/phase-a.prisma), [SQL](../prisma/proposals/phase-a.sql) and the [approval packet](./phase-a-migration-review.md). All existing schema/migration files are unchanged. Review artifacts are outside the executable migrations directory. No migration was generated from or applied to a live Supabase database. Actual schema drift, role grants and backup evidence need an approved target review.

## 18. Risks, backup and rollback

The [migration review](./phase-a-migration-review.md) specifies affected data, isolated restore verification, separate runtime/migration roles, RLS/grant assessment, staged concurrency/security tests, lock/timeout review and recovery. Existing local Compose backup tools do not back up Supabase or R2. No remote backup is represented as completed.

Risks needing staging evidence include auth adapter compatibility, contact reassignment, race-safe numbering/claiming, canonical approval hashes, SQL trigger correctness, private portal isolation, renderer limits, and cross-provider object/email failure recovery. Roll back a failed transaction only after inspecting state; prefer additive forward repair. Preserve written financial/customer records and immutable files; restore into a separate recovery target and explicitly approve cutover. Never reset/drop tables or remove volumes as an automatic fix.

## 19. Exact owner approvals required

1. Approve the auth-provider direction and the minimal first migration scope after reviewing the concrete proposal.
2. Explicitly authorize a named isolated staging target, its backup/restore resources and integration-test execution.
3. Separately approve the exact final migration SQL for a named environment with verified backup/recovery evidence. Merely approving Phase A design is not approval to migrate.
4. Later, separately authorize provider/DNS changes, real R2 operations, reviewed external emails and deployments. Each actual financial approval must come from an authorized real user.
5. Explicitly approve any future Git commit/push. No merge to main, Production promotion or Vercel protection change is requested here.

No permission is required just to inspect the local editor, report, proposal, screenshots or PDF fixtures.

## 20. Recommended next implementation step

Review the [local workspace](http://localhost:3000/en/admin-preview), [quotation PDF](./phase-a-review/quotation-1-page.pdf) and [migration packet](./phase-a-migration-review.md). Next, reconcile the maintained auth adapter and prepare the smallest **identity + guest-request persistence** slice, including real server validation, durable rate limiting, ownership checks, transactional writes and staging integration tests. Apply it only after explicit approval of its named target and final SQL. Then connect Quotation Studio's existing local editing foundation to authorized drafts before adding approvals/issuance/email.
