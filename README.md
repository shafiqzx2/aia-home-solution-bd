This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Deployment preparation

See [Docker and Dokploy deployment](docs/deployment.md) for image design, environment variables, local Docker checks, Bangladesh latency considerations and future PostgreSQL integration.

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
