# Request persistence and CMS integration — proposed, not executed

The current frontend validates and reviews requests in browser memory, saves only product IDs/quantities in the cart, and prepares a local text document or an A4 document through **Print / Save as PDF**. It makes no request-creation call, stores no customer record, generates no receipt/reference, and never claims an appointment is confirmed.

Storage/fetching update (2026-11-07): implement this contract using **Supabase PostgreSQL for durable records and Cloudflare R2 for image/document binaries**, following the [storage and fetching plan](./data-store-logic.md). Keep Prisma as the server-side access layer. That plan owns the connection/pooling, media lifecycle, public DTO/cache, pagination, cutover, and Redis-later decisions; generic object-storage references below mean R2.

This is a reviewable design proposal. No Prisma file, migration, API endpoint, credential, environment file, Docker configuration, database, or object-storage resource has been changed for this plan. Migration execution requires separate approval after reviewing the concrete schema/migration diff and checking the existing database backup process.

## Proposed records

The current Prisma schema contains only the existing DatabaseHealthCheck probe. There are no catalog, customer, request, authentication or CMS tables to reuse. Preserve that probe. Phase 2 therefore needs reviewed foundational Category/Product/Service records, publication state, stable public slugs and product/service relationships before request foreign keys can be introduced. The later Phase 3 adds the protected CRUD interface; it does not imply those tables already exist. Any initial content import must be reviewed and separately authorized with the migration.

| Record               | Proposed fields and relationships                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CustomerRequest`    | Server UUID, unique human reference, idempotency key/hash, locale, purpose, contact mode, name, phone, nullable email, conditional site address, preferred local date, time-window enum, `Asia/Dhaka` zone, alternative availability, custom description, notes, `PendingReview` initial status, created/updated timestamps, retention/deletion dates |
| `RequestProduct`     | Request FK, published product FK, bounded integer quantity, bilingual product-name/model snapshot; unique request/product pair. Prices are excluded from public request DTOs                                                                                                                                                                          |
| `RequestService`     | Request FK, published service FK, service-name/scope snapshot, custom-service indicator where applicable; do not turn a custom description into a published service                                                                                                                                                                                   |
| `ProductService`     | Explicit product/service relationship for relevant recommendations; reviewed relevance/sort order, not a guarantee of compatibility                                                                                                                                                                                                                   |
| `RequestDocument`    | Request FK, private object-storage key, detected MIME, size, SHA-256, generation version, locale, scan status, retention timestamps. Generate canonical PDFs from validated server records                                                                                                                                                            |
| `RequestStatusEvent` | Request FK, previous/new status, actor FK, safe note and timestamp. Preserve status history                                                                                                                                                                                                                                                           |
| `RequestAssignment`  | Request/staff FK, assigned-by, assigned-at and optional scope; later operational phase                                                                                                                                                                                                                                                                |
| `AuditEvent`         | Actor, action, record ID, timestamp and minimal change metadata; exclude credentials and unnecessary customer content                                                                                                                                                                                                                                 |

Proposed statuses: `PendingReview`, `NeedsInformation`, `InDiscussion`, `Scheduled`, `Closed`, `Cancelled`. Only authorized staff can mark `Scheduled` after actually agreeing the appointment. A preferred date or a downloaded PDF does not create that status.

Final relation names, nullability, deletion policy, indexes and SQL must be checked against the existing schema before producing a migration. Do not use `prisma db push` as a shortcut. Private costs/selling prices remain server-only and must never be spread into public JSON.

## Proposed API contract

`POST /api/requests`: accept only a typed allowlist: locale, purpose, contact preference, product IDs/quantities, service IDs, custom requirement, preferred schedule, customer details and notes. An empty product/service selection is valid for direct consultation. A service-only request is valid. Require a meaningful custom description for Others, and an address only for onsite mode. General contact has no appointment date requirement.

The server must revalidate IDs against currently published records, enforce length and quantity limits, validate phone/email and real calendar dates in Asia/Dhaka, normalize inputs, reject unknown fields and apply request-size limits. Client labels, hidden fields, document content and status values are untrusted. Time windows are preferences; there is no live slot inventory in this phase.

Use origin/CSRF protection appropriate to the authentication design, rate limits, abuse monitoring and a conservative idempotency policy. Persist the request, selections, snapshots and initial status atomically before returning `201 { reference, status: "PendingReview" }`. Return field errors without losing the in-memory form. If persistence fails, show an error; never show a receipt or success message. A timed-out retry should recover the same request using its idempotency key.

Resolve only submitted product/service IDs directly against current PostgreSQL records, bypassing public caches for publication validation. Enforce idempotency with a database uniqueness constraint: same key/payload recovers the original result; the same key with a different payload returns a conflict. Persist document/notification outbox jobs in the same transaction. Request creation does not invalidate catalog caches because it does not edit the catalog. Do not use Redis as the only store for idempotency or pending work.

Do not log request bodies, names, addresses, email, phone or notes in general logs. Monitor safe request IDs and failure classes. Decide lawful use, staff access, retention/deletion and customer notice with the owner before enabling collection.

## Documents and delivery

The present browser document is a **quotation request**, containing no prices. It is not an offer, invoice or confirmation. Saving or printing never uploads it.

For future storage, generate a canonical PDF from persisted request snapshots with embedded licensed English/Bengali fonts. Uploaded PDFs need file-signature/MIME/size checks, malware scanning, private storage, random object keys, checksums and retention rules. Do not trust an upload's claims or use a customer name in its object path. Download through short-lived authorized URLs and log access without document contents.

Queue notifications only after successful persistence, with retry and delivery status. A notification failure must not discard a saved request. Delivery integrations, email addresses and credentials require separate configuration; this phase sends no email, chat or third-party message.

Private documents use the private R2 bucket and PostgreSQL metadata/object keys. A durable worker generates/uploads canonical documents after the request transaction, with pending/ready/failed status and retry; database rollback cannot undo an R2 upload. Recheck authorization before issuing a short-lived signed download URL. Private authorization responses and documents prevent shared caching; signed URLs never become permanent public database URLs or public cache values.

## Protected staff workflow

Implement authentication, authorization and audit logging before exposing request management. Proposed roles: owner, content editor, request coordinator, read-only staff; grant the minimum permitted actions. The shared login preview stays disabled until real authentication exists. Request references alone must not grant access to customer records. If customer status/history is offered later, require a verified identity or an expiring signed access mechanism with appropriate authorization.

Use one localized `/login` page for customers and staff, with username/password credentials; legacy `/admin/login` redirects there. After server-side credential verification, load the account's stored roles and create a secure server session. Administrators/staff go to their permitted CMS destination; customers go to their account area. Proposed destinations are `/[lang]/admin` and `/[lang]/account`, implemented together with their authorization checks; they do not exist yet. Do not infer privileges from username text or accept a client-selected role/redirect. Enforce authorization again on each protected page, API, and action; route selection alone grants no access. Specify password hashing/provider verification, session expiry/revocation, login throttling, generic failure responses, and provisioning before enabling sign-in. No credentials are hard-coded or supplied from the R2 configuration file.

The CMS needs a request inbox with status/history, combined products and quantities, selected services/custom descriptions, contact/visit preference, schedule/address, private request documents, staff assignment and notes. Later quotation management may add private pricing and internal priced documents without ever exposing it in the public catalog.

Use authorized list-specific queries for the inbox (default 25, maximum 100 rows), with stable cursor ordering and status/date filters; fetch contact details, history, and documents only for the authorized detail view. Public optional product/service pickers are searchable paginated summary queries; cart/request initialization resolves only selected IDs in bounded batches. Never import the full catalog to the client for these flows. See the [fetch budgets and cache policy](./data-store-logic.md#5-pagination-and-fetching-budgets) for limits. Private request reads/mutations remain outside shared public caches, with fresh permission checks.

## Approval sequence

1. Review this contract, retention policy and actual Prisma/schema/migration patch.
2. Review server validation, public DTOs, protected staff access, object-storage setup and failure/idempotency tests.
3. Confirm a current backup/restore path and approve migration execution separately.
4. Apply the approved migration in the agreed environment, test durable requests and permissions, then enable the real Submit to AIA action.
5. Release only after separate deployment approval. No deployment is authorized by this document.
