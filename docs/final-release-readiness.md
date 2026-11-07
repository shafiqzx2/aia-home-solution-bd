# Final release readiness and GitHub staging review

Reviewed locally on 8 November 2026. Decision: **ready for an explicitly approved commit and a protected frontend Vercel Preview**, subject to configuring and checking the actual Vercel project. **Not ready for an operational production launch.** Authentication, CMS and online request persistence remain unimplemented and are clearly disabled in the UI.

No branch was created, nothing was staged, and no commit, push, merge, deployment, migration, database reset or credential change was performed. The owner's existing development server and browser data were preserved.

## Acceptance checklist

| Requirement | Verified result |
| --- | --- |
| Category-only homepage | Pass: six solution category previews and Explore All Products; no product cards or Add to Cart. Each category opens the matching filtered catalog. |
| Compact catalog | Pass: images, description, Quick View and actions stay inside their cards. Row gaps are 28 px on mobile and 32 px on desktop; no overlapping actions or horizontal overflow in the checked layouts. |
| Catalog actions | Pass: native Add to Cart updates the global badge and retains correct IDs/quantities. Product quotation and consultation select the correct product and purpose. No public prices. |
| No single-product page | Pass: browsing/selection remains in the catalog. Known legacy product URLs redirect to catalog Quick View; cart links use the same view. The modal closes with Escape and restores focus. |
| One-page consultation/quotation | Pass: four visible field groups, one Submit Request action, no Continue/Next wizard. Cart products and multiple services are selectable on this page. Required details, optional email and onsite address are validated. |
| Mobile hero | Pass: approximately 494–518 px high at the checked narrow widths, with the existing left-shifted composition. Desktop composition preserved. |
| Footer socials | Pass: Facebook, Instagram, YouTube, LinkedIn and WhatsApp icons present. Four profile URLs remain unset and render unavailable non-links; configured WhatsApp works. No invented or `#` social destinations. Values are centralized in public site settings. |
| Official brand | Pass: official full artwork in header/footer/login/loading/print; appropriate black/ivory variants. Official favicon assets and metadata retained. Original PNGs remain preserved. See the [branding verification](./branding-integration-verification.md). |
| Languages/themes | Pass: English/Bengali and Dark/Light tested. Intentional English editorial brand headlines remain part of the approved design. Theme control persists the choice. |
| Customer state | Pass after the fix below: two product selections/quantities, customer fields, language switching, printing and recent Back navigation behave correctly. Reload preserves cart; unsent personal fields remain memory-only and start fresh on reload. |

## Safe fix made during this review

An actual cart-quotation regression was reproduced: entering customer details, switching locale, navigating to the catalog and using Back could restore products but clear customer fields. Hidden Activity-cached request components still received the current page's query parameters. The unrelated query changed the keyed form entry and reset its state.

[RequestFlow](../components/site/request-flow.tsx) now accepts entry-query changes only while its own localized request route is active. Hidden forms retain their prior entry key. The formerly failing journey passed after the change, including name, phone, address, notes, product quantities and locale handoff. A new product/service entry still initializes the correct request. No personal fields were added to URLs, cookies, localStorage or sessionStorage.

This relies on the framework's recent-route cache, not durable draft storage. A reload or eventual cache eviction can start a fresh draft, as the existing notice explains. Next documents its bounded Activity cache in the installed preserving-state guide. Long-lived draft persistence remains a separate product/privacy decision.

The [Git](../.gitignore), [Docker](../.dockerignore) and [Vercel](../.vercelignore) exclusions were also strengthened for package caches, test/browser reports and generated output. Git now excludes general log files. No database or deployment behavior was changed by these exclusions.

Checking new, unstaged text also found one trailing space in each bundled font-license file. Those two spaces were removed without changing license wording or copyright notices, so the eventual staged whitespace check will also pass.

## Git and complete release scope

- Current branch: `main`; HEAD and local `origin/main`: `bd973366c2e41cc0ed06300b14e8decfcb1a3ae4`.
- Read-only `git ls-remote` confirmed the live remote `main` has the same SHA. The proposed staging branch did not exist remotely at review time.
- Fetch/push remote remains `https://github.com/shafiqzx2/aia-home-solution-bd.git`. Ownership and remote configuration were not changed.
- The index remains empty. The working tree contains the full accumulated frontend implementation, not just this review's small fix. A tracked-only diff omits most of the website because those application modules/assets are still untracked.
- Reviewed 59 TypeScript/TSX application modules, routing, CSS, public content, media/branding assets, build configuration and intended root-route deletions. The [source review inventory](./release-review-2026-11-08/source-review.json) records paths, hashes, import/export summaries and targeted security checks.
- The [refreshed staging manifest](./vercel-preview-staging-manifest.md) lists every proposed added/modified/deleted path. The [literal path list](./release-reviewed-paths.txt) is the exact proposed staging input. It includes the official logo assets, all latest UI fixes, the draft fix, deployment exclusions/configuration, offline branding derivation script and review documentation/evidence. Review images are intentional documentation deliverables, not build caches.
- Existing unchanged tracked foundation files remain part of the resulting checkout automatically, including the lockfile, Prisma probe schema/migration and database/VPS helpers. No migration changes are proposed. The old root layout/page deletions are intentional replacements by localized routes; do not restore them while staging.

The previous staging manifest had obsolete route paths and omitted later corrections. It has been replaced rather than used for partial staging. No `git add -A`, directory-wide staging or other staging operation was performed.

## Credential protection

The real local environment files and R2 credential file remain local, untracked and excluded by all three packaging/staging rule sets. Names only were reported; values were neither printed nor copied. No secrets were removed, relocated or modified.

Checks covered recognized environment, credential/export, private key, backup/dump, dependency/cache and generated-output paths, including fixtures inside allowed application/public directories. All exclusion fixtures passed Git matching and the reviewed Docker/Vercel pattern checks. Docker patterns were checked with a compatible Git-style matcher and manual review; a live Docker build-context test was not run.

All eligible current text files and known-secret byte matches in binary candidates were scanned without emitting secret values. The three commits reachable through the local Git refs were checked for sensitive paths, known local secret values and strong token/private-key patterns. No matches or tracked real credential files were found. This establishes no confirmed exposure in the reviewed Git material; provider access logs, prior manual uploads and external archives were not inspected.

The already-tracked [.env.example](../.env.example) remains a non-secret development template: password and database URL fields are empty. It is unchanged, is not a new staged environment file, and remains excluded from Docker and Vercel CLI uploads. Recognized private filenames stay excluded even if placed inside an otherwise allowed upload directory. Ignore rules do not protect deliberate force-adds or secrets disguised under arbitrary names; the final staged diff must still be checked.

## Build and browser evidence

| Check | Result |
| --- | --- |
| `pnpm.cmd lint` | Passed after the request fix. |
| `pnpm.cmd exec tsc --noEmit --incremental false` | Passed after the final production build. |
| `pnpm.cmd build` | Passed; Prisma Client generated, 45 pages generated; no migration or business-database query needed. |
| `git diff --check` | Passed; existing LF/CRLF conversion notices only. |
| Editor diagnostics | No errors in the changed request component. |
| `pnpm.cmd audit --prod --json` | Passed; zero reported production dependency advisories at review time. No package/lockfile upgrades performed. |
| Isolated frozen install | Passed using pnpm 12.16.1 and cached locked packages; no new dependency resolution. |
| Isolated Preview build | Passed from all 94 reviewed CLI upload inputs, with zero real environment files copied and database/provider variables removed from the child environment. Uses Preview headers and native Next output. |
| Input integrity | All 94 copied build inputs matched the reviewed source hashes after the fix. |
| Native Chrome regression | 203 passed assertions; 84 responsive page/language/theme combinations; 20 real link-driven route transitions; no uncaught runtime exceptions or backend POSTs. |
| Customer journeys | Categories/filtering, Quick View/Escape/focus, multi-product cart, product quotation/consultation, required/email/address validation, locale draft preservation, PDF print preparation, Back restoration, cart reload and multiple services passed. |
| Loading | Real cold-catalog Suspense tested by withholding actual client scripts; official logo appears, reduced motion is static, fallback disappears when scripts/content become ready. Prefetched transitions need no forced loader. |
| Preview HTTP | Whole-site noindex/nofollow/noarchive verified on locale/root pages, catalog, login, legacy login redirects and an unknown route. |

Local runtime: Node 24.13.0, pnpm 12.16.1, Next.js 16.4.4, Prisma/Client 6.19.0. Node 24.x and pnpm are pinned; existing dependency engine requirements are satisfied. The build generates Prisma Client but does not execute `db:*` scripts. Vercel supports [Node 24.x](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Browser widths: **320, 375, 380, 390, 430, 768 and 1440 px**, both languages and both themes, on home/catalog/request. Tests used isolated native Chrome contexts against the production build from the environment-free verification checkout. Synthetic customer data was used; owner cart/drafts were not accessed or cleared.

Evidence: [browser checks](./release-review-2026-11-08/browser-checks.json), [isolated build](./release-review-2026-11-08/isolated-build.json), [Preview HTTP checks](./release-review-2026-11-08/preview-http-checks.json), [source/security review](./release-review-2026-11-08/source-review.json). Local build logs remain ignored generated output.

Representative inspected screenshots:

- [Mobile homepage categories](./release-review-2026-11-08/home-categories-390-light.png).
- [320 px catalog cards](./release-review-2026-11-08/catalog-cards-320-light.png), [390 px dark cards](./release-review-2026-11-08/catalog-cards-390-dark.png), [1440 px cards and next row](./release-review-2026-11-08/catalog-cards-1440-light.png).
- [Bengali request draft](./release-review-2026-11-08/request-390-bengali.png), [mobile footer](./release-review-2026-11-08/footer-390.png), [unified login](./release-review-2026-11-08/login-390.png), [reduced-motion loader](./release-review-2026-11-08/loading-390-reduced-motion.png).

Unknown routes display the branded not-found UI. Because a Suspense stream can already have started, an unknown route can have HTTP 200 with noindex rather than an HTTP 404; this is documented [Next loading/status behavior](https://nextjs.org/docs/app/api-reference/file-conventions/loading#status-codes). It is not an exposed CMS or a product detail route. Physical devices, Safari/Firefox, an actual Vercel Linux deployment and a live Docker image/healthcheck were not tested in this review.

## Remaining problems and release limits

There is no remaining observed frontend blocker for a protected review Preview. The following still block an operational production launch:

1. Unified login is an explicitly disabled interface; authentication, sessions, admin RBAC and a real CMS are absent. There is no secured admin implementation to certify. Preserve this interface when implementing real authentication later; do not add another login system.
2. Request forms and booking preferences have no submission backend. Submit Request honestly reports that nothing was sent. PDF preparation invokes browser Print/Save as PDF; it is not a backend-generated or submitted request. Career applications are also unavailable.
3. Supabase business persistence, R2 media/private documents, business Prisma models, server pagination/view-specific queries and their cache invalidation remain future implementation. Current public catalog content is static and filters client-side; this is not database pagination. Redis is not installed or required.
4. Product/portfolio imagery and product entries are still clearly labeled concepts pending real verified inventory/portfolio content. Four social profile URLs require the owner's final values; unavailable icons are intentional.
5. Actual Vercel project/team access, account integration, Linux build and signed-out Deployment Protection must be checked at the first approved Preview. Existing external project settings were not changed or certified by this local review. Docker standalone configuration is preserved, but a real Linux image build and healthcheck remain necessary before a VPS launch.

No business migration is required for this frontend release. The existing Prisma schema is only a technical health-check probe. Do not run migrations or populate Supabase/R2/auth placeholders to deploy this Preview.

## Proposed staging commit and push — instructions only

Proposed branch: `staging/vercel-preview`.

Proposed commit message:

```text
feat: prepare complete AIA website for protected Vercel preview
```

After explicit approval, and only if this file set is still current:

1. Recheck remote URL, HEAD, remote main SHA, index and working tree. If anything changed, review it before proceeding. Do not reset/discard the current work or overwrite an existing staging branch.
2. Create the proposed branch while keeping this working tree. Stage the exact reviewed literal paths, including intentional deletions. The following commands are proposed, not executed:

   ```powershell
   git switch -c staging/vercel-preview
   git --literal-pathspecs add --pathspec-from-file=docs/release-reviewed-paths.txt
   git diff --cached --name-status
   git diff --cached --stat
   git diff --cached --check
   ```

3. Compare staged names exactly with the manifest; review the staged source diff, binary asset list and a redacted secret scan. No real environment, credential, backup, raw log or generated build output may appear. The literal-path flag prevents bracketed locale route names being treated as wildcard pathspecs.
4. Commit only the reviewed index after approval. Confirm the new commit, branch and remote, then push only that branch after push approval:

   ```powershell
   git commit -m "feat: prepare complete AIA website for protected Vercel preview"
   git push --set-upstream origin staging/vercel-preview
   ```

5. Do not merge into main, force-push, change ownership or attach a production domain. Inspect any existing deployment integration before pushing; the reviewed [Vercel configuration](../vercel.json) disables automatic Git deployments for all branches, as supported by [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration).

## First protected Vercel Preview — instructions only

These account/network operations require separate deployment approval and have not been executed.

1. Identify the intended Vercel account/team and existing project, if any. Verify the repository is exactly `shafiqzx2/aia-home-solution-bd`. Avoid an import workflow that immediately starts a production deployment. Keep the production branch/main settings unchanged; `staging/vercel-preview` must not become the production branch.
2. Before deploying/sharing, enable **Vercel Authentication / Standard Protection** in project Settings → Deployment Protection. This is platform access control and is independent of the disabled application login. [Vercel documents protection scope and configuration](https://vercel.com/docs/deployment-protection).
3. Use the Next.js preset, repository-root Root Directory, Node **24.x**, and default Next output detection. Install: `corepack pnpm install --frozen-lockfile`; build: `corepack pnpm build`. Do not override output to a static export or use Docker standalone for Vercel.
4. Set the non-secret build flag **`ENABLE_EXPERIMENTAL_COREPACK=1`** for Preview so the versioned package-manager pin is used. This follows [Vercel's Corepack instructions](https://vercel.com/docs/builds/configure-a-build#corepack). Required platform-supplied names are **`VERCEL_ENV`** and **`NODE_ENV`**; let Vercel manage them. Optional: **`NEXT_TELEMETRY_DISABLED`**. Leave **`BUILD_STANDALONE`** unset on Vercel.
5. No database, Supabase, R2, Redis or authentication secret is required by this frontend Preview. Do not upload local environments, pull production secrets into this checkout or add fake database URLs. Do not add migration commands to install/build.
6. After the approved commit exists, deploy its clean checkout explicitly to **Preview**, for example `vercel deploy --target=preview` after linking the verified project. The CLI upload allowlist was separately reviewed/tested; it is not a substitute for Git credential hygiene. [Vercel supports an explicit deployment target](https://vercel.com/docs/cli/deploy#target). Never use `--prod`, `--temporary`, production promotion or a production alias for this review.
7. Confirm the deployment shows Preview, the expected commit SHA and no production domain assignment. Logs must show Node 24.x, pnpm 12.16.1, Prisma generation and a successful Linux build without database access.
8. Use a genuinely signed-out/private browser to verify unauthorized visitors receive Vercel access protection. For an authorized visitor, confirm whole-site noindex headers, EN/BN/themes, official logos/icons, category filtering, catalog/cart/request journeys, Back restoration, PDF preparation, legacy redirects and unknown-route behavior. Use synthetic details and verify the UI still makes no false submission/authentication claim.

The first live protected Preview can validate platform-specific behavior that a local review cannot. Production rollout and backend/CMS development remain separate work.
