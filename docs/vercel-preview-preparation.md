# Safe Vercel Preview preparation

Completed on 2026-11-08 after the [readiness audit](./predeployment-readiness-audit.md). Scope: a protected frontend Preview, not a CMS release or production launch. No branch, staging operation, commit, push, migration, or deployment is performed by this preparation.

## Implemented fixes

| File | Change |
| --- | --- |
| [Git exclusions](../.gitignore) | Exclude the local R2 credential file, provider credential exports/directories, authentication files and private SSH key names. Existing environment, backup, private-key and generated-output exclusions remain. The blank example environment and versioned Prisma migration SQL remain eligible for Git. |
| [Docker exclusions](../.dockerignore) | Exclude the same credential classes recursively, including under application folders. Local environment files, backups and generated output stay outside the image build context. |
| [Vercel exclusions](../.vercelignore) | Default-deny CLI uploads; allow only app/components/lib/public/Prisma and explicit build/configuration inputs. Reapply sensitive-file exclusions inside allowed directories. Documentation, backup scripts, local environments and build artifacts are not CLI upload inputs. Git-based builds still require a clean, explicitly reviewed commit; ignore files do not remove previously tracked files. |
| [Package settings](../package.json) | Pin Node 24.x and pnpm 12.16.1; generate Prisma Client before every production build. Dependency versions and the lockfile are preserved. Generation does not run migrations or connect to PostgreSQL. |
| [Next configuration](../next.config.ts) | Use native output by default; standalone output is an explicit Docker build option. Preview builds add whole-site `X-Robots-Tag: noindex, nofollow, noarchive`. Existing cache/prefetch/design configuration remains. |
| [Dockerfile](../Dockerfile) | Opt the builder into standalone output; use the shared build/generation script without duplicate generation. Healthcheck requests `/en` and expects 200 instead of failing on the root locale redirect. Non-root runtime/static-asset handling remain. |
| [Vercel configuration](../vercel.json) | Native Next preset, Corepack-pinned frozen install/build, and automatic Git deployments disabled. No output-directory override or migration command. |
| [Request copy](../lib/request-copy.ts), [blueprint](./product-blueprint.md) | Explain in English/Bengali that unsent drafts may return with browser Back and reload starts a fresh draft. Existing in-memory behavior is preserved so navigating away does not unexpectedly discard customer work. No new customer persistence was added. |
| [README](../README.md), [deployment guide](./deployment.md), [audit follow-up](./predeployment-readiness-audit.md), this preparation record and [staging manifest](./vercel-preview-staging-manifest.md) | Document the implemented fixes, exact candidate paths, safe workflow, verification results and remaining external checks. |

The unified login, authentication preview status, products, cart, request controls, homepage, global design and Prisma schema/migrations were not changed. Authentication, business storage, R2 media delivery and CMS features remain future work.

## Runtime compatibility and build behavior

The installed metadata reports Next.js 16.4.4 requires Node >=20.9.0, Prisma and Prisma Client 6.19.0 require Node >=18.18, and pnpm 12.16.1 requires Node >=18. Node 24.13.0 was used for verification; Node 24.x is the shared supported major pinned for Vercel and Docker. Corepack 0.34.5 resolved pnpm 12.16.1 successfully.

The normal build is `prisma generate && next build`. It requires installed build dependencies, including Prisma CLI, but does not require a running database or an applied business migration. Do not set a fake database URL to make this frontend build pass.

Native local/Vercel builds do not request standalone output. This avoids Next.js's automatic copy of loaded local environment files into standalone artifacts. Docker opts in through its builder-only `BUILD_STANDALONE` setting and receives a context without local environment/credential files. Do not enable that flag for Vercel or share old local build folders. The existing Docker runner remains the standalone `server.js` entrypoint.

The noindex rule is selected at build time using Vercel's deployment environment. A later production launch needs a fresh, separately approved Production build; do not promote this noindex Preview build to production.

## Credential protection and rotation assessment

- The local R2 credential file and real local environment files are ignored and were not staged, copied into the verification context, relocated, deleted or modified.
- Reviewed tracked-file names and local Git history showed no real environment file or R2 credential file tracked. The example environment contains placeholders. No known credential-value match was found in the approved upload inputs during the limited scan.
- The earlier audit found a generated local standalone environment file. Build folders are ignored and excluded from Docker/Vercel uploads; the new native default avoids creating another standalone environment copy. Local build output is not a deployment source archive.
- There is no confirmed Git/public exposure in the checks performed. If an older image, standalone bundle, archive, terminal transcript or manual upload containing real credentials was shared outside the machine, treat its credentials as potentially exposed and rotate them in the relevant provider after owner approval. Provider access logs and external upload history were not inspected, so this preparation cannot certify those channels. No rotation was performed.
- Ignore rules protect normal staging/packaging, not deliberate force-adds, secrets hidden under arbitrary innocuous filenames, or an already-compromised account. Review the exact staged diff/upload manifest before any external action; do not use indiscriminate staging.

## Proposed staging workflow

The proposed branch is `staging/vercel-preview`; it has not been created. The exact current candidate paths are listed in the [staging manifest](./vercel-preview-staging-manifest.md), including pre-existing design work and the intended old root-route deletions.

After review and approval:

1. Create that branch from the current checkout without resetting/discarding the uncommitted work. Recheck remote main first if time has passed; do not overwrite local changes to update it.
2. Review the candidate manifest against current Git status. Stage only explicitly reviewed paths, including the intended deletions. Check the entire staged diff and tracked-file/secret scan before approving the commit. Leave secrets, environments, backups, node_modules and generated output out. Commit/push require explicit approval and have not happened.
3. Link/configure the intended Vercel project only after approval. Keep automatic Git deployments disabled for this first release. A default project import can initiate a deployment; do not assume importing a repository is Preview-only. Existing remote Vercel settings and aliases must be inspected before connecting anything.
4. Use the repository root as Root Directory, the Next.js preset, Node 24.x and the versioned install/build commands. Keep default output-directory detection. Set the non-secret `ENABLE_EXPERIMENTAL_COREPACK=1` build flag in Vercel's Preview settings. Verify the logs show pnpm 12.16.1 and Prisma generation. Do not upload local environment files or set migration credentials on a frontend-only Preview.
5. In Vercel project Settings → Deployment Protection, enable Standard Protection with Vercel Authentication for Preview URLs before sharing the deployment. Verify access from a signed-out browser; protected access is a platform setting, not something the disabled application login supplies. This setting has not been changed by this patch. [Vercel protection guidance](https://vercel.com/docs/deployment-protection).
6. Following separate deployment approval, explicitly target Preview, for example `vercel deploy --target=preview`. Do not use a production flag, a temporary production deployment, or a production domain/alias. CLI uploads use the reviewed exclusions; Git uploads use the reviewed commit. [Deployment targets](https://vercel.com/docs/cli/deploy).
7. Check the actual deployment environment/domain, denied signed-out access, whole-site noindex header, EN/BN pages, legacy-login redirects, 404 behavior, images/fonts, cart, request validation/copy, print isolation and logs. Use synthetic form details. Keep login and real submission disabled.

The repository configuration disables automatic Git deployments, but it does not create or change any Vercel account/project settings. No production launch or merge is authorized by this document.

## Environment names for this frontend Preview

| Name | Purpose |
| --- | --- |
| `ENABLE_EXPERIMENTAL_COREPACK` | Enable the platform's pinned package-manager support. |
| `VERCEL_ENV` | Platform-supplied deployment scope used for Preview noindex; do not copy a local value into an environment file. |
| `NODE_ENV` | Platform-managed build/runtime mode. |
| `NEXT_TELEMETRY_DISABLED` | Optional telemetry preference. |
| `BUILD_STANDALONE` | Docker builder option only; leave unset for Vercel. |

No database, Supabase API, R2, Redis or authentication secret is needed by the current frontend-only build. Runtime database/media/auth variables must be introduced with their actual implementation later; they are not placeholders to populate now. Do not copy local Compose database bootstrap variables into Vercel.

## Verification and remaining limits

The original audit remains a historical snapshot; preparation results here supersede only its addressed findings.

| Check | Result |
| --- | --- |
| `pnpm.cmd lint` | Passed. |
| `pnpm.cmd exec tsc --noEmit --incremental false` | Passed. |
| `pnpm.cmd build` | Passed, including explicit Prisma Client generation and all 66 pages. No standalone directory was produced by the normal build. |
| `git diff --check` | Passed. |
| Clean dependency install | Frozen-lockfile install with pnpm 12.16.1 passed in a separate verification directory; the existing project lockfile remained unchanged. |
| No-database build | Built the 78 reviewed CLI upload inputs in isolation with zero copied environment files and database/PostgreSQL variables removed from the child environment. Prisma generation and all 66 pages passed with no local PostgreSQL service. No database URL placeholder was needed. |
| Corepack/version check | Corepack selected pnpm 12.16.1; installed engine metadata and the tested Node 24.13.0 satisfy the pinned major. |
| Exclusions | 25 sensitive-path fixtures passed Git, Docker-pattern and Vercel matching checks; 14 required build/source fixtures remained included. Docker pattern fixtures use a Git-style matching check plus manual pattern review, not a live Docker context inspection. |
| Upload manifest and known-secret scan | All 78 upload paths remained identical after final exclusions; no known secret-value matches were found in eligible source files. No real environment or credential file was copied. This was a limited value/pattern scan, not a guarantee about arbitrary unknown secrets. |
| Preview runtime | A temporary local native production server returned the noindex/nofollow/noarchive header on `/`, `/en`, `/bn`, login and legacy-login redirects. `/en` returned 200 and `/` returned 307, confirming the new healthcheck path. The temporary server was stopped after verification. |
| Draft behavior | EN/BN notice matches actual behavior: Back restored the synthetic unsent draft, reload cleared it, and no synthetic customer marker entered localStorage/sessionStorage. |
| Preserved files | Fingerprints confirmed real environment files, the R2 credential file, unified login component, global design styles, Prisma schema/migration and package lockfile were unchanged. |
| Git state | Remains on `main`; no staged changes, new branch, commit or push. Exact candidate paths are recorded separately, not staged automatically. |

Remaining external checks: the actual Vercel Linux build/runtime, signed-out Deployment Protection and deployed noindex must be verified on the first approved Preview. Docker engine validation was attempted but the local Linux engine was unavailable; no engine/container/database was started. Before a VPS release, run a real Linux image build and healthcheck. No migrations, database resets, secret changes, commits, pushes or deployments are included in this work.
