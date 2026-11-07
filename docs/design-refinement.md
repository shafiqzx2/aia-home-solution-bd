# Design modification and UX refinement

This is an incremental refinement of the completed public site. The [product blueprint](./product-blueprint.md) contains the current specification and future CMS requirements. The previous uncommitted work and foundation were retained.

## Completed features

- Preserved the cinematic homepage composition, original source images, charcoal/ivory/champagne palette, editorial English typography, product card/detail styling, and service article layouts. The original global stylesheet was not rewritten.
- Strengthened the hero illumination with a brighter traveling core and controlled desktop glow. The source path follows the photographed light strip, including corrected alignment against its bright pixels. Shared source-aspect canvases keep the image and overlay together through desktop/mobile cropping.
- The eight-second desktop chase increases, travels, fades, and repeats. Phones retain visible motion with an eleven-second single-layer chase and no blur. Pause works on both. Reduced motion uses the static installation and stops contact-ray rotation.
- Added full dark/light themes. Light uses warm ivory surfaces, dark typography, readable darker accent text, light cards/forms/menus, and intentionally dark cinematic/photo/footer areas. No inversion filter is used.
- A discreet floating sun/moon button changes the theme. First visits follow the system; explicit choices persist in local storage through language changes, navigation, reloads, and later visits. A synchronous head script selects the theme before body paint. Storage failures are handled gracefully.
- Replaced the Bengali font treatment with Anek Bangla headings and Hind Siliguri body/control text. Fonts are self-hosted with `next/font`, and their OFL notices are included. English brand/hero/editorial text is explicitly retained; navigation, categories, descriptions, forms, and business information remain naturally Bengali. Recognized names such as CCTV and WhatsApp stay recognizable.
- Mobile Products/Services menu groups start collapsed, toggle with accessible buttons, and expose both overview links and category/detail links. Menu closure resets groups. The shared catalog filter starts collapsed on phones, shows the selection, and closes after choosing. Product search and filtering remain functional; Services now has a compact category filter while retaining its article layout.
- Prepared recursive category data and shared parent/descendant helpers. Future child categories do not require rebuilding the navigation/filter components. No fictitious categories were inserted to demonstrate nesting.
- Added one shared, safe-area-aware WhatsApp/theme dock in the locale layout. Green WhatsApp artwork remains stationary; champagne rays rotate slowly. Controls have separate touch targets, focus states, and clearance around narrow forms/catalogs.
- No WhatsApp number was supplied. The visible control opens an honest availability notice and localized Contact link. It never creates a broken chat URL. With a configured, valid international number, it can create a correctly encoded `wa.me` URL and prefilled message. No real chat was opened in testing.
- Added server-only review structures and a minimalist review component. It remains entirely hidden because there are no genuine approved, consented reviews. No stars, names, counts, aggregate ratings, or testimonials were invented.
- Header/footer logos remain centralized placeholders. The header logo continues to return to the homepage in the current language. Homepage product/service entries retain their corresponding detail destinations.

The original image still contains baked-in illumination, shadows, and reflections. This SVG treatment is a visible chase demonstration, not physically simulated relighting or a 360-degree viewer. Richer dimming/reflection changes require source-aligned fixture masks and unlit/lit image plates, layered artwork, or an approved 3D scene.

## Browser validation

Headless Edge tested **13 representative routes × 2 languages × 2 themes × 9 CSS viewport widths = 468 distinct layout combinations**. Widths were **320, 375, 390, 430, 768, 834, 1024, 1440, and 1920 px**. All layout checks passed. After final alignment and floating-control clearance adjustments, the affected six page layouts were checked again: **216 focused responsive checks passed**.

Checks covered actual viewport dimensions, horizontal overflow, bounds of headings/copy/fields/header controls, floating-control separation, and keeping the dock within the viewport. Fully hydrated catalog/contact/service content was required before assertions; loading placeholders were not accepted as the tested catalog.

**27 distinct accessibility scan targets** across themes/languages, including expanded filters, the mobile menu, and WhatsApp availability, reported **zero violations** for the selected WCAG 2 A/AA and 2.1 AA axe-core rules. The affected page scans were repeated after final spacing adjustments. These checks do not replace manual assistive-technology testing.

The focused interaction run passed **29 checks** covering:

- First-visit system theme, live system changes, explicit preference precedence, and persistence.
- English hero with Bengali controls, and the intended Bengali body font.
- Initially collapsed mobile menu groups, expand/collapse, overview/detail destinations, and Escape/focus restoration.
- Initially collapsed Product/Service filters, category selection, visible selection labels, URL state, correct results/detail links, and closing after mobile selection.
- Locale-preserving logo navigation, hidden reviews, and absence of invented WhatsApp links.
- WhatsApp availability content, Contact destination, and keyboard dismissal/focus return.
- Advancing fixture illumination, shared image/overlay geometry, lightweight mobile motion, pause, and reduced-motion behavior.
- Separate floating controls and mobile form-action clearance.
- No application submission requests and no browser runtime exceptions.

Pure-function checks also passed for malformed/local-format WhatsApp rejection, valid international URL/message encoding using a reserved synthetic test number, nested category flattening, parent/child filtering, unknown categories, and Bengali child labels. The synthetic number was never saved in site settings and no chat was opened.

Screenshots were captured at all nine widths in both themes and selected Bengali views. Visual review covered 320/375/390/430 px phones, 768/834 px tablet layouts, and 1024/1440/1920 px wider layouts. It included warm-ivory and charcoal pages, Bengali catalog/contact typography, collapsed/expanded mobile navigation, and two distinct lighting-animation frames at both 390 and 1440 px. These frame comparisons visibly show the illumination changing position along the physical fixture.

Final engineering results:

| Check                                            | Result                                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `pnpm.cmd lint`                                  | Passed                                                                                               |
| `pnpm.cmd exec tsc --noEmit --incremental false` | Passed                                                                                               |
| `pnpm.cmd build`                                 | Passed; 63 generated static/partial route entries                                                    |
| `git diff --check`                               | Passed                                                                                               |
| Editor diagnostics                               | No errors                                                                                            |
| Pre-paint theme initialization                   | Confirmed in document head before body markup; persisted theme also confirmed at document-ready time |
| Protected foundation                             | All 19 recorded protected files byte-identical                                                       |
| Original layout stylesheet                       | Byte-identical; refinements are scoped in a separate stylesheet                                      |

No database, environment, credentials, migrations, container/volume, dependency, lockfile, deployment, Git commit, or push operations were used. The local preview remains compatible with `http://localhost:3000`, which redirects to `/en`.

## Remaining scope and limitations

- WhatsApp needs the owner's verified international number before real contact can work. The current availability state is intentional.
- Reviews need authentic content, source/evidence, moderation approval, and publication consent. Their model/presentation is prepared; actual review publishing was not exercised because no real reviews exist.
- No real child-category content was supplied. Recursive data helpers were tested with synthetic structures; live nested category publishing remains dependent on future CMS content.
- Authentication, CMS editing, persistent inquiries/quotations/applications, uploads, moderation tools, roles, audit logging, and business analytics remain future backend work. Login and online submission states remain unavailable.
- The gallery architecture is preserved; no multi-angle product assets or extra project images were fabricated.
- Browser testing used local Chromium/Edge emulation. Physical phones/tablets, Safari/Firefox, screen readers, actual WhatsApp delivery, and production hosting were not tested.
- The reference [Kitchen Hood Service Dhaka website](https://www.kitchenhooddhaka.com/) was reviewed for clear service/product entry points and contact convenience. No reference assets, code, brand details, prices, reviews, or business claims were copied.

## Changed files

New shared implementation:

- [Theme/style refinements](../app/refinements.css).
- [Theme bootstrap](../lib/theme.ts), [WhatsApp URL validation](../lib/whatsapp.ts), [recursive category helpers](../lib/category-tree.ts), and [server-only review records](../lib/reviews.ts).
- [Floating controls](../components/site/floating-tools.tsx), [media-query hook](../components/site/use-media-query.ts), [category filter](../components/site/category-filter.tsx), [mobile menu groups](../components/site/mobile-navigation.tsx), [service filter/catalog](../components/site/service-catalog.tsx), and [hidden-until-approved review presentation](../components/site/review-preview.tsx).
- [Anek Bangla OFL notice](../public/fonts/licenses/anek-bangla-OFL.txt) and [Hind Siliguri OFL notice](../public/fonts/licenses/hind-siliguri-OFL.txt).

Refined existing files:

- [Locale layout](../app/[lang]/layout.tsx), [UI icons](../components/ui/icon.tsx), [locale dictionaries](../lib/i18n.ts), and [public settings/content](../lib/public-content.ts).
- [Header](../components/site/header.tsx), [hero](../components/site/hero.tsx), [product catalog](../components/site/catalog.tsx), [public page composition](../components/site/public-page.tsx), [quotation brief](../components/site/project-brief.tsx), and [login presentation](../components/auth/login-panel.tsx).
- [Product blueprint](./product-blueprint.md), a historical-status note in the [Phase 1 report](./phase1-validation.md), and this delivery report.

No dependency, lockfile, environment/credential, Prisma schema/migration, Docker, database-container/volume, or deployment infrastructure change was required. No commit, push, or deployment was performed.
