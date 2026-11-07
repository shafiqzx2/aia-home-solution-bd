# Phase 3: public website and login previews

**Historical snapshot:** use the [product blueprint](./product-blueprint.md) and [current validation report](./phase1-validation.md) for the current home and commercial solutions positioning, bilingual routes, public content model, and Phase 1 scope. The image-generation provenance below remains applicable.

## Scope

The public homepage is at `/`, with customer and staff login previews at `/login` and `/admin/login`. No authentication, admin dashboard, API endpoint, database query, or enquiry submission is implemented in this phase. Both login pages are marked `noindex, nofollow`, explain their preview status, and have a disabled sign-in action. Do not enter real credentials.

The homepage includes collections, filterable product concepts, accessible product dialogs, five service descriptions, conceptual space previews, brand information, a consultation call-to-action, and a local project-brief download. There are no public prices, invented client projects, testimonials, or business statistics.

Confirmed contact details have not been supplied. The contact section states this explicitly. Its download prepares a plain-text brief locally; nothing is transmitted or stored online. Before launch, obtain verified phone, WhatsApp, email, and showroom information, then choose a real enquiry workflow. Do not replace the current notice with a pretend submission confirmation.

## Maintenance map

- [Homepage](../app/page.tsx) composes the public sections.
- [Global styles](../app/globals.css) define the charcoal, warm-white, and champagne design tokens, responsive layouts, product illustrations, and motion preferences.
- [Root layout](../app/layout.tsx) configures the Geist and Cormorant Garamond fonts, shared metadata, branded icons, and skip link. Next.js self-hosts the font files; a clean build may need internet access to fetch them.
- [Public components](../components/site/) contain the header, native-dialog mobile navigation, lighting hero, product presentation, service and space sections, footer, and project brief.
- [Shared UI](../components/ui/) contains the icon and section-heading primitives.
- [Site content](../lib/site-content.ts) holds navigation, collections, illustrative product data, and services. Replace concepts with verified product information in a later phase, without exposing prices publicly.
- [Login panel](../components/auth/login-panel.tsx) is shared between the two login previews. It intentionally has no form submission or credential persistence. Future authentication must enforce authorization on the server; this UI is not an access-control boundary.
- [Loading](../app/loading.tsx), [error](../app/error.tsx), and [not-found](../app/not-found.tsx) views provide honest fallback and recovery states. The error boundary uses this project's Next.js `retry` callback.

The hero uses a compressed image with CSS opacity/transform animation, not a video or animation dependency. A pause control stops decorative motion. Mobile layouts remove animated glow layers; reduced-motion preferences disable animations, transitions, and smooth scrolling. Warm/soft controls change the visual atmosphere only, not a technical color-temperature specification.

Product illustrations are CSS-native. Images use `next/image` with responsive sizing, lazy loading below the fold, and eager loading for the hero. No external runtime image service, analytics, authentication service, or hosting-specific integration was added. No project dependency or lockfile changes were required. A one-off Prettier command formatted the new UI code without adding a project dependency.

## Image provenance

The three assets in [public/images](../public/images/) are original AI-generated conceptual illustrations, not photographs of completed AIA projects or actual products. Visible labels and explanatory copy preserve that distinction. PNG originals were converted to WebP using the project's existing Sharp installation. Combined source WebP size is approximately 463 KiB.

### Hero: lighting-hero.webp

Generation prompt:

> Use case: stylized-concept. Asset type: premium architectural lighting website hero background, wide landscape 3:2. Create a photorealistic cinematic architectural light installation in a dark monolithic charcoal room. A fine suspended champagne-white continuous LED ribbon sweeps from top center across the right side in an elegant sharp angular zigzag / open rectangular loops, receding into depth, with a few thin vertical suspension cables. Sculptural black stone plinths and softly illuminated stepped platforms at the bottom right, warm amber grazing light on dark walls, a little atmospheric depth, tactile concrete, luxurious international lighting design campaign. Restrained 2700K warm white, dark olive-charcoal black. Dramatic precise architectural lines, beautiful physical light spill, natural reflections, no excessive bloom. LEFT HALF MUST REMAIN ALMOST EMPTY DARK CHARCOAL, with only subtle shadows so large white website text can overlay there. No furniture, people, text, logos, watermark, UI or borders. This is an original conceptual installation, not a real project.

### Residential: residential-concept.webp

Generation prompt:

> Use case: photorealistic-natural. Asset type: architectural lighting concept editorial photograph, landscape 3:2. A beautifully restrained modern living room at blue hour, warm ivory curved sofa, smoked oak vertical wall panels, travertine coffee table, beige linen textures, elegant champagne-bronze sculptural pendant, warm recessed cove light and meticulously integrated linear lights along a textured wall. Frame a corner from an architectural magazine, balanced sophisticated composition, soft indirect illumination, subtle real shadow, rich warm neutrals, premium natural materials, no people or text, no logos or watermark. Interior concept image, not an actual completed client project.

### Hospitality: hospitality-concept.webp

Generation prompt:

> Use case: photorealistic-natural. Asset type: premium architectural lighting concept editorial photograph, landscape 3:2. Quiet luxurious boutique restaurant interior at dusk: dark smoked oak, terracotta plaster wall, a row of delicate warm brass cylindrical pendant luminaires over a sculptural stone counter, low glowing indirect LED shelving and arched architectural opening, olive and amber tones. Cinematic intimate golden lighting with precise beautiful light pools, architecture and materials are the focus, beautiful composition with depth, high-end design magazine photographic realism. No people, text, logos or watermark. This is an original hospitality lighting concept, not a real completed client project.

## Validation and handoff

Run from the project root on Windows:

```powershell
pnpm.cmd lint
pnpm.cmd exec tsc --noEmit --incremental false
pnpm.cmd build
```

Use `pnpm.cmd dev --hostname 127.0.0.1 --port 3130` for a local preview. Production hosting remains governed by the existing standalone Docker setup, which was not changed for this UI work. Do not restart database containers to preview the public pages; they do not access the database.

Browser checks should cover desktop and 320–390 px mobile layouts; menu focus and Escape dismissal; product filters and dialogs; the service accordion; hero atmosphere and pause controls; reduced-motion behavior; brief validation, download, and failure feedback; disabled login submission; and the absence of an admin dashboard. Also check image loading, page titles, login robots metadata, console errors, horizontal overflow, and automated accessibility results. Automated checks do not replace manual testing with assistive technology or on physical devices.

Before a future public launch, supply verified products and completed-project imagery, confirm business contact details and branding, and implement properly secured authentication and enquiry handling as separately scoped backend work. No database, credential, Docker, Prisma, backup, or restore configuration changes belong to this phase.

### Completed validation

- ESLint, standalone TypeScript checks, production build, formatting checks, and Git whitespace checks passed.
- A temporary headless Edge harness against the local production standalone server passed 51 interaction, responsiveness, accessibility, and safety assertions. It was kept outside the repository; no browser-testing dependency was added to the project.
- Seven axe-core scans reported no violations for the selected WCAG 2 A/AA and 2.1 AA rules: homepage desktop, 390 px and 320 px mobile, plus both login pages at desktop and 390 px mobile.
- Homepage overflow checks passed at 1440, 1024, 768, 390, 360, and 320 px. Both login pages also passed 390 px and 320 px overflow checks.
- Browser checks found no JavaScript runtime exceptions, external page requests, or non-GET application requests. Project-brief contents and failure feedback were checked without sending an enquiry. Login fields used synthetic test values only.
- Byte-level comparisons found all 26 protected foundation files unchanged, including local environment files, Docker settings, Prisma, database scripts, package files, and existing deployment/database documentation.

A rebuild initially encountered a Windows file lock while the local standalone preview was running. Stopping only that owned application preview resolved it; the subsequent build passed. No database process or container was involved. Physical-device, Safari/Firefox, screen-reader, and live-content acceptance testing remain future checks.

## Changed-file manifest

Four existing files were changed:

- [app/favicon.ico](../app/favicon.ico)
- [app/globals.css](../app/globals.css)
- [app/layout.tsx](../app/layout.tsx)
- [app/page.tsx](../app/page.tsx)

Twenty-two files were added:

- [app/admin/login/page.tsx](../app/admin/login/page.tsx)
- [app/error.tsx](../app/error.tsx)
- [app/icon.svg](../app/icon.svg)
- [app/loading.tsx](../app/loading.tsx)
- [app/login/page.tsx](../app/login/page.tsx)
- [app/not-found.tsx](../app/not-found.tsx)
- [components/auth/login-panel.tsx](../components/auth/login-panel.tsx)
- [components/site/brand.tsx](../components/site/brand.tsx)
- [components/site/footer.tsx](../components/site/footer.tsx)
- [components/site/header.tsx](../components/site/header.tsx)
- [components/site/hero.tsx](../components/site/hero.tsx)
- [components/site/home-sections.tsx](../components/site/home-sections.tsx)
- [components/site/product-art.tsx](../components/site/product-art.tsx)
- [components/site/product-showcase.tsx](../components/site/product-showcase.tsx)
- [components/site/project-brief.tsx](../components/site/project-brief.tsx)
- [components/ui/icon.tsx](../components/ui/icon.tsx)
- [components/ui/section-heading.tsx](../components/ui/section-heading.tsx)
- [docs/phase3-ui.md](./phase3-ui.md)
- [lib/site-content.ts](../lib/site-content.ts)
- [public/images/hospitality-concept.webp](../public/images/hospitality-concept.webp)
- [public/images/lighting-hero.webp](../public/images/lighting-hero.webp)
- [public/images/residential-concept.webp](../public/images/residential-concept.webp)
