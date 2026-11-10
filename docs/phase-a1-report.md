# AIA Home Solutions BD — Phase A.1 delivery report

9 November 2026 · branch `staging/vercel-preview` · local review only.

Phase A.1 delivers the redesigned local workspace and reviewable business foundations. It does not activate Phase B. Existing uncommitted work was retained. No migration, database seed, commit, push, deployment, real email, payment collection or financial approval was performed.

Open the [visual review gallery](phase-a1-review/index.html) for screenshots and actual rendered PDF previews. Start the existing development task and visit [the local workspace](http://localhost:3000/en/admin-preview).

## 1. Current repository audit

The checkout already contained Phase A route protection, business helpers, local editors, schema proposals and review evidence. The interrupted A.1 work contained a redesigned shell, navigation, dashboard, product and permission tools, memo editor, conversion helpers and revised document renderer. These were continued in place. A source/document baseline remains outside the repository in `D:/AIA/phase-a1-baseline`.

Review started with `git status`, the tracked diff and the untracked implementation files; most Phase A/A.1 additions are still untracked, so tracked diff statistics alone do not describe this work. The active [schema](../prisma/schema.prisma) and executable migration directory have no changes. The original [Phase A report](phase-a-report.md) and its evidence remain historical references.

Incomplete areas identified and resolved included conflated sale/document/payment registers, an extra chart day, weak template field guidance, local state lost on module changes, mobile navigation after desktop collapse, and the missing A.1 schema/test/evidence packet.

## 2. Fixed issues

The existing installed Next.js guidance was reviewed before editing request-time routes. Development preview remains request-time and development-only; production does not render the workspace. Authentication-dependent APIs still return 401 with private/no-store responses. Actual protected admin URLs redirect to unified login.

The inherited Suspense boundaries around request-time loading/navigation remain. The loading/header logo previously eagerly loaded hidden theme variants, producing an unused preload warning. Theme-selected artwork now loads without eagerly preloading both variants. Fixed-appearance artwork can still load eagerly. No Next.js badge, overlay or console warning was hidden.

The owner's historical “three issues” could not be reconstructed individually. Fresh final browser diagnostics record the standard Next Dev Tools control and no issue-count badges on the reviewed modules. The evidence distinguishes this observed result from a claim about unknown historical messages.

The shared tab also retained historical module-not-found and parser messages from intermediate file edits. The current imports/files resolve, and the final production build and fresh-browser run pass. Those retained console entries are historical evidence, not newly observed failures in the final run.

Template workbench now names missing form fields before application, blocks incomplete templates, preserves the body, and safely resolves supplied variables. Invalid document inputs produce validation feedback. Financial/payment validation rejects duplicate payments and overpayment. Committed demo revenue excludes voided sales and quotation offers.

## 3. New Admin design

The active workspace uses forest/charcoal navigation, ivory surfaces, champagne accents, semantic payment/stock statuses, larger financial figures, purposeful business icons and consistent forms, tables, dialogs and buttons. Both themes preserve white document paper.

Dashboard provides recorded-sales/payment/balance/request indicators, a dated revenue chart with keyboard/hover points, payment distribution, filtered recent sales, product ranking, low-stock attention, quotation pipeline and operational follow-up. Date range, disconnected live source, drill-down links and demo CSV export work locally. The review dataset ends on **8 November 2026**; dates are intentionally fixed and labeled, rather than presented as today's live business.

Reviewed examples: [desktop light](phase-a1-review/dashboard-1440-light.png), [desktop dark](phase-a1-review/dashboard-1440-dark.png), [mobile light](phase-a1-review/dashboard-390-light.png), [mobile dark](phase-a1-review/dashboard-390-dark.png).

## 4. Updated sidebar/module architecture

[Module definitions](../lib/business/modules.ts) provide **56 entries across seven groups**: Overview; Sales & customers; Products & services; Content management; Documents & communication; Reports & analytics; Administration. Counts: 12 local-tool entries, 16 demo-view entries and 28 planned entries. Some entries intentionally share a foundation view; these counts are navigation states, not 56 independently completed applications.

Groups collapse, navigation scrolls independently, module search filters entries, browser back restores the selected module, and desktop collapse/mobile drawer interactions work. Mobile Escape closes the drawer and restores focus; dialogs trap focus and restore their opening control. Planned modules show their phase and dependency state without fabricated business controls. See [mobile navigation](phase-a1-review/navigation-mobile.png).

## 5. Product Management implementation status

**Working locally:** add/edit/archive/restore; English/Bengali names; unique DEMO SKU validation; category selection; specifications; private BDT prices; image file selection/local preview; stock/reorder settings; search, category/status filters and pagination; JSON export. Inventory adjustment requires a reason, a nonzero whole quantity and nonnegative resulting stock. Changes update the local dashboard's catalog indicators. Adjustment logs survive module navigation.

See [Product Management](phase-a1-review/products-1440-light.png) and [mobile](phase-a1-review/products-390-light.png). Product images are in-memory previews with a 2 MB PNG/JPEG/WebP input limit, not R2 uploads. Product/category/service persistence, category/subcategory CRUD, durable inventory posting, reservations, related-service editing and media processing are not connected. Services/categories currently provide read-only demo views. Public catalog data and private pricing remain separate.

## 6. Root Admin and Staff Permission UI status

**Working local simulation:** five role profiles, 15 resource groups × ten actions, Root-only matrix changes, immutable Root privileges, non-root escalation denial, staff role reassignment, suspension/restoration and a local change-review list. Root itself is excluded from staff assignment options. Role scopes, staff state and review entries survive module navigation.

See [permission matrix](phase-a1-review/roles-1440-light.png) and [dark matrix](phase-a1-review/roles-1440-dark.png). Review-as selection is a simulation, never a login or privilege grant. Staff/account creation, secure Root provisioning, authenticated server permission enforcement and persisted security audits await Phase B. Current server endpoints deny every unauthenticated protected operation.

## 7. Custom Memo implementation

**Working local draft:** new memo without a quotation; choose fictional customer or type external details; add demo catalog products or custom products/services; edit quantity, unit price, discount, tax, delivery/service charges, terms and notes; save/reopen/duplicate/export; English/Bengali preview; browser Print/Save PDF.

Sales memo, invoice, payment receipt and delivery challan have distinct layouts. Memo/invoice show precise totals and payment state; receipt requires a recorded demo payment; challan shows quantities without prices. Demo cash/bank/mobile records support partial payments and exact balances; adding them collects no money. Duplicating a memo clears payment entries. The editor can show a single-label draft or a numbered **DEMO issued-layout specimen**, without creating an issue or approval.

See [Memo Studio](phase-a1-review/memo-studio-1440-light.png), [mobile](phase-a1-review/memo-studio-390-light.png), and [custom memo PDF](phase-a1-review/memo-custom.pdf). This remains an in-memory draft system, not a persisted commercial ledger.

## 8. Quotation-to-Memo implementation

[Conversion helper](../lib/business/sales.ts) accepts an approved or issued demonstration quotation, validates its financials, deep-copies customer/line/price/term fields, assigns new line identities and retains the source quotation reference. The memo is independently editable and starts without payments. Unit and browser tests verify that memo edits leave the original quote unchanged.

Draft sources are blocked. Editing a source quotation locally removes eligibility for conversion until its approved demo source is reloaded. Conversion never changes sales totals, stock, approval state, number sequences or payment records. See [converted memo PDF](phase-a1-review/memo-from-quotation.pdf) and [Quotation Studio](phase-a1-review/quotations-1440-light.png).

## 9. Quotation PDF screenshots

The [numbered quotation specimen PDF](phase-a1-review/quotation-official-layout.pdf) and its [actual PDF-viewer screenshot](phase-a1-review/quotation-official-layout-pdf.png) show the official brand, shared company contacts, client details, date/validity, item table, calculated totals and terms on white A4. It has one small DEMO marker and no DRAFT or Approval Pending clutter.

This is an issued-layout **specimen**, not a real issued quotation. Draft editor exports keep one small DRAFT label. Rendering never allocates an official reference or implies financial authorization.

## 10. Sales Memo PDF screenshots

Eleven real PDF files were generated using the shared templates, actual local logo and embedded fonts. The primary specimens are:

| PDF | Actual rendered preview |
| --- | --- |
| [Custom one-page memo](phase-a1-review/memo-custom.pdf) | [Screenshot](phase-a1-review/memo-custom-pdf.png) |
| [Quotation-converted memo](phase-a1-review/memo-from-quotation.pdf) | [Screenshot](phase-a1-review/memo-from-quotation-pdf.png) |
| [Partial-payment invoice](phase-a1-review/invoice-partial-payment.pdf) | [Screenshot](phase-a1-review/invoice-partial-payment-pdf.png) |
| [Payment receipt](phase-a1-review/payment-receipt.pdf) | [Screenshot](phase-a1-review/payment-receipt-pdf.png) |
| [Delivery challan](phase-a1-review/delivery-challan.pdf) | [Screenshot](phase-a1-review/delivery-challan-pdf.png) |
| [Bengali letter](phase-a1-review/letter-bengali.pdf) | [Screenshot](phase-a1-review/letter-bengali-pdf.png) |
| [Bengali memo](phase-a1-review/memo-bengali.pdf) | [Screenshot](phase-a1-review/memo-bengali-pdf.png) |
| [Draft memo](phase-a1-review/memo-draft.pdf) | [Screenshot](phase-a1-review/memo-draft-pdf.png) |
| [Two-page memo](phase-a1-review/memo-2-page.pdf) | [Final page](phase-a1-review/memo-2-page-page-2-pdf.png) |
| [Five-page memo](phase-a1-review/memo-5-page.pdf) | [Middle page](phase-a1-review/memo-5-page-page-3-pdf.png), [final page](phase-a1-review/memo-5-page-page-5-pdf.png) |

Including the quotation, these give eleven PDFs. One-page fixtures have exactly one page; long memos have exactly two and five pages. Actual PDF-viewer images were inspected for repeated table headers, balanced totals, white paper, typography, Bengali shaping, clipping and extra pages. The partial invoice and receipt show BDT 7,500 billed / BDT 3,750 recorded / BDT 3,750 remaining. No signature, seal, payment confirmation or live issue was fabricated.

## 11. Demo data fixtures and isolation plan

[Fixtures](../lib/business/demo-fixtures.ts): 12 products, eight fictional customers, 72 historical sale examples (including one void), six quotations, 18 requests, four services and 16 distinct memo/invoice specimens. Contacts use example.com and synthetic DEMO phone labels. Operational areas contain no coordinates or invented geocoded pins.

The workspace is development-only. Demo and live source modes do not mix figures: live shows disconnected. Public pages do not import these fixtures. Local edits persist within the open workspace and reset on full reload; JSON/CSV exports are explicit. No customer draft data is written to localStorage.

[Seed plan CLI](../scripts/demo-seed-plan.mjs) prints counts only and rejects `--apply`. The tested seed boundary requires explicit approval of the named isolated Dev/Test target. A real idempotent database adapter, collision checks and scoped cleanup execution remain unimplemented. See the [isolation and reset plan](phase-a1-migration-review.md).

## 12. Updated Prisma schema/ER diagram

The validated [combined A.1 Prisma proposal](../prisma/proposals/phase-a1.prisma), [sales extension ER diagram](phase-a1-schema-erd.md) and [original foundation ER diagram](phase-a-schema-erd.md) separate quotations, committed sales, item snapshots, document revisions, payments, allocations, refunds, deliveries and stock events.

The extension adds ten tables plus SKU/reorder metadata. Currency/quantity precision, idempotency, immutable financial history, distinct document numbering and explicit delivery-linked stock posting are represented. The active Prisma Client still comes from the unchanged health-probe schema.

## 13. Database migration review packet

Review the [A.1 migration packet](phase-a1-migration-review.md), [incremental SQL](../prisma/proposals/phase-a1-extension.sql), [invariants](../prisma/proposals/phase-a1-invariants.sql) and [offline generator](../scripts/phase-a1-schema.mjs). It covers exact impact, target identity, backups, isolated restore tests, concurrency/authorization checks, demo seeding and nondestructive rollback.

Prisma validation/schema diff are offline operations, not migrations. SQL triggers have not been executed against PostgreSQL. Refund allocation, reversals, efficient per-aggregate checks and transaction locking must be finalized and tested before exposing writes. No executable migration was added.

## 14. Test results

| Check | Final result |
| --- | --- |
| `pnpm.cmd exec tsc --noEmit --incremental false` | Passed |
| `pnpm.cmd lint` | Passed |
| `pnpm.cmd build` | Passed; 51 static pages generated |
| `pnpm.cmd test` | 31 passed, 0 failed: 11 Phase A, 13 A.1, seven mock restore checks |
| Offline A.1 Prisma validation and additive SQL generation | Passed; ten new tables, no SQL applied |
| `git diff --check` | Passed |
| VS Code file diagnostics | No errors found |
| Functional/responsive/browser/PDF checks | 174 passed, 0 failed; 59 screenshots and 11 PDFs; [machine-readable evidence](phase-a1-review/checks.json) |

Browser verification includes real local interactions, 320/390/768/1440 widths in both themes, no page overflow, all required screenshots, private API denial, production preview exclusion, document fonts/A4 dimensions/page counts, and monitoring for browser errors/warnings and business mutation requests. The original Phase A browser script remains historical; [A.1 browser QA](../scripts/phase-a1-browser.mjs) is the current harness.

Node's standalone TypeScript import checks emit an informational package module-type warning; it is separate from browser/Next diagnostics and does not fail tests. No module-mode change was imposed on the existing application to suppress that message. Git may also print existing LF/CRLF normalization notices on Windows.

## 15. Exact incomplete features

| State | Exact scope |
| --- | --- |
| Working locally | Navigation, theme, demo dashboard/filter/export, product/catalog preparation, inventory simulation, permission/staff simulation, settings propagation and template resolution |
| Local draft only | Quotations, custom/converted memos, invoices, demo payment entries, receipt/challan previews, letters and email composition; draft saves are in memory |
| Prepared but unconnected | Schema/SQL/ER, seed boundary and fixtures, auth/ownership predicates, numbering/approval architecture, provider-neutral renderer/storage/email contracts |
| Fully persisted and verified | No new Phase A.1 business workflow |
| Planned | Auth/Root provisioning, account CRUD, real Product/Service CRUD, guest request transactions, verified claiming, sale/payment/refund posting, approval/issue history, portal, R2, email, full website CMS and advanced analytics/maps |

The Sales Analytics and Product Performance demo entries currently reuse the overview foundation; dedicated reports, category revenue, low-seller/enquiry/booking/staff trends and database aggregate queries are not implemented. Operations shows a fictional area list; maps/geocoding are not configured. Media upload/storage, categories/subcategories editing, service management and public content editing remain future work. Browser print produces local PDFs; no server PDF worker, private PDF storage or official download endpoint is connected. The public request page remains a single page and does not claim successful durable submission.

## 16. Required owner approvals

Next approvals concern the concrete [database review packet](phase-a1-migration-review.md): authentication provider and first schema slice; exact named isolated development/test target; backup/restore and concurrency tests; final reviewed migration; and separate demo seeding. Root provisioning needs a verified operator identity. Tax/numbering/refund/stock policies also need owner decisions before real financial operations.

Real emails require a verified sending provider and explicit dispatch authorization. R2, external provider changes and deployments need their own approved scope. Commit/push/deploy approval remains absent; none was performed. Accepting the local visual design does not authorize any of those actions.

## 17. Recommended Phase B tasks

1. Approve the smallest identity/roles/CRM/request schema slice and maintained authentication adapter. Prepare the precise target-specific SQL and restore test plan.
2. After explicit target approval, establish the isolated Dev/Test database, test migrations and recoverability, provision Root securely and implement server-side role/ownership enforcement.
3. Persist the single-page guest form transactionally, with genuine references, selected items, durable rate limits and verified claim ownership.
4. Implement protected Product/Service CRUD and scoped demo adapter; prove repeatable seed/reset isolation before populating the test database.
5. Complete sale/payment/refund transaction and inventory posting rules, concurrent idempotency tests and immutable approval/issue snapshots before proceeding to Phase C document persistence, private storage and dispatch.
