# Data storage, media delivery, and fetching plan

Status: proposed implementation plan, based on repository analysis on 2026-11-07. This document does not implement code, migrate a database, upload media, configure services, or deploy.

This is the source of truth for the new storage/fetching architecture, replacing generic future PostgreSQL/S3 hosting choices in older documents. The [product blueprint](./product-blueprint.md) defines business behavior; the [request backend plan](./request-backend-plan.md) defines request validation/workflow. The [database guide](./database.md) documents existing local tools, not an implemented Supabase backup system.

## 1. Architecture decisions

- **Supabase PostgreSQL owns all durable application data:** catalog, localized business content, settings, media metadata, requests, staff/operational records, audit events, idempotency, and durable jobs. Keep Prisma 6 as the server-side query/migration layer.
- **Cloudflare R2 owns image binaries and future stored documents.** PostgreSQL stores metadata/references. Public images reach browsers through a Cloudflare media domain/CDN, without application/Vercel image proxying. Customer documents remain private.
- **Cache bounded public reads now through Next.js Cache Components.** Add shared Redis later without changing selector/DTO contracts. Redis is disposable acceleration, never the authoritative business database or durable job store.
- **Fetch only the current view's records and fields.** Filter, order, project, and paginate in PostgreSQL before returning results. No whole-catalog downloads followed by JavaScript filtering/slicing.
- UI code, navigation definitions, validation rules, and interface dictionaries may stay in code. Browser theme preferences and unsent in-memory forms are UI state. The anonymous cart may keep only bounded identifiers/quantities locally; future synced carts belong in PostgreSQL. Customer details never enter browser persistence.
- Preserve bilingual routes, concept/verified labels, approval/consent gates, and the absence of public prices. Real submission remains disabled until persistence, validation, permissions, and the privacy notice are ready.

## 2. Repository findings

| Area | Evidence | Required change |
| --- | --- | --- |
| Database | [Schema](../prisma/schema.prisma) contains only `DatabaseHealthCheck`; [client](../lib/prisma.ts) is shared per development process | Introduce business records; preserve probe and migration history. |
| Connections/hosting | [.env.example](../.env.example), [deployment guide](./deployment.md), and [database guide](./database.md) target local PostgreSQL 16 with standalone Docker | Preserve local development/backups; add deliberate Supabase runtime/migration connections. Hosting choice remains separate. |
| Business source | [Public content](../lib/public-content.ts), [reviews](../lib/reviews.ts), and [trust content](../lib/trust-content.ts) are arrays/settings | Import reviewed seed content preserving IDs/slugs, bilingual copy, empty states, and provenance. [Legacy lighting content](../lib/site-content.ts) is not the live source. |
| Routing/metadata | [Catch-all page](../app/[lang]/[[...slug]]/page.tsx) derives route allowlist, metadata, and static parameters from arrays | Replace frozen detail-route allowlist with published slug lookup; new CMS content must resolve without a rebuild. Deduplicate metadata/body lookups. |
| Catalogs | [Catalog](../components/site/catalog.tsx) and [service catalog](../components/site/service-catalog.tsx) filter complete client props and update query strings with `history.replaceState` | Add real server fetching and pagination; history-only updates will no longer fetch results. |
| Home/details | [Public page](../components/site/public-page.tsx), [home content](../components/site/home-content.tsx), and [related products](../components/site/related-products.tsx) filter/map arrays | Use bounded selectors per view; homepage projects currently map the entire published array. |
| Hidden catalog consumers | [Cart store](../lib/cart.ts), [cart page](../components/site/cart-page.tsx), [request flow](../components/site/request-flow.tsx), and [project brief](../components/site/project-brief.tsx) import business arrays | Batch-resolve selected IDs, separate structural cart validation from current publication checks, and paginate optional pickers. |
| Shared chrome | [Header](../components/site/header.tsx), [mobile menu](../components/site/mobile-navigation.tsx), and other clients import business settings/categories/services | Pass small public DTOs from server components, not a full site bootstrap payload. |
| Images | [Media definitions](../lib/public-content.ts) reference three [public images](../public/images/); [hero](../components/site/hero.tsx) and [gallery](../components/site/media-gallery.tsx) use `next/image` | Migrate business images to R2. A remote `src` alone still invokes the default `/_next/image` optimizer. |
| Cache | [Next configuration](../next.config.ts) enables `cacheComponents` and partial prefetching | Use the installed Next.js 16.4.4 APIs; these flags alone do not implement business-data caching. |
| Requests/auth | [Request flow](../components/site/request-flow.tsx) has local documents and disabled submission; login screens are previews | Implement durable writes and protected access before enabling them. |

No business API handlers, R2 upload flow, Redis dependency, or paginated business database reads exist in the inspected app. Performance requirements below are targets; production latency has not been measured.

## 3. Supabase data model and access

### Access boundary and pooling

Server Components, Route Handlers, and Server Actions call server-only services/repositories using Prisma. Server rendering calls those functions directly, without HTTP calls to its own API. Browser interactions use narrow APIs or App Router navigation. Never expose database/R2 credentials to client code.

Plan pooled runtime `DATABASE_URL` and migration-only `DIRECT_URL`, adding Prisma datasource `directUrl` during implementation. Choose Supabase direct/session/transaction-pool endpoints against the actual deployment connectivity and Prisma 6 compatibility; verify TLS, prepared statements, timeouts, migration locks, and connection limits in staging. Migrations use a migration-capable direct or supported session connection, never the transaction-pool runtime endpoint. Separate runtime and migration roles and budget connections per replica.

Prefer a private application schema outside Supabase Data API exposure. Otherwise revoke unwanted anonymous/authenticated API grants and configure RLS explicitly. Prisma does not automatically receive the browser user's `auth.uid()` context, and privileged connections can bypass RLS. Enforce identity/role checks in every protected repository operation. Supabase Auth remains a separate provider decision, not a consequence of choosing its PostgreSQL service.

### Proposed records

| Domain | Records/rules |
| --- | --- |
| Catalog | `Category` with parent FK and stable identifier/slug; `Product`, `Service`, `Collection`, `ProductCollection`, `ProductService`, `ServiceCategory`; ordered specifications, publication state, timestamps. Reject category cycles and define descendant visibility. |
| Localization | Translation records with unique `(entityId, locale)` for categories/products/services/projects/jobs/settings/media alt text. Supported locales `en`/`bn`; query requested locale with a deliberate fallback policy. |
| Public content | Settings/social links, homepage sections/ordering, projects, jobs, reviews, organizations, metrics. Retain approval, publication consent, verification sources/dates, and concept provenance. |
| Media | `MediaAsset`, `MediaVariant`, ordered entity-specific media joins with FKs, and `MediaUpload` reservations/lifecycle state. |
| Requests | `CustomerRequest`, selected products/services and snapshots, status events, private document metadata, later assignments; follow the [request contract](./request-backend-plan.md). |
| Operations | Staff identity/role mappings, audit records, durable `OutboxEvent`/jobs, database-backed idempotency uniqueness, retention fields. Private pricing stays in protected records/selectors. |

Use stable IDs, timestamps, validated FKs, explicit deletion policies, and unique domain slugs. Preserve current slug-based links/cart IDs via legacy-ID mapping; later slug changes need aliases/redirects. Archive referenced records instead of breaking request history. Snapshot request labels/scope so content edits do not rewrite past requests.

Use columns/relations for filterable content; reserve bounded JSON for flexible non-queryable fields. Add quantity/enum/uniqueness constraints. Design indexes around actual reads: publication + stable sort + ID; category/collection joins; locale/slug; request status + creation time + ID; media references; outbox status + next-attempt time. Use reviewed SQL migrations for partial indexes or constraints Prisma cannot express. Verify query plans before adding speculative indexes.

### View fetching and SQL views

"View fetch" means a query/DTO designed for the visible screen; it does not require a SQL view for every component.

- `ProductCard`: identity/slug, localized name/summary, displayed category/collection labels, concept flag, illustration fallback, one thumbnail. Exclude full specifications, galleries, other locales, prices, suppliers, and moderation fields.
- `ProductQuickView`: one published entity, requested-locale specifications, and bounded initial gallery, loaded within the catalog rather than a standalone public product page. Other resource cards/details/pickers follow the same projection rule.
- Use explicit Prisma `select`, bounded nested relations, and batched joins. No full-record spreads, `SELECT *`, unrestricted `include`, or per-card database calls.
- Start with Prisma selectors. Add ordinary PostgreSQL views for justified repeated joins/projections; views do not materialize results or automatically improve speed. For Data API exposure, review grants and `security_invoker` behavior on the actual PostgreSQL version. Version view SQL in migrations and verify Prisma access rather than assuming generated view models.
- Defer materialized views until measured aggregates justify them, with explicit refresh/staleness rules. Never use stale aggregates for permissions, publication checks during writes, or request state.

## 4. R2 metadata, uploads, and delivery

### Metadata contract

`MediaAsset` stores bucket/visibility, immutable `objectKey`, public `imageUrl` where applicable, detected MIME, byte size, dimensions, SHA-256, localized alt text, concept/verified provenance, lifecycle status, creator, timestamps, and retention. Variants store their actual key/URL, dimensions, format, and size. R2 ETags are not a reliable content SHA-256.

Honor the requested `imageUrl` column: public images have a validated HTTPS URL on the configured media domain matching the object key. Keep the key authoritative for storage operations; provide a controlled URL backfill when changing domains. Private assets have no permanent public URL and never persist expiring signed URLs. Keys use random IDs/content versions, never customer names or caller-controlled paths.

Use a public image bucket/custom domain and a separate private bucket for quarantine/customer documents. Configure and verify Cloudflare cache rules and object headers; R2 alone does not prove edge cache hits. Do not make an `r2.dev` development URL the production delivery contract.

### Upload/publication lifecycle

1. Authenticate/authorize the editor; validate intended entity, type, declared size, and quota. Create a pending upload reservation and issue a short-lived presigned PUT to a server-chosen private quarantine key. Restrict CORS origins/methods/headers.
2. Browser uploads directly to R2. Presigned PUT is not trusted size/type enforcement: finalize with HEAD and actual content inspection/decoding, rejecting/quarantining excess size or invalid bytes. Do not assume POST policy support. Recheck permission, ownership, and reservation expiry.
3. A durable idempotent job validates signatures/dimensions, strips unwanted metadata, and generates bounded responsive WebP/AVIF variants. Reject/rasterize untrusted SVG; uploaded documents need scanning/private handling. Processing runs in a worker, outside public image delivery.
4. Promote verified bytes to new immutable public keys. A still-valid quarantine PUT must not be able to replace a published object. Persist verified metadata/variants and attachment FKs transactionally; only ready assets may be published. Invalidate dependent caches after commit.
5. Replacement creates a new version/URL and atomically switches references. Retain old versions until reference checks, rollback/backup retention, and a grace period permit cleanup. Never overwrite a long-cached key.
6. Unlink/archive first; retryable cleanup deletes only expired unreferenced assets/reservations. Recheck references immediately before deletion. Reconcile missing/orphan objects and failed uploads/jobs periodically.

R2 and PostgreSQL share no atomic transaction. Use durable lifecycle states, outbox jobs, idempotent retries, and compensation cleanup; a database rollback cannot undo an upload. Bulk imports/deletions must be bounded and resumable.

### Serving requirements

- Initially generate fixed responsive variants in R2. Render direct media-domain `src`/`srcset` through a shared component/custom Next image loader. An unoptimized direct URL is acceptable for an already-sized single image, but does not automatically generate responsive variants. Cloudflare image transformations are an optional later service, not included simply by using R2.
- Preserve aspect ratios/dimensions, alt text, responsive sizes, lazy loading below the fold, and hero-only high priority. Fetch additional gallery metadata on demand; never preload every original.
- Immutable public versions target `Cache-Control: public, max-age=31536000, immutable`, verified at the CDN. Removing a DB reference cannot revoke a public cached image; urgent removal also requires object deletion/CDN purge and cannot recall downloaded copies.
- Authorize every private download before issuing a short-lived signed R2 GET. The authorization response uses `Cache-Control: private, no-store`; private object metadata prevents shared caching. Signed URLs are bearer capabilities and never enter public caches/logs.
- Verify public business images load from the media domain with no app proxy or `/_next/image` traffic. Fonts, CSS illustrations, and code remain app assets. Inventory business logos/icons separately, including framework favicon handling, before declaring all business images migrated.

## 5. Pagination and fetching budgets

### Contract and ordering

List selectors accept the applicable subset of `{ locale, q, category, collection, sort, cursor, limit }`, with allowlisted sorts/fields. APIs expose these contracts, not arbitrary Prisma filters. Return `{ items, pageInfo: { nextCursor, hasNextPage } }`; totals are separate and opt-in.

Use keyset pagination for growing lists: query `limit + 1`, return at most `limit`, and derive the next cursor from the last returned row. Default publication order is `(publishedAt DESC, id DESC)`. Every other supported order includes a unique ID tie-breaker, explicit null handling, matching seek predicate/index, and all sort values in the cursor.

Opaque bounded cursors contain the ordered tuple, normalized-filter fingerprint, sort, and version; validate types and reject mismatches/malformed cursors with safe 400 errors. Seek from stored values without requiring the boundary row to still exist. Mutable editorial order/live updates may move rows between pages: deduplicate client results by ID and reset after filter/order changes. Snapshot semantics are deferred unless a workflow requires a frozen result set.

Retain prior cursors for previous navigation and accessible next/previous links. Numbered staff pages may use bounded offsets with a maximum depth and separately measured count; public growing feeds should not incur deep offsets or a count per page.

| View | Initial budget and behavior |
| --- | --- |
| Chrome/settings | One small settings DTO plus a bounded menu/category projection, shared by chrome. Target maximum 100 initial menu nodes; load additional child branches on expansion. No product inventory embedded. |
| Homepage | Maximum 3 featured products, 3 services, 2 projects, 3 approved reviews, 12 permitted logos, 6 verified metrics. Reuse metrics for hero badges; no totals/full galleries. |
| Product list | Default 12 cards, hard maximum 48; DB search/category descendants/collection/sort predicates. |
| Services/projects/careers/reviews | Default 12, maximum 48; correct publication/consent/open-job predicates. Others is a custom-request option, not a service result. |
| Details | One published entity, at most 3 related products; gallery metadata initial 8 and subsequent batches of 8. No eager original-image downloads. |
| Cart/selected products | One bounded selected-ID resolution, maximum 100 distinct product lines, quantities 1–99; published summaries and unavailable IDs only. Header count needs no catalog query. |
| Request pickers | Fetch when selection step opens; searchable pages of 10, maximum 20. Resolve selected services in a bounded batch (target 20 distinct services); retain selected summaries across pages. |
| Protected admin lists | Default 25, maximum 100; list-specific fields only. Fetch customer detail/history/document links on the authorized detail screen. |

These are implementation targets, not current behavior. Bound search (target 100 characters), cursor/body sizes, nested records, and ID batches server-side. Rate-limit costly searches/uploads. Database failure must not return an entire unfiltered catalog or a pretend empty success.

Use bounded recursive SQL or a reviewed category-closure strategy for descendants. Preserve current search matching of localized names/descriptions/category names. Start with parameterized substring queries and measured `pg_trgm` indexes as needed; do not assume English full-text stemming handles Bengali. Defer relevance sorting until it has an indexed deterministic cursor strategy. Cache exact filtered/facet counts separately only where displayed; otherwise replace the browser-derived total with “showing N”/has-more.

### Browser and route changes

- Server-render the initial page; deduplicate identical metadata/body/chrome reads within a render, for example with React `cache`. Run independent queries concurrently within the connection budget. Request deduplication is not a cross-request cache.
- Read/normalize `searchParams` outside cached functions; pass plain arguments into selectors and use installed Next.js Suspense/dynamic boundaries. Replace history-only updates with App Router navigation or a narrow client query. Choose one owner so RSC and clients do not fetch the list twice.
- Debounce search (target 300 ms), cancel obsolete client requests, discard stale responses, and reset cursors on filter/sort changes. Preserve URL state, locale, back/forward, focus, and filter scroll behavior.
- Lazy-fetch optional galleries/pickers on opening/near viewport; keep critical SEO/initial catalog/hero data server-rendered. Measure and limit aggressive detail prefetch across large grids.
- Replace static detail allowlists with DB slug lookup and real 404s. Pre-render only an optional bounded subset; new published slugs must work without rebuilding. Preserve the current build's lack of database dependency unless a reviewed release design explicitly changes it. Do not enumerate every DB record at build time.

## 6. Cache policy and write consistency

### Layers and freshness

| Layer | Initial policy | Redis phase |
| --- | --- | --- |
| Within render | Deduplicate identical reads for metadata/body/chrome | Unchanged. |
| Public cross-request reads | Server-only async `use cache` selectors with `cacheLife` and dependency `cacheTag` | Implement/test the installed Next.js `cacheHandlers` interface with Redis, preserving selectors/DTOs/tags. Stream serialization and tag invalidation require more than a JSON `get/set` adapter. |
| Browser query/navigation | Reuse initial data and bounded fetched pages by normalized query identity | No browser Redis connection. |
| Images | Versioned R2 URLs plus Cloudflare edge/browser cache | No Redis image binaries. |
| Private reads/mutations | Fresh authorization and direct transactional reads/writes; private/no-store HTTP | Stay outside shared public caches. |

Avoid overlapping custom memory, Next, API CDN, and Redis caches for the same DTO without one invalidation contract. Initially avoid an additional shared JSON CDN cache. Do not place private reads under a cached public parent that would serialize them into shared output.

Proposed Next.js lifetimes, in seconds:

| Selector | `stale` | `revalidate` | `expire` |
| --- | --- | --- | --- |
| Public cards/details/related/home | 30 | 60 | 300 |
| Settings/menu/categories | 30 | 300 | 1800 |
| Optional filtered counts | 30 | 120 | 300 |

`stale` controls client reuse, `revalidate` background refresh, and `expire` blocking for a fresh read; these are not HTTP headers or interchangeable TTLs. Arbitrary searches/deep cursors initially bypass cross-request caching to avoid high-cardinality growth, retaining request deduplication/client page reuse. Admit repeated queries to a bounded cache only after measuring. Do not cache DB errors as empty data. Leave missing details uncached initially so new publications are not hidden behind negative caches.

Logical key inputs: DTO version, locale/fallback policy, normalized filters/search/sort, cursor, limit, public audience. Canonicalize inputs and hash long values. Dependency tags include `products:list`, `product:<id>`, `product-slug:<slug>`, `services:list`, `service:<id>`, `projects:list`, `categories`, `site-settings`, `home`, `reviews`, `trust`, `media:<id>`. Namespace future Redis keys by environment/release. No customer fields, tokens, signed URLs, or staff results in public keys/values.

### Mutation lifecycle

1. Authenticate/authorize and validate. Check current publication/relationships directly in PostgreSQL, not cached cards. In one transaction persist changes, audit metadata, and durable invalidation/job outbox events.
2. After commit, invalidate detail, old/new slug, list/count, related-content, and homepage dependencies. Category/collection changes affect membership queries; media changes affect referencing surfaces. Translation edits invalidate fallback-dependent locales. Clear negative caches if introduced later.
3. CMS Server Actions use `updateTag` for immediate read-your-own-writes. `revalidateTag(tag, 'max')` is for changes tolerating stale-while-revalidate. Withdrawals/deletions/consent revocations need immediate expiry: Server Action `updateTag`, or Route Handler `revalidateTag(tag, { expire: 0 })`, plus affected route refresh as needed. These forms were checked against the installed Next.js docs. Stale-while-revalidate does not immediately hide withdrawn content.
4. Retry invalidation failures through the PostgreSQL outbox without rolling back a committed business write. Return the fresh mutation result to the editor and expose propagation failure status. A supervised worker/cron drains jobs with leases, retry/backoff, maximum attempts, and failure inspection; request-lifetime fire-and-forget is insufficient.
5. Before scaling, solve cross-process invalidation. Default Next runtime caches are process-local and lost on restart; invalidating one replica does not invalidate another. Initially require one app process, a verified shared hosting handler, or public cross-request cache bypass. Multiple serverless instances/containers require a shared cache/invalidation solution before enabling these caches there.

Already delivered browser/CDN public data cannot be recalled absolutely. Use private fresh reads for permission-sensitive data, document public withdrawal propagation, and refresh returning/inactive views. Do not promise hard freshness while permitting arbitrary stale fallback.

Redis acceptance later: shared tags across replicas, environment isolation, memory/eviction bounds, stampede protection, jittered refresh, timeouts/circuit breaking, and bounded DB fallback. Redis outage must not leave stale isolated caches active after failed distributed invalidation. Idempotency, permissions, and durable delivery remain correct without Redis.

## 7. Durable request path

Follow the [request backend contract](./request-backend-plan.md) for Dhaka scheduling, validation, private data, and statuses. Resolve only submitted IDs against current PostgreSQL publication state. Atomically save the request, snapshots, initial status, unique idempotency record, and document/notification outbox jobs.

Return the reference and `PendingReview` only after commit. Same-key/same-payload retries recover the same result; changed payload returns conflict. Enforce uniqueness under concurrent retries. Request creation does not invalidate public catalog caches because catalog content did not change. Initial abuse protection must work across the chosen topology; Redis rate limits can follow later.

PDF generation/R2 upload run after persistence with pending/ready/failed states. Document/notification failure must not lose or duplicate requests. Authorized inboxes are paginated; fetch private details on opening, never in public cache. Apply retention/deletion consistently to DB records, R2 bytes, audit policy, and backup recovery.

## 8. Implementation sequence

Deliver small reviewable patches. This plan does not execute migrations or deployment.

| Step | Deliverables | Completion gate |
| --- | --- | --- |
| 0. Baseline/configuration | Record current payload/query/image behavior; choose region/topology/media domains. Before future staging/build, exclude the existing [local R2 credential file](../cf-r2-cred.txt) from [Git](../.gitignore) and [Docker](../.dockerignore) and move secrets to private configuration without printing them. Its exact filename currently has no matching exclusion. | Baseline, access/configuration contract, secret exclusions, connection choices reviewed. No credential content copied into documents. |
| 1. Database foundation | Server-only repositories/DTOs, Supabase connection validation, Prisma models, SQL indexes/grants, seed mapping/dry-run. Preserve local PostgreSQL tooling. | Schema/SQL/import diff reviewable; staging permission tests and tested backup strategy before execution. |
| 2. R2 foundation | Authenticated quarantine/finalize, durable jobs, responsive variants, metadata, safe cleanup, direct CDN component/loader, private downloads. Import three current concept images preserving provenance. | Upload/replay/failure/reference checks and direct CDN delivery pass in staging. |
| 3. Public reads/cache | Replace arrays for home/catalog/services/projects/jobs/settings/trust with bounded selectors; pagination, URL fetching, slug/metadata lookup, cache profiles/tags/invalidation. | No full catalog in bundles/props, new slugs work without rebuild, large-data pagination/cache tests pass. |
| 4. Cart/requests | Batch ID resolution, paginated optional pickers, remove array dependencies in cart/request/brief; transactional submission, idempotency, private document jobs and authorization. | Real permissions/worker exist before endpoints/submission are enabled; direct/product/cart/service/custom flows persist correctly. |
| 5. CMS/cutover | Role-protected content/media/inbox workflows, auditing/outbox processing; back up, migrate agreed target, import, verify parity, switch reads, remove static business-data/image fallbacks. | DB/R2 ownership, staging checks, reviewed release and write-preserving rollback runbook. |
| 6. Shared Redis | Before multi-instance caching, implement shared Next cache handler or reviewed equivalent maintaining the same invalidation contract; distributed abuse controls as needed. | Two-instance updates, outages/recovery, limits, and observability pass. |

Public reads depend on data/media foundations. Request submission depends on real authorization and worker infrastructure even if the CMS interface comes later. Reconcile this sequence with historical product phase names; those names do not imply implementation exists.

### Configuration to introduce during implementation

Document placeholders for `DATABASE_URL`, migration-only `DIRECT_URL`, server-only R2 account/endpoint/keys/public-private buckets, non-secret media base URL, upload limits, worker scheduling/authentication, and later server-only Redis connection/token. Finalize new R2/worker variable names in the patch. No secret uses `NEXT_PUBLIC_`; only a non-secret media base URL may be public. Preserve working local environments/credentials.

### Migration and recovery

- Current business content is a reviewed TypeScript seed import, not an existing PostgreSQL catalog dump. Keep slugs/IDs, bilingual text, concept provenance, and deliberately empty jobs/reviews/trust. Make imports idempotent with dry-run summaries.
- Local backup helpers use Compose PostgreSQL and do not follow remote `DATABASE_URL`. Add a separate verified Supabase export/isolated restore procedure covering application schemas, grants/policies/views, and migration history; exclude provider-managed schemas appropriately. Never blindly restore a local cluster into Supabase.
- Choose backup/PITR according to actual Supabase plan/recovery needs. DB backups exclude R2 bytes: maintain a media manifest and tested separate object recovery/copy policy. Retain prior objects through rollback/backup windows.
- Prefer additive migrations, preserve source, and verify counts/checksums, translations, publication gates, FKs, asset checksums, and URLs before switching. Before cutover keep the old source active on failure. After accepting Supabase writes, rollback must preserve/reconcile new requests; never switch to stale seeds and lose writes. Prefer forward fixes when appropriate.
- Provider failure after cutover shows a controlled unavailable state or explicitly bounded public cache, not silent static-data fallback. Destructive cleanup/deployment are later operational actions.

## 9. Verification and acceptance

Implementation runs existing lint/TypeScript/build checks plus focused integration tests. This documentation-only change needs no live infrastructure operation or app build.

| Check | Evidence required |
| --- | --- |
| Ownership | Business data read/written through Supabase; no runtime seed imports. Business images/docs in R2, no DB blobs/app-hosted image fallback. |
| Projection/bounds | Inspect bundles/RSC/API payloads: only requested-view fields/locale and bounded rows; no private pricing/customer fields, full card galleries/specifications, or per-card DB calls. |
| Pagination | More than 1,000 representative records; ties, final/empty pages, deleted cursor boundary, filter reset, malformed/mismatched cursor, max limits, recursive categories, bilingual search, history/keyboard next-previous. |
| Caching | Cold/warm query counts and payloads, metadata/body deduplication, edits/publication withdrawal/consent/locale fallback/category/collection/media/slug changes, invalidation failure/retry, restarts and two-instance behavior. No private cache leakage. |
| Media | Network trace confirms direct domain delivery and no business `/_next/image`; responsive variants, cache headers/edge hits, lazy gallery/hero priority. Unauthorized/expired/replayed uploads, forged MIME/oversize, failed promotion, missing objects/orphans, reference-safe cleanup, private download expiry. |
| Requests | Invalid/unpublished IDs, atomic writes, concurrent retries/conflicting payload, DB failure without success, PDF/notification recovery without request loss/duplication. |
| Database performance | Representative staging `EXPLAIN (ANALYZE, BUFFERS)` for filter/search/cursor queries; query count/time, rows returned, pool use, bytes, cache hit rate, invalidation lag/outbox backlog. |
| User performance | Compare cold/warm TTFB, mobile LCP, navigation/search p95, image bytes, and app bandwidth using the same region/device/data baseline. Initial product page: 12 cards, one thumbnail each, no full-catalog payload. Set latency SLOs from measurements, not invented guarantees. |
| Recovery/release | Isolated DB/media recovery, import/parity report, no build-time secret leakage or unintended build DB dependency, write-preserving rollback. |

Resolve during implementation: actual Supabase project/region/pool connectivity, app host/replica topology, R2 buckets/media domain, worker environment, identity/role policy, and retention/recovery requirements. These do not block this plan or require credentials in chat. Recheck provider and installed Next.js behavior when producing concrete patches.
