# Official branding and loading verification

Verified locally on 8 November 2026. No commit, push, deployment, database operation, migration, credential change or authentication implementation was performed.

## Supplied artwork and placements

The actual attachments arrived as `AIA_LOGO.png` (1024 × 768) and `AIA_LOGO_G.png` (768 × 768), rather than the descriptive filenames in the request. Both contain the supplied official black artwork. No replacement logo was generated or traced.

| Placement | Supplied source | Display treatment |
| --- | --- | --- |
| Header, including localized homepage link | [AIA_LOGO.png](../public/branding/originals/AIA_LOGO.png) | Transparent margins trimmed; full mark and caption retained; black on light, ivory on dark |
| Footer and unified login branding | Same higher-resolution original | Same full artwork in ivory against the existing dark backgrounds |
| Genuine loading states | Same higher-resolution original | Full artwork, theme-aware; separate moving light mask derived from its inner alpha edges |
| Printable request document | Same higher-resolution original | Black full artwork with its intrinsic aspect ratio |
| Browser favicon and Apple icon | [AIA_LOGO_G.png](../public/branding/originals/AIA_LOGO_G.png) | Existing upper AIA mark extracted above the transparent caption gap; no reconstructed lettering |

The source originals are preserved byte-for-byte. SHA-256 values were compared with the attachments:

- `AIA_LOGO.png`: `fbc76911a86c6ae357ab5adf30df2c917ccc36ff9db6790155c89ee8dc363c85`
- `AIA_LOGO_G.png`: `def6941738a4308e69b7de59d259eee8fe883a7f4ba7fb0cc5ba8ce85283511f`

[The offline derivation script](../scripts/prepare-branding.mjs) uses the installed Sharp dependency to crop, resize and recolor the exact artwork. It can be rerun with `node scripts/prepare-branding.mjs`; originals are never overwritten. Full display assets are lossless 640 × 385 WebP files, approximately 23 KB per theme. Their light/dark alpha channels were verified identical; every edge-mask alpha value is contained within the base artwork. Filenames contain content hashes, recorded with dimensions and source hashes in the [asset manifest](../public/branding/asset-manifest.json).

The [central brand configuration](../lib/branding.ts) defines header, footer, loading, favicon, dimensions, theme variants and safe defaults. The old generic text-based SVG favicon was removed. The [locale metadata](../app/[lang]/layout.tsx) now declares official light/dark PNG icons and the Apple icon; [favicon.ico](../app/favicon.ico) contains 16, 32 and 48 px frames from the actual mark. Chrome successfully decoded the ICO.

## Loading implementation and navigation

The previous plain-name fallback was replaced at its actual sources:

- [Locale loading boundary](../app/[lang]/loading.tsx).
- [Public page loading boundary](../app/[lang]/(public)/[[...slug]]/loading.tsx).
- Four existing inline Suspense fallbacks in [PublicPage](../components/site/public-page.tsx).
- The existing draft-hydration fallback in [RequestFlow](../components/site/request-flow.tsx).

All use [BrandedLoading / RouteLoading](../components/site/branded-loading.tsx). The explicit outer plain-text Suspense wrapper was removed from the [catch-all page](../app/[lang]/(public)/[[...slug]]/page.tsx). No global navigation overlay or duplicate navigation state machine was added.

[Branding CSS](../app/branding.css) supplies a six-second CSS gradient sweep, masked to the supplied artwork's inner edges. There is no logo movement, video, GIF, percentage or visible loading message. A localized screen-reader status remains available. A 120 ms CSS reveal delay suppresses brief flashes; it does not delay navigation, data delivery or dismissal. React removes the fallback as soon as its boundary resolves. Reduced motion removes the illumination animation and displays the static official logo. Without mask support, the normal logo remains. Image failures first use the safe default artwork; if that also fails, the accessible company name remains.

The loader is centered in a bounded content region (220 px for compact fallbacks; route fallback capped at 310 px). Intrinsic image dimensions reserve logo space. It does not cover the entire website or impose a minimum display duration. Replacing a pending content region with its final content can still change that region's height; no claim of zero page-wide CLS is made.

The public catch-all page moved into a `(public)` route group. Its URLs and legacy product redirects remain unchanged. The [shared public layout](../app/[lang]/(public)/layout.tsx) owns the header/footer, keeping them mounted through public route changes. The unified login retains its separate approved design. Its main element now carries the existing navigation-scroll marker, so normal navigation back from a scrolled public page settles at the top. Native Next links and prefetching remain intact.

Hashed branding derivatives receive an immutable one-year cache header through [Next configuration](../next.config.ts). The HTTP response was checked. Originals and the unversioned manifest are not covered by that rule.

## Actual browser verification

Tests used native headless Chrome 156 against a local production build, in isolated browser contexts. Owner browser storage was not used or cleared. Native link clicks exercised real App Router navigation; screenshots show actual rendered pages rather than mockups.

| Check | Result |
| --- | --- |
| Responsive header | All 320, 375, 390, 430, 768 and 1440 px widths, both themes, both locales: 24 passing cases; no horizontal overflow or distorted logo |
| Header height | 76 px below 768 px; 88 px at 768 and 1440 px; no additional mobile header height |
| Route transitions | Home, Products, Services, Projects, About, Careers, Contact, Cart, Consultation (`/request`), Login, in English and Bengali: 20 passing native navigations |
| Navigation persistence | No hard document reload, public header DOM identity preserved, normal scroll-to-top retained, no visible loader remaining after ready |
| Customer state | Added a product twice, verified badge/quantity 2, opened cart quotation, entered synthetic name/phone, changed locale: cart, selected quantity and draft fields preserved |
| Footer/login contrast | Official ivory artwork on their dark surfaces in both application themes; screenshots inspected |
| Favicon | Real ICO decodes; light/dark metadata points to official assets |
| Pending loader | 12 passing combinations of all six widths and both themes; centered, no overflow, intrinsic proportions, compact 220 px region |
| Motion/failure | Moving edge background observed; reduced motion static; blocked logo requests produce accessible company-name fallback |
| Runtime | No uncaught browser exceptions in either completed audit |

The [fast-navigation evidence](./branding-review-2026-11-08/fast-checks.json) contains 91 passed assertions. Observed local native navigations took 154–211 ms, including the harness's 60 ms settling check. These are local observations, not a production performance benchmark. Fully prefetched pages do not need a loading presentation.

The [pending-navigation evidence](./branding-review-2026-11-08/slow-checks.json) contains 30 passed assertions. Three genuine transitions were tested with 500 ms network latency, 180 KB/s download and paused RSC delivery. Before the route response arrived, Next kept the previous page readable; no duplicate overlay appeared. Releasing delivery completed navigation and left no loader. Separately, withholding actual client JavaScript on a cold catalog load caused the real server-rendered Suspense fallback to remain visible. This allowed all 12 loader layout checks, motion/reduced-motion checks and screenshots. Releasing the scripts removed that fallback when the catalog became ready. Test-only network controls introduce no application delay.

Screenshots are in the [review folder](./branding-review-2026-11-08/). Representative captures:

- [320 px light homepage](./branding-review-2026-11-08/home-320-light.png), [390 px dark homepage](./branding-review-2026-11-08/home-390-dark.png), [1440 px homepage](./branding-review-2026-11-08/home-1440-light.png).
- [Mobile footer](./branding-review-2026-11-08/footer-390-dark.png), [unified login](./branding-review-2026-11-08/login-390-dark.png).
- [Mobile light loader](./branding-review-2026-11-08/loading-390-light.png), [mobile dark loader](./branding-review-2026-11-08/loading-390-dark.png), [desktop dark loader](./branding-review-2026-11-08/loading-1440-dark.png).
- [Reduced motion](./branding-review-2026-11-08/loading-390-reduced-motion.png), [image failure](./branding-review-2026-11-08/image-fallback-390.png), [previous page during pending navigation](./branding-review-2026-11-08/slow-navigation-retains-content-390.png).
- [Additional native frame during the gold sweep](./branding-review-2026-11-08/loading-390-gold-edge.png); illumination is deliberately subtle and a still image does not demonstrate movement.

Physical devices, Safari and Firefox were not tested. Responsive testing used browser emulation. Fast transitions can legitimately complete without visibly showing any loader.

## Validation commands

All requested commands completed successfully:

```text
pnpm.cmd lint
pnpm.cmd exec tsc --noEmit --incremental false
pnpm.cmd build
git diff --check
```

The production build generated Prisma Client and 45 static/partially prerendered pages. It did not run migrations or perform business-database writes. Editor diagnostics reported no errors. Git emitted existing LF/CRLF conversion warnings but no whitespace errors.

## Source and asset inventory for this task

New source/configuration files:

- [lib/branding.ts](../lib/branding.ts)
- [components/site/brand-artwork.tsx](../components/site/brand-artwork.tsx)
- [components/site/branded-loading.tsx](../components/site/branded-loading.tsx)
- [app/branding.css](../app/branding.css)
- [app/[lang]/(public)/layout.tsx](../app/[lang]/(public)/layout.tsx)
- [app/[lang]/(public)/[[...slug]]/loading.tsx](../app/[lang]/(public)/[[...slug]]/loading.tsx)
- [scripts/prepare-branding.mjs](../scripts/prepare-branding.mjs)

Updated source/configuration files:

- [components/site/brand.tsx](../components/site/brand.tsx)
- [components/site/header.tsx](../components/site/header.tsx)
- [components/site/footer.tsx](../components/site/footer.tsx)
- [components/site/public-page.tsx](../components/site/public-page.tsx)
- [components/site/request-flow.tsx](../components/site/request-flow.tsx)
- [components/site/request-document.tsx](../components/site/request-document.tsx)
- [components/auth/login-panel.tsx](../components/auth/login-panel.tsx)
- [lib/public-content.ts](../lib/public-content.ts)
- [app/[lang]/layout.tsx](../app/[lang]/layout.tsx)
- [app/[lang]/loading.tsx](../app/[lang]/loading.tsx)
- [next.config.ts](../next.config.ts)

Moved/removed:

- `app/[lang]/[[...slug]]/page.tsx` moved to [app/[lang]/(public)/[[...slug]]/page.tsx](../app/[lang]/(public)/[[...slug]]/page.tsx), retaining the same public URLs.
- Removed the generic `app/icon.svg`; replaced [app/favicon.ico](../app/favicon.ico).

Assets/deliverables:

- [public/branding/](../public/branding/): two unchanged source PNGs, six hashed display/icon/mask derivatives, one JSON manifest.
- This report and [browser evidence](./branding-review-2026-11-08/): two JSON results and 18 PNG captures.
- Corrected the moved route's link in the earlier [UI verification report](./ui-corrections-verification.md).

The working tree already contains extensive earlier uncommitted work. This list describes this branding task; the entire Git status must not be treated as a newly authorized commit set.

## Remaining CMS work

The typed configuration and public site-settings defaults prepare the rendering contract. They do not implement admin uploads or persisted settings. Authorized replacement without editing application code still requires:

1. Real admin authentication and role authorization for branding changes.
2. A persisted Supabase branding revision with asset IDs, variant URLs, validated dimensions and alt/company labels.
3. Validated R2 uploads, supported media origins, safe image processing and generation/selection of matching theme/icon/edge-mask variants. A replacement without a valid edge mask should retain its plain logo.
4. A server settings reader that merges validated persisted settings with these defaults and supplies the same resolved revision to header, footer, loader and metadata. Current placements use local defaults; there is no live CMS reader.
5. Cache invalidation/revalidation on publishing a revision, using new versioned asset URLs, and an explicit update path for the App Router fallback favicon.

Those changes belong to the future CMS/media implementation. No upload, storage persistence or secure admin-management capability is claimed here.
