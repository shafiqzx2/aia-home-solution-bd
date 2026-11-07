# Local UI corrections and verification

Latest release follow-up: the [final readiness review](./final-release-readiness.md) repeats these acceptance checks against the complete branded website and fixes query-driven draft resets during recent Back navigation. The results below remain the earlier UI-pass record.

Verified 8 November 2026 against a local production build and the existing development site. No commit, push, deployment, migration, database reset, credential changes, package changes or CMS implementation was performed.

## Delivered website behavior

- Homepage: six independent category previews with category icons, concise descriptions, filtered catalog links and Explore All Products. No individual product cards, inventory images, product quotation actions or Add to Cart controls appear on the homepage. Audio & Digital opens both matching categories.
- Catalog: image/illustration, name, description, Quick View, Add to Cart, Request Quotation and product consultation are grouped inside each card. Public prices are absent. Existing gallery and specification data remain available in Quick View. Known legacy product URLs redirect into the catalog; cart product links open the same catalog view. Services recommend category links.
- Requests: one page shows customer details, purpose/contact preference, selections and scheduling groups. Product IDs and quantities, cart selections, service booking entries, multiple services, onsite address requirements and language-switch drafts are retained. An optional product picker can expand within this page. No Continue/Next navigation remains.
- Submission: required fields, phone, optional email, date, onsite address and custom requirements are validated. Online submission is unavailable. Submit Request explicitly reports that nothing was sent. The PDF action prepares a local print document for browser Print/Save as PDF; text download remains available. Appointment preferences are not confirmed bookings.
- Footer: brand, introduction, navigation, categories, services, contacts, copyright and shared Login link. Facebook, Instagram, YouTube, LinkedIn and WhatsApp icons are present. The four absent profile URLs produce disabled, non-clickable icons; WhatsApp uses the configured number. No placeholder `#` social destinations exist. Mobile link groups expand independently.
- Mobile: compact single-column product cards at narrow widths, collapsible catalog filters, shorter hero with the background composition shifted left, responsive request fields, and a separate bottom dock for theme/WhatsApp controls. Page space and focus scroll clearance are reserved for the dock; it hides while request inputs are focused. Desktop hero composition remains intact.

## Product spacing root cause

The old `.product-card > a` had `height: 100%`, while ProductActions was a sibling outside that link. The link consumed the entire grid item height before the actions were laid out. Browser measurement showed a roughly 517px card and 517px link followed by another roughly 90px action block outside the card.

The new card directly contains its visual, copy and actions, using natural image sizing and `auto 1fr auto` grid rows. The full-height link was removed, descriptions and actions use compact padding, and empty feedback no longer reserves space. Measured row gaps are 28px on mobile and 32px on desktop; action blocks remain within their cards in all checked layouts. Primary and secondary actions share their row height and provide at least a 46px target (wrapping labels can increase both heights together).

## Checks performed

| Check | Result |
| --- | --- |
| `pnpm.cmd lint` | Passed, no warnings |
| `pnpm.cmd exec tsc --noEmit --incremental false` | Passed |
| `pnpm.cmd build` | Passed; Prisma Client generated, 46 pages generated, no database migration |
| `git diff --check` | Passed; Git emits existing LF/CRLF conversion notices |
| Editor diagnostics | No errors |
| Native Chrome production layout audit | 42 page/width combinations, zero horizontal overflow, zero action containers outside cards, zero runtime exceptions |
| Homepage category links | All six open the matching filtered catalog; Audio & Digital includes both groups |
| Catalog interaction | Add to Cart and quantity handling update the global badge, retain existing cart lines and survive navigation/reload |
| Quick View accessibility | Modal opens with the correct product, contains Tab focus, closes with Escape/close button and restores trigger focus |
| Request entries | General, product consultation, multi-product cart quotation and service booking verified |
| Validation | Missing name, invalid phone/email, past date, missing onsite address and short custom description blocked |
| Draft/PDF behavior | Product/quantity and two selected services appear in the prepared document; print action invoked; language switch retains draft; customer fields absent from localStorage/sessionStorage |
| Submission honesty | Valid submission shows the unavailable message; no POST or confirmed booking is produced |
| Mobile controls | Real browser clicks verified collapsed category filter, selected category, automatic filter close, Add to Cart and expandable footer groups at 390px |
| Themes/socials | Theme switching survives reload; both themes visually inspected; five icons present, four unavailable, configured WhatsApp link valid |

Widths tested: **320, 375, 380, 390, 430, 768 and 1440 CSS pixels**, on English and Bengali homepages, catalogs and request forms. Independent headless Chrome was used for final captures to avoid the integrated browser's host zoom affecting screenshot dimensions. Actual CSS widths were checked, and PNG dimensions were verified.

Mobile hero heights were 503–518px in English and 494–505px in Bengali, replacing the former 740px mobile minimum. This audit uses Chromium; physical iOS Safari and Android device checks remain useful before production release.

Detailed layout measurements: [browser-checks.json](./ui-review-2026-11-08/browser-checks.json). Native mobile click/focus checks for the final dock, theme switch, cart badge and footer expansion also passed: [mobile-dock-checks.json](./ui-review-2026-11-08/mobile-dock-checks.json).

## Review screenshots

All final captures were inspected locally. They show local production rendering with the existing public content and empty customer fields.

- [390px dark homepage](./ui-review-2026-11-08/home-mobile-390-dark.png)
- [390px light category previews](./ui-review-2026-11-08/categories-mobile-390-light.png)
- [390px dark catalog](./ui-review-2026-11-08/catalog-mobile-390-dark.png)
- [320px light catalog](./ui-review-2026-11-08/catalog-mobile-320-light.png)
- [320px light homepage](./ui-review-2026-11-08/home-mobile-320-light.png)
- [390px mobile footer](./ui-review-2026-11-08/footer-mobile-390-light.png)
- [390px request form](./ui-review-2026-11-08/request-mobile-390-light.png)
- [390px Quick View](./ui-review-2026-11-08/quick-view-mobile-390-dark.png)
- [1440px desktop homepage](./ui-review-2026-11-08/home-desktop-1440-dark.png)
- [1440px desktop catalog](./ui-review-2026-11-08/catalog-desktop-1440-light.png)
- [1440px desktop footer](./ui-review-2026-11-08/footer-desktop-1440-dark.png)

## Actual source files changed in this UI pass

1. [Homepage](../components/site/home-content.tsx)
2. [Catalog](../components/site/catalog.tsx)
3. [Product card and Quick View — new](../components/site/product-card.tsx)
4. [Product actions](../components/site/product-actions.tsx)
5. [Cart product links](../components/site/cart-page.tsx)
6. [Public page composition](../components/site/public-page.tsx)
7. [Related category links](../components/site/related-products.tsx)
8. [Locale routes and legacy product redirects](../app/[lang]/(public)/[[...slug]]/page.tsx)
9. [Single-page request form](../components/site/request-flow.tsx)
10. [Request copy](../lib/request-copy.ts)
11. [Footer](../components/site/footer.tsx)
12. [Mobile footer groups — new](../components/site/footer-links.tsx)
13. [Contact and social rendering](../components/site/contact-details.tsx)
14. [Quick actions dock label](../components/site/floating-tools.tsx)
15. [Recognizable social and category icons](../components/ui/icon.tsx)
16. [Central social configuration and category previews](../lib/public-content.ts)
17. [Original card height fix](../app/globals.css)
18. [Catalog mobile width constraints](../app/refinements.css)
19. [Responsive catalog, form, footer, hero and dock styles](../app/business.css)

The blueprint and storage plan were also synchronized with catalog Quick View and the single-page request form. Screenshots and this verification report are review deliverables, not application dependencies.

## Preserved data and remaining limits

Comparison with the pre-UI preparation snapshot confirms that [cart storage code](../lib/cart.ts), [request language handoff](../lib/request-draft.ts), [shared login interface](../components/auth/login-panel.tsx), [Prisma schema](../prisma/schema.prisma), and all existing product/service data following the product collection declaration are unchanged. No product IDs, descriptions, images or specifications were removed. Tests used temporary browser contexts/profile and synthetic customer data; the owner's cart was not cleared.

Fill `company.socialLinks.facebookUrl`, `instagramUrl`, `youtubeUrl` and `linkedinUrl` in [public configuration](../lib/public-content.ts) when the owner supplies real URLs. WhatsApp remains centralized at `company.contact.whatsapp`. These settings can be persisted/exposed by a later CMS task.

Real request submission, confirmed bookings, authentication/RBAC, CMS, Supabase and R2 implementation remain separate backend work as previously audited. The existing shared login interface was preserved, with no authentication claims added. No backend booking records exist for this frontend draft flow.

Review the corrected local site before approving any Git staging, commit, push or Preview deployment.
