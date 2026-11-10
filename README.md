This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Business platform Phase A.1

The current delivery is the [Phase A.1 report](docs/phase-a1-report.md), with a [screenshot and actual PDF gallery](docs/phase-a1-review/index.html), [sales schema/ER extension](docs/phase-a1-schema-erd.md), and [migration review packet](docs/phase-a1-migration-review.md). It includes the premium workspace redesign, 56 navigation entries with honest implementation states, local Product Management, permission/staff simulation, custom Sales Memo Studio and quotation conversion.

Run `pnpm.cmd test` for all 31 unit/mock safety tests. `pnpm.cmd review:phase-a1-schema` validates and regenerates the separate proposal offline. `pnpm.cmd demo:plan` prints fixture counts without connecting to a database; its CLI cannot apply seeds. After building and starting a local production server on port 3002 alongside development on port 3000, `pnpm.cmd review:phase-a1-browser` refreshes the functional/browser/PDF evidence with locally installed Edge. `node scripts/phase-a1-evidence.mjs` rebuilds the gallery only after that evidence passes.

All business tools remain development-only, in-memory drafts or explicit simulations. No business database persistence, secure Root provisioning, production staff permissions, real financial issue, payment collection, R2 storage or email dispatch is connected. The Phase A.1 report lists the exact Phase B approvals and remaining work.

### Historical Phase A foundation

The original [Phase A delivery report](docs/phase-a-report.md) links the [architecture](docs/phase-a-architecture.md), [proposed schema/ER diagram](docs/phase-a-schema-erd.md), [migration approval packet](docs/phase-a-migration-review.md), and [historical screenshot/PDF evidence](docs/phase-a-review/README.md).

With the development server running, open `/en/admin-preview` for the local workspace, quotation editor, letter and email draft tools. Drafts stay in the current tab and can be exported; database persistence, real authentication, approvals, official issuance, R2 storage and mail delivery are not connected. The local review route is unavailable in a production build; administrative routes/APIs fail closed. Existing public flows remain in place.

`pnpm test:phase-a` runs domain safety tests. `pnpm review:phase-a-schema` validates and generates the separate proposal offline; it does not connect to or migrate a database. Do not apply business migrations without the explicit target/SQL/backup approval described in the packet. No commit, push or deployment is implied by this local work.

## Deployment preparation

See [Docker and Dokploy deployment](docs/deployment.md) for image design, environment variables, local Docker checks, Bangladesh latency considerations and future PostgreSQL integration.

The proposed backend now targets **Supabase PostgreSQL for durable data and Cloudflare R2 for images/documents**. See the [storage and fetching plan](docs/data-store-logic.md) for repository findings, view-specific reads, pagination, caching now/Redis later, media delivery, and implementation phases. The local database instructions below describe the existing development setup; the Supabase/R2 migration is not implemented yet.

For the first protected frontend deployment, follow [safe Vercel Preview preparation](docs/vercel-preview-preparation.md) and its exact staging manifest. Normal builds generate Prisma Client automatically and use native Next output; Docker explicitly opts into standalone output. Automatic Git deployments remain disabled until a reviewed release workflow is approved.

The latest complete website and its review status are documented in the [final release readiness review](docs/final-release-readiness.md). Use the refreshed [reviewed staging manifest](docs/vercel-preview-staging-manifest.md) for the current file set; earlier audit counts describe historical snapshots.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local PostgreSQL and Prisma

Phase 1 uses a portable PostgreSQL 16 Docker service. For a new checkout only, copy [.env.example](.env.example) to `.env` and supply a unique password and matching database URL; the blank example values cannot initialize a database. Keep existing local environment files and credentials unchanged.

```bash
docker compose --env-file .env --env-file .env.local config --quiet
pnpm db:generate
pnpm db:check
pnpm exec prisma migrate status
```

The current checkout needs both environment files because its Compose password is in `.env.local`. For a new checkout using only `.env`, omit the second `--env-file` option. Do not run Compose `up` merely to validate these changes; it can recreate an existing service. See [deployment preparation](docs/deployment.md) before initializing a new database or planning hosting.

The database is bound to `127.0.0.1` only and persists in the named volume `aia-home-solution-bd-postgres-data`. Do not remove that volume unless its data is intentionally backed up and deletion is approved.

Back up and test restoration without touching the development database:

```bash
pnpm db:backup
pnpm db:restore:test backups/<printed-backup-name>.dump
```

Use `pnpm.cmd` on Windows if PowerShell blocks `pnpm`. Run the restore test only after approval: it creates a separate, uniquely named PostgreSQL container with no network, host mounts, or persistent volume. The archive is restored as a restricted test-only role, never through the development database service. The test container is retained for inspection; stopping it discards its temporary data. `pnpm db:restore:check` runs mock-only safety checks without Docker. See [database backups and restoration](docs/database.md) for details. The ignored [backups/](backups/) directory and local secrets are excluded from Git and Docker; versioned Prisma migration SQL is not excluded. Future media should use S3-compatible external storage, and future admin import/export should use application-level CSV/JSON workflows.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
