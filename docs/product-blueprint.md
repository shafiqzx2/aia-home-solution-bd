# AIA Home Solutions BD — product blueprint

This is the current incremental frontend specification. It supersedes the lighting-only positioning and contact-empty-state descriptions in the historical [UI report](./phase3-ui.md), [Phase 1 validation](./phase1-validation.md) and [design refinement report](./design-refinement.md). Preserve the existing Next.js 16.4.4, React, TypeScript, Tailwind, pnpm, Prisma, PostgreSQL and Docker foundation.

Current handoff: [incremental delivery report](./business-delivery.md). Required assets: [owner media checklist](./media-requirements.md). Proposed durable request contract: [request backend plan](./request-backend-plan.md). Historical reports remain records of earlier stages.

Storage architecture update (2026-11-07): the [storage and fetching plan](./data-store-logic.md) is authoritative for the next backend implementation: **Supabase PostgreSQL for all durable business data, Cloudflare R2 for business images and stored documents, bounded view-specific reads with server pagination, Next.js caching now, and shared Redis later**. Current array-based/local-document behavior below describes the frontend as implemented, not the target storage architecture. Local PostgreSQL remains a development/backup tool; production durable data targets Supabase.

## Business and truthfulness

AIA Home Solutions BD presents home and commercial solutions in Bangladesh: lighting, automation, door access/controls, sensors, CCTV/security, audio, outdoor needs and digital setup. Lighting is one part of the offering.

The catalog is for product selection, quotation requests and consultation. **No public prices, totals, subtotals, private costs, selling prices or payment checkout.** Current entries are explicitly illustrative concepts, not confirmed inventory. Empty specifications await verified data. Scope, suitability and availability need direct review.

Do not invent customers, reviews, satisfaction scores, clients, partners, credentials, founding dates, staff, jobs, guarantees, response times or completed work. Only published entries belong in public routes, cards, filters and metadata. Concept imagery is never evidence of actual work.

## Preserved design and hero correction

Preserve charcoal #191e1a, ivory #f2eee5, champagne #d7bc86, architectural concept imagery, the Product sidebar/grid and Service article layouts. Shared catalog typography and illustrations remain intact.

The hero alone now uses the existing self-hosted Geist sans-serif at a confident weight, with responsive scale and clean line height. Its English slogan remains “A better way / to feel at home.” Editorial Product/Service headings retain Cormorant Garamond.

The headline has explicit plain text colors and no text background/gradient, shadow, filter, decorative pseudo-element or blend mode. The reported green stripe was not reproducible in a clean browser. The fixture layer is isolated behind the content so it cannot paint over the headline.

A warm source-aligned core/halo travels along the physical fixture over seven seconds on desktop, with fade-in/out. Mobile uses a lighter nine-second core without a halo. Pause stops both layers. Reduced motion retains a static scene and stops WhatsApp rays.

Image and SVG share a 1536 × 1024 source canvas and the same cover crop. A flattened image cannot independently relight room shadows and reflections. Richer physical lighting needs the layers in the media checklist.

## Homepage

- Hero: Request a Consultation, Explore Products, Book Service.
- Small icon indicators: Residential & Commercial, Consultation & Planning, Site Visit Requests. These describe request options and claim no performance statistics.
- Six visual overview cards: automation, lighting, security, access/controls, audio/digital setup and home/commercial planning. Do not enumerate the complete category tree here.
- Three featured concept products: approved illustrations, localized names/descriptions, View Details, working Add to Cart and quotation entry. Featured membership is explicit content.
- Three service cards: relevant temporary concept thumbnails, concise copy, detail links and Book Service. Card surfaces preserve the original ivory service presentation in either theme.
- Why Choose AIA: consultation/planning, product guidance, site-assessment options and installation/setup planning, using meaningful icons.
- How It Works: discover, collect preferences, choose contact/schedule, review and contact AIA. The final step honestly explains the current local document workflow.
- Projects remain explicitly concepts. Reviews, approved client/partner logos and verified metrics have publication/approval gates and render nothing when empty.
- The final CTA offers consultation, services, products and contact without repeating every action in every section.

## Public routes and navigation

Every suffix is available under /en and /bn.

| Route suffix            | Purpose                                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| /                       | Category-only product preview with direct consultation; no individual product cards or cart actions         |
| /products               | Published catalog, search, recursive categories and collections                                            |
| /products/[slug]        | Legacy redirect into /products?product=slug; details, quantity and actions live in accessible catalog Quick View |
| /services               | Existing service layout with search/categories, booking and Others                                         |
| /services/[slug]        | Scope, imagery, booking, consultation and related products                                                 |
| /cart                   | Multi-product selection, quantities, remove/clear and combined request entry                               |
| /request                | Shared frontend consultation/booking flow; noindex                                                         |
| /projects and detail    | Explicit concepts; no invented completed work                                                              |
| /about                  | Home/commercial positioning and actual approach                                                            |
| /careers                | Real published jobs only; currently empty                                                                  |
| /careers/preview        | Noindex sample layout; applications disabled                                                               |
| /contact                | Supplied contacts, local project brief, request links, social links and factual request FAQs               |
| /privacy                | Current storage/document boundaries and direct-contact information                                         |
| /login                 | Shared noindex login preview for customers and staff; no real authentication/dashboard                    |
| /admin/login           | Legacy URL redirects to the same localized /login page                                                    |

The proxy redirects unprefixed paths to English and retains query strings. Unknown routes and /admin stay 404. No URL is an authorization boundary.

The header contains existing navigation, consultation, visible cart count, login and language choice. Narrow layouts use the native modal menu with initially collapsed Products/Services groups and recursive child categories. Cart stays visible; login remains in the mobile menu. Null logo slots fall back to temporary typography; logos link to the localized homepage.

### Scroll behavior

All public content shares a catch-all Page. Next's visible-page heuristic could retain a lower scroll position between pages. The shared navigation component now watches pathname changes and waits for the destination main element to commit before resetting ordinary new-page navigation to the top. It covers header, footer, cards and mobile navigation without full reloads.

Filter-only query updates and form steps do not change pathname and preserve scroll. Hash links keep their target. Browser history retains restoration behavior. CSS scroll padding accounts for the fixed header, and the HTML smooth-scroll attribute informs Next's native handler.

## Public content, products and services

[Public content](../lib/public-content.ts) is the typed public source for categories, product concepts, services, projects, jobs, company/social settings and replaceable media. The old [lighting module](../lib/site-content.ts) remains historical/unused; do not update it to change live business content.

Categories use stable open-ended IDs and recursive children with shared flattening and parent/descendant filtering. Unknown filters fall back to all published products. Mobile categories start collapsed, expose expanded state and close after selection. Future category depth is data-driven.

Products prepare bilingual copy, category, image array, fallback illustration, specification rows, publication/concept state and optional Featured/New Arrivals/New Designs memberships. New collections remain empty until assigned; do not fabricate arrivals or designs. Gallery controls appear only when supplied images exist. Do not invent alternate views or technical details.

Services prepare localized names/descriptions/scope, related category IDs, imagery and publication state. A service request never requires a product. Related products are suggestions, not compatibility guarantees. Others is a custom-request option with required description, not a pretend published service.

Future API DTOs must allowlist public fields. Never serialize complete database product records and merely hide private pricing in CSS.

The persistence implementation replaces these live business arrays with server-only database repositories and localized card/detail/picker DTOs. Filters/search/collection/category descendants and stable pagination run in PostgreSQL, not over a complete client array. CMS-published slugs resolve without rebuilding. Images use validated R2 media URLs/variants served directly by Cloudflare rather than the application image optimizer. Follow the [storage implementation sequence](./data-store-logic.md#8-implementation-sequence) for query budgets, cache invalidation, media verification, and migration gates.

## Product selection / consultation cart

The shared client store powers product card/detail actions, header count and cart page:

- Add different published products; repeated additions merge quantities.
- Bound quantities to integers 1–99; support increment/decrement, editing, removal and clearing.
- Continue browsing or start combined quotation, consultation or service requests.
- Persist only validated product ID/quantity objects under aia-consultation-cart-v1. Resolve names and images from current published content.
- Drop unknown/draft IDs, invalid quantities and unknown fields; merge duplicates; handle malformed JSON and storage denial. Without storage, the cart lasts in memory for the visit. Cross-tab storage changes update the cart.
- Never persist customer names, phones, email, addresses, custom descriptions, notes or request drafts in localStorage, sessionStorage, cookies or URLs.
- No inventory reservation, payment, order record or public price calculation.

The real backend must independently revalidate IDs/quantities against current publication state.

## Unified request flow

Entry paths carry identifiers and quantities, never customer details:

- **Direct:** /request?entry=direct&type=consultation, also inquiry, quotation, office or assessment. Starts with no products/services irrespective of the cart, without clearing it.
- **Specific product:** entry=product, published product slug, bounded quantity and quotation/consultation purpose.
- **Cart:** entry=cart with quotation, consultation or service purpose. Copies validated products into the draft; changing draft selections does not silently mutate the cart.
- **Service:** entry=service with a published service slug. Starts with that service and no product; service=others requires a custom description.
- All entries use one page with customer details, contact/visit preferences, selected products/services and scheduling groups. There are no Continue/Next steps. Relevant optional products/services sort first. Submit Request validates the draft and explicitly explains that online submission is unavailable; PDF preparation and a text download remain local actions.

Purposes include general consultation/inquiry, quotation, service booking, installation/digital setup, project discussion, office visit, onsite assessment and Other. Modes are phone, online, customer visiting AIA, AIA visiting the site, or general contact without appointment.

Require trimmed name and valid phone. Email is optional and validated if supplied. Onsite mode requires address; office mode shows the supplied address. Others requires at least ten meaningful characters. Notes and alternative availability are optional and length-limited.

Appointment modes require a real preferred date that is not past in **Asia/Dhaka (UTC+06:00)** and a time window. Windows express visitor preferences, not business hours or realtime slot availability. General contact has no scheduling requirement.

Step values stay in memory and survive back navigation. A one-use expiring memory handoff preserves the draft during client-side language changes. The unsent draft may return when using browser Back after leaving the route; reloading starts a fresh draft. Only the cart and theme use persistent browser storage. Nothing is sent by the form.

Review includes all selections, quantities, custom description, contact/visit mode, relevant address, schedule and notes. **Submit to AIA is visibly disabled.** No record, reference, status or confirmed appointment is fabricated. A future durable submission begins at Pending Review.

## A4 PDF request and text download

At review, **Print / Save as PDF** prepares a dedicated A4 document using browser rendering. Customers choose Save as PDF in the browser print dialog to download it; automatic PDF binary download is not claimed.

Include company identity, replaceable header logo slot, supplied contacts, generation time in Dhaka, selected products/quantities, services, customer details, custom requirements, contact/visit preferences, schedule and notes. The document uses self-hosted English/Bengali fonts, A4 margins, tables and page-break rules.

The print tree excludes site navigation/footer/floating controls. It is detached when an Activity-cached route becomes inactive so an older request cannot appear alongside the current document. Label it **DRAFT REQUEST · NOT SUBMITTED**. It has no prices and is not a confirmed appointment.

Saving/printing sends nothing to the company. A secondary UTF-8 text download and the existing local project-brief form remain available. Real upload, storage, request references, canonical server PDF generation and CMS delivery need the separately approved backend.

## Supplied contacts and social settings

Central company settings contain:

- Phone / provisional WhatsApp: +8801601891663
- Normalized wa.me number: 8801601891663
- Email: info@aiagroupbd.com
- Office: H#30, Sonargaon Janapath, Uttara, Dhaka 1230

The owner confirmed the WhatsApp contact is updated; remove the former availability/registration disclaimer from contact, privacy, and floating-link copy in both languages. URL syntax/message encoding remains checked; this work never opens a chat or sends a message. The floating icon remains green/stationary with champagne rays; reduced motion stops rotation. Footer Facebook, Instagram, and YouTube entries use owner-supplied profile URLs; do not invent account handles.

All visitors use the same localized login page with username/password fields. There is no separate admin-login link or account-type chooser. Once authentication is implemented, the server verifies credentials and loads the stored account role: authorized administrators enter their protected CMS, customers enter their account area. Role assignment never comes from a username prefix, URL, or browser-selected flag. The current shared page remains a disabled preview until the backend and protected destinations exist.

Contact/Footer show the supplied contacts. Social settings prepare Facebook, LinkedIn, Instagram, YouTube and other networks; render only configured valid HTTPS links. No invented profile URLs. Contact FAQs describe actual request behavior without response guarantees or warranty claims.

## Localization, typography and themes

English/Bengali dictionaries retain stable IDs/slugs. Official name, English hero slogan and selected editorial headings stay English with language tags; navigation, categories, useful copy, validation, steps and documents are translated.

Bengali uses self-hosted Anek Bangla headings and Hind Siliguri body/controls with included [Anek Bangla](../public/fonts/licenses/anek-bangla-OFL.txt) and [Hind Siliguri](../public/fonts/licenses/hind-siliguri-OFL.txt) OFL licenses. Preserve natural shaping, weights and generous line height.

Language changes use App Router navigation with path/query/hash retained; request fields stay in memory. HTML language updates correctly. No customer draft enters browser storage.

Dark/light themes cover public pages, cart/request, recovery views and login previews. The shared initializer emits a synchronous script in the initial server HTML, matches hydration, then removes the consumed script. It does not recreate a script during client-side locale navigation. First visits respect the system; explicit aia-theme preference persists. Keep the side-mounted toggle, separate WhatsApp target, safe-area clearance and storage-failure handling. Preserve deliberately dark cinematic surfaces and the ivory service section. No global inversion.

## Verified content readiness

Reviews prepare name, localized quote, actual optional rating/date/photo, source, status, approval and publication consent. Client/partner records require a real relationship, verified media and permission. Metrics require value, label, source, verification date and approval. Empty arrays render no public section.

Projects prepare cover, location, category, gallery and content kind. Current concepts stay labeled. Careers has no published vacancies; previews remain disabled samples. Real applications/uploads require approved persistence.

## Future CMS and operational phases

| Phase                        | Deliverable and boundary                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Current frontend             | Incremental visuals, catalog/cart/request, local print/text documents, supplied contacts, conditional trust slots and documentation                                                                            |
| Phase 2: persistence         | Reviewable Prisma/migration/API/storage design, durable combined requests, server validation, Pending Review/status history and product/service relationships. Execute migrations only after separate approval |
| Phase 3: protected CMS       | Real authentication/RBAC, staff access, product/category/subcategory/service CRUD, publishing/sorting and public DTO projections                                                                               |
| Phase 4: content and booking | Media library, logos/favicon, homepage sections/badges, company/social settings, projects, actual jobs/applications, approved reviews/metrics/client logos and request/document management                     |
| Phase 5: business operations | Staff assignment, private quotations, reports/analytics, CRM workflow, audit/retention and separately approved deployment                                                                                      |

The owner must eventually manage content through accessible CMS forms without editing code, including English/Bengali, SEO, ordering and visibility. This is a plan; no CMS or durable request service is claimed.

Across these phases, establish Supabase schema/access and R2 metadata/upload/delivery foundations before replacing public reads; integrate bounded cart/request selectors and transactional requests next, then protected CMS/cutover. Real permissions and durable workers are prerequisites for enabling writes even when the CMS interface comes later. Shared Redis or another verified cross-instance invalidation solution is required before scaling cached reads to multiple app instances. The [storage plan](./data-store-logic.md) supplies concrete deliverables and acceptance checks; the phase labels above remain business milestones.

## Safety and verification

No credential/environment, dependency foundation, Prisma/schema/migration, PostgreSQL data, Docker/volume, Git-history or deployment change is authorized by this frontend phase. Do not run prisma db push, reset data, commit/push or deploy.

Run lint, TypeScript --noEmit --incremental false, production build and diff whitespace checks. Actually test English/Bengali, both themes and widths 320, 375, 390, 430, 768, 834, 1024, 1440, 1920.

Validate visual hierarchy, fixture alignment/motion, keyboard/mobile menus, categories, page/anchor/filter scroll, cart quantity/removal/persistence, specific-product/direct/service/custom/combined requests, back navigation, language handoff, readable PDFs and honest disabled submission. Record results and limitations in the delivery report. Compare protected foundation hashes before handoff.
