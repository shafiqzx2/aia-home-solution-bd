# Phase 1 delivery and validation

**Historical baseline:** the subsequent [design refinement report](./design-refinement.md) records the current light/dark themes, stronger mobile lighting animation, revised Bengali typography, collapsed category groups, floating contact controls, and review readiness. The original Phase 1 results below remain a record of that delivery.

This report covers the bilingual home and commercial solutions frontend described in the [product blueprint](./product-blueprint.md). It does not claim backend CMS, authentication, inquiry persistence, application submission, or media uploads.

## Preserved design and improvements

Preserved the charcoal, warm ivory, champagne-gold palette; cinematic installation image and its visible fixture; original interior concept imagery; editorial typography; and spacious compositions. Refined the header/footer, removed decorative interface lines and numbered marketing ornaments, expanded the business positioning, and introduced dedicated page layouts. The company name is **AIA Home Solutions BD**.

The hero adds a lightweight fixture-aligned SVG highlight with pause, static mobile fallback, and reduced-motion support. The original room never rotates or distorts. The effect cannot independently relight baked-in shadows/reflections; layered source artwork would be needed for physically convincing dimming or 3D movement.

## Delivered pages and localization

Both English and Bengali cover the homepage, searchable/filterable products, product details, services, service details, projects, project concept details, about, careers, a clearly labeled job-detail preview, contact/quotation brief, customer login, admin login, loading, errors, and 404s. The route scheme preserves equivalent pages and uses localized HTML language, navigation, metadata, labels, buttons, notices, and empty states. Bengali has dedicated typography.

All product previews are concepts, all technical specifications remain unconfirmed, completed-project records are empty, and no actual vacancies are published. Concept imagery is identified throughout. No product price fields exist in the new public content structures.

## Responsive and browser validation

- Automated headless Edge checks covered **26 route/language combinations at all nine requested widths: 320, 375, 390, 430, 768, 834, 1024, 1440, and 1920 px** — **234 passing layout checks**. These checked the actual CSS viewport, document overflow, and bounds of headings, copy, fields, and header controls.
- Ten axe-core scans across both languages found **zero violations** for the selected WCAG 2 A/AA and 2.1 AA rules. Homepage scans ran at 1440 px; catalog, quotation, and both login screens ran at 390 px.
- Screenshots were visually reviewed at **all nine requested widths**: Bengali homepage at 320/390/430, English homepage at 375/1440/1920, English services at 768, Bengali contact at 834, and the fully hydrated Bengali catalog at 1024 px. The mobile Bengali contact layout was also reviewed at 390 px.
- Menu opening, Escape dismissal/focus restoration, category deep links, empty search/reset, product inquiry context, localized category preselection, blank-form rejection, a real UTF-8 Bengali brief download, detail-route language switching, reduced motion, localized 404s, absent admin dashboard, no non-GET application requests, and no browser runtime exceptions passed in a focused interaction run.
- The brief test used synthetic values and wrote a local text file. No request was submitted to the company. Framework development-tool traffic is excluded from the application-submission check.

Interaction checks waited for asynchronous dialog events, pending React updates, and real local file creation. Catalog checks explicitly waited for hydrated filters/cards rather than a loading fallback; the affected 18 width checks and two accessibility scans passed. Additional focused checks passed for Tab/Shift+Tab modal focus wrapping, a visible keyboard focus outline, real keyboard entry into catalog search with URL updates, and the hero pause state. No application workaround was added for test-tool timing.

The integrated browser was used for the live preview. Its host-controlled sizing was unsuitable for precise viewport claims, so a separate headless Edge process performed the measured checks. A fresh preview tab resolved stale modules in the original browser session after route relocation.

Physical phones/tablets, Safari, Firefox, screen readers, assistive input, real inventory acceptance, verified contact details, and production hosting were not tested. Automated checks do not certify complete accessibility or device coverage.

## Engineering checks

Final checks passed:

| Check                                            | Result                                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `pnpm.cmd lint`                                  | Passed                                                                                              |
| `pnpm.cmd exec tsc --noEmit --incremental false` | Passed                                                                                              |
| `pnpm.cmd build`                                 | Passed; 63 generated static/partial route entries                                                   |
| `git diff --check`                               | Passed                                                                                              |
| Responsive layouts                               | 234 passing route/locale/width combinations; affected catalog checks also rechecked after hydration |
| Accessibility                                    | Ten distinct WCAG scan targets, zero reported violations                                            |
| Core interactions                                | 15 passing checks                                                                                   |
| Focus, typing, and pause                         | Six additional passing checks                                                                       |
| Protected foundation                             | All 19 recorded files byte-identical                                                                |

The protected-file comparison covered package/lock/workspace files, Next configuration, Docker files, both local environment files, Prisma schema and migrations, Prisma client setup, database scripts, and existing database/deployment guidance. No protected file contents were printed. Source formatting used a previously cached Prettier binary; no dependency installation or manifest/lock change was necessary.

Stale generated route types initially referred to the previous root routes; `next typegen` regenerated them successfully. The final production build includes both languages and login variants. Partial route entries represent Next.js streaming for catalog/contact client boundaries, not a backend feature.

## Working behavior and presentation boundaries

**Working:** language navigation, all published public routes and detail links, responsive modal menu, local search/category filters and reset, inquiry context, native form validation, local UTF-8 brief download, pause control, reduced-motion fallback, localized recovery screens, and metadata. Gallery media is configurable as an array; current concepts each have one image, so multiple-image navigation is prepared but was not runtime-tested with real multi-image content.

**Presentation only:** conceptual product/solution entries and illustrations, pending specifications, concept project gallery, completed-work empty state, unfilled contact settings, sample job-detail layout, disabled application action, and login screens. Disabled login inputs collect no credentials. There is no admin dashboard or authentication success path.

**Phase 2 still requires:** verified company/logo/media/contact/inventory/project/job data; real authentication and server-side RBAC; CMS editors and content services; persistent quotations/contacts/applications; validated media upload/storage; secure private pricing; audit logging; and permissioned reporting. See the [roadmap and safety requirements](./product-blueprint.md#roadmap-and-safety-requirements).

## Phase 1 source changes

Routes and recovery files relocated into the locale segment:

- [Localized root layout](../app/[lang]/layout.tsx), replacing the former root layout.
- [Localized public page resolver](../app/[lang]/[[...slug]]/page.tsx), replacing the former homepage composition.
- [Customer login](../app/[lang]/login/page.tsx) and [admin login](../app/[lang]/admin/login/page.tsx).
- [Loading](../app/[lang]/loading.tsx), [error](../app/[lang]/error.tsx), and [not-found](../app/[lang]/not-found.tsx).

Shared source created or refined:

- [Global styles](../app/globals.css), [text icon](../app/icon.svg), and [locale proxy](../proxy.ts).
- [Typed dictionaries and locale helpers](../lib/i18n.ts) and [public content structures](../lib/public-content.ts).
- [Brand](../components/site/brand.tsx), [header](../components/site/header.tsx), [footer](../components/site/footer.tsx), and [hero](../components/site/hero.tsx).
- [Public page compositions](../components/site/public-page.tsx), [catalog](../components/site/catalog.tsx), [solution art](../components/site/solution-art.tsx), and [media gallery](../components/site/media-gallery.tsx).
- [Quotation brief](../components/site/project-brief.tsx) and [login panel](../components/auth/login-panel.tsx).
- [Product blueprint](./product-blueprint.md), this report, and a historical-status note in the [earlier UI report](./phase3-ui.md).

The pre-existing changed favicon, local image assets, original unused lighting sections/showcase, UI primitives, and lighting content module were retained. No new dependency, package lock change, database schema/migration, credentials, environment edit, Docker change, infrastructure change, commit, push, or deployment belongs to this delivery.
