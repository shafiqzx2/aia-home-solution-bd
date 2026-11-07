# Incremental business frontend delivery

Date: 7 November 2026. Local preview: http://localhost:3000/en (Bengali: /bn). This is an incremental change to the existing website, not a rebuild. Previous uncommitted work is preserved.

## Design and homepage

The charcoal/ivory/champagne palette, architectural concept image, Product category sidebar/grid, existing product illustrations, Service page article layout and editorial page typography remain. Changes are scoped through [business styles](../app/business.css) and shared components.

The hero now uses Geist sans-serif at weight 600, responsive scale and a clean English slogan. Consultation is primary; Products and Book Service are secondary. Three small icon indicators describe actual request options without invented statistics. The original green headline stripe did not reproduce in the clean browser; explicit text colors, no text effects and separated scene/content layers prevent the lighting overlay from painting over the title. Desktop/mobile screenshots and timed animation frames were visually reviewed.

The warm fixture chase has a more visible core and halo aligned to the existing source image: seven seconds on desktop, nine seconds with a lighter core on mobile. Pause and reduced-motion behavior are retained. Richer room relighting still requires unlit/lit plates, masks and reflection layers; no physically simulated relighting is claimed.

The homepage now includes six visual solution cards, three illustrated featured products with working actions, three image-led service cards with booking, an icon-based Why Choose AIA section, a four-step honest journey and final consultation/contact actions. Existing interior images remain clearly labeled concepts. Reviews, client/partner logos and verified metrics are publication-gated and hidden because no genuine approved records were supplied. A verified-metric hero badge slot is prepared and empty.

## Product and booking behavior

| Capability               | Delivered behavior                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add to Cart              | Connected to Product cards, featured/related cards and detail pages; works with current published concept IDs                                                       |
| Product detail           | Existing gallery/specification support, quantity, add, specific quotation and specific consultation                                                                 |
| Multi-product cart       | Distinct products, repeated-add quantity merge, integer limits 1–99, increment/decrement, remove, clear, header count, navigation/reload persistence                |
| Safe storage             | Only validated product IDs/quantities; unknown IDs/fields and malformed values removed; no customer field storage                                                   |
| Product-specific request | Correct product and chosen quantity carried into the request                                                                                                        |
| Combined request         | Multiple products plus optional relevant services retained through review                                                                                           |
| Direct consultation      | Starts with empty selections regardless of the cart; begins with customer details                                                                                   |
| Service-only booking     | Selected service without any product requirement; optional products can be added                                                                                    |
| Others                   | Custom option on Services/request form; requires a meaningful description and retains it in review/documents                                                        |
| Schedule                 | Phone, online, office, onsite or general contact; conditional address; preferred date/time and alternatives in Asia/Dhaka; no appointment confirmation              |
| Form navigation          | Values survive back/forward steps and repeated English/Bengali language switches using an expiring memory-only handoff                                              |
| A4 PDF                   | Print / Save as PDF produces an unpriced draft request in English/Bengali with supplied company details, logo slot, selections, schedule, customer fields and notes |
| Local text file          | Existing brief download retained; request review also offers UTF-8 text download                                                                                    |
| Online submission        | Separate Submit to AIA action is disabled; no request creation, receipt, reference or fake success                                                                  |

The browser print dialog must be used to choose Save as PDF; this implementation does not silently download a PDF binary. Downloading/printing does not contact AIA. PDFs were actually generated, checked for A4 page dimensions and opened in Edge's PDF viewer for visual review in both languages. Print styling forces a white page even when the website is dark and uses the site's licensed Bengali fonts. Inactive cached routes detach their old print document so it cannot leak into a later PDF.

Product search, recursive category filtering, initially collapsed mobile categories and publication filtering remain. Collection filters support Featured, New Arrivals and New Designs; only Featured currently has assigned content. Services now have search, category filtering, booking and consultation. No public prices, totals, subtotals or payment checkout were introduced.

## Contact, navigation and localization

Central settings now use the owner-supplied phone/provisional WhatsApp +8801601891663, email info@aiagroupbd.com and office H#30, Sonargaon Janapath, Uttara, Dhaka 1230. Contact/Footer show these and the request entry points. Social slots are typed for configured networks; no social profile is invented.

The WhatsApp URL is normalized to wa.me/8801601891663 and its message encoded. The owner subsequently confirmed the contact update, so the earlier availability disclaimer has been removed from footer/contact, privacy, and floating-link copy in both languages. No chat was opened and no message sent. The green center stays stationary and only the champagne rays rotate.

Login navigation now uses one localized page for customers and staff, with username/password preview fields. The separate admin page/link has been removed; legacy admin-login URLs redirect to the shared login through the routing proxy. Actual credential verification, stored-role-based CMS/account routing, and protected destinations remain backend work described in the [request backend plan](./request-backend-plan.md). Facebook, Instagram, and YouTube profile URLs are pending owner input; no account URLs have been invented.

Normal new-page navigation resets to the top after the destination commits, fixing the catch-all route's retained-scroll behavior. Query-only filters and form steps preserve position; hash targets and browser history remain supported. Header/footer/mobile navigation were tested without forcing full reloads.

English hero/editorial wording remains intentional; navigation, categories, request steps, controls, validation and documents are localized. Existing Anek Bangla/Hind Siliguri shaping and licenses remain. Theme initialization now executes only in initial server HTML and is not recreated during locale navigation, removing React's script warning. System preference and persisted explicit choices were tested, including the first animation frame.

## Verification

- **288 responsive checks passed:** eight affected route types × English/Bengali × dark/light × 320, 375, 390, 430, 768, 834, 1024, 1440 and 1920px. No horizontal overflow or clipped checked headings/form controls; floating controls remain separate.
- **32 accessibility scans passed:** WCAG A/AA/2.1 AA tags on those route/mode combinations at mobile width; no detected violations after fixing service-card contrast.
- **62 functional/browser checks passed** in the final focused run, covering theme initialization/persistence, visual slots, provisional WhatsApp URL, fixture duration, card/detail cart actions, quantities/removal/clear/reload, malformed/stale cart data, product-specific/direct/service/combined/Others requests, validation, repeated language switches, print document isolation, English/Bengali PDFs, mobile groups, navigation/anchors/filter scroll and field clearance from floating controls.
- All **33 distinct homepage internal link destinations returned HTTP 200**. No application submission requests or browser console/runtime errors were observed in the final functional run.
- Seven additional date/timezone/phone assertions passed, including the Dhaka date rollover, past-date rejection and leap-day validity.
- Lint, TypeScript with no emit/incremental disabled, production build and git diff whitespace checks passed. The production build generated 69 entries. Editor diagnostics were clear.
- The 19 protected foundation hashes remain unchanged, including the dependency/configuration, environment, Prisma/migration and database/deployment foundation files.

Responsive checks were performed in independent headless Edge at actual CSS viewport widths; the integrated browser's small shared viewport was not used to claim those dimensions. Screenshots were visually reviewed for the hero, service/product previews, mobile pages and both actual PDF documents. Automated checks do not replace final owner review of supplied media and business copy.

## Changed implementation files

| Area                      | Files                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routes and root behavior  | [locale layout](../app/[lang]/layout.tsx), [catch-all page](../app/[lang]/[[...slug]]/page.tsx), [public composition](../components/site/public-page.tsx), [navigation scroll](../components/site/navigation-scroll.tsx), [theme initialization](../components/site/theme-initialization.tsx)                                                                         |
| Visual/marketing          | [business CSS](../app/business.css), [hero](../components/site/hero.tsx), [home sections](../components/site/home-content.tsx), [review preview](../components/site/review-preview.tsx), [trust preview](../components/site/trust-preview.tsx)                                                                                                                        |
| Catalog/cart              | [product catalog](../components/site/catalog.tsx), [product actions/header count](../components/site/product-actions.tsx), [cart page](../components/site/cart-page.tsx), [cart store](../lib/cart.ts), [related products](../components/site/related-products.tsx)                                                                                                   |
| Services/requests         | [service catalog](../components/site/service-catalog.tsx), [service actions](../components/site/service-actions.tsx), [request flow](../components/site/request-flow.tsx), [print document](../components/site/request-document.tsx), [request copy](../lib/request-copy.ts), [language handoff](../lib/request-draft.ts), [validation](../lib/request-validation.ts) |
| Contacts/navigation       | [header](../components/site/header.tsx), [footer](../components/site/footer.tsx), [contact/social display](../components/site/contact-details.tsx), [floating tools](../components/site/floating-tools.tsx)                                                                                                                                                           |
| Public settings/readiness | [public content](../lib/public-content.ts), [reviews](../lib/reviews.ts), [verified organizations/metrics](../lib/trust-content.ts)                                                                                                                                                                                                                                   |
| Documentation             | [product blueprint](./product-blueprint.md), [media checklist](./media-requirements.md), [proposed backend plan](./request-backend-plan.md), this report                                                                                                                                                                                                              |

These are current-phase edits/new files relative to the already uncommitted frontend. Existing root route deletions and the prior globals/favicon changes were already present and preserved. No working component was removed to resolve this phase.

## Remaining work and next phase

Supply the approved logo/favicon, genuine product photos and specifications, service imagery, completed project content and any consented reviews/client logos/verified metrics. The detailed replacement checklist keeps these requirements separate from concept visuals.

The current Prisma schema still contains only DatabaseHealthCheck. No request, catalog or authentication tables have been created. The [backend proposal](./request-backend-plan.md) describes foundational catalog/service records, transactional requests, public DTO validation, Pending Review, secure private documents, authorization, retention and idempotency. Review the concrete schema/migration/API/storage patch and approve migration execution separately before enabling real submission. Later phases add protected CMS CRUD, media/company/social/job/review management and business operations.

No PostgreSQL changes, Prisma migrations, credentials/environment edits, Docker/volume operations, commits, pushes or deployments were performed.
