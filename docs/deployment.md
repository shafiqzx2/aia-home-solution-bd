# Docker, PostgreSQL, and future hosting

The local foundation uses Next.js 16.4.4, Prisma 6.19.0, Node 24, pnpm 12.16.1, and standard PostgreSQL 16. No AWS resources, VPS, or paid service is needed. Hosting steps below are instructions for a future, separately authorized migration, not permission to deploy.

## Preserve the existing development database

The development database is already initialized. Keep the existing local environment files, PostgreSQL container, and named volume `aia-home-solution-bd-postgres-data`. Do not copy the example file over working credentials or run Compose `up` just to validate a configuration change; it may recreate a service whose configuration changed.

Compose requires a nonempty `POSTGRES_PASSWORD`; it has no password fallback. The current checkout keeps its database URL in `.env` and additional Compose settings in `.env.local`. Load both explicitly, with local settings last:

```sh
docker compose --env-file .env --env-file .env.local config --quiet
docker compose --env-file .env --env-file .env.local ps
pnpm db:check
pnpm exec prisma migrate status
```

These checks do not recreate the database. Do not print a rendered Compose configuration, container environment, or connection string: those outputs can contain credentials. The backup helper selects the existing environment files in this same order. Shell variables take precedence over env files.

The PostgreSQL service binds to `127.0.0.1` only, uses a readiness healthcheck, and stores data in the named Docker volume rather than the repository. Changing `POSTGRES_PASSWORD` in an environment file does not change a password inside an initialized database. Any future rotation requires a separate approved procedure; never reset or remove a volume to resolve a credential mismatch.

For a genuinely new checkout only, copy [.env.example](../.env.example) to `.env`, supply a unique password and matching server-only `DATABASE_URL`, then initialize a new database after confirming no existing service or volume will be replaced. The example's blank password and URL are deliberately nonfunctional. Keep database settings consistent if using `.env.local`: Next.js reads it automatically, while Prisma 6 commands and [db-check.mjs](../scripts/db-check.mjs) read `.env` and shell variables.

## Image design and local validation

The multi-stage [Dockerfile](../Dockerfile) uses Debian Bookworm slim and installs OpenSSL and CA certificates in the shared base before dependency installation or Prisma Client generation. Generation and runtime therefore use the same Linux/OpenSSL family. The builder generates Prisma Client and builds the Next.js standalone app with a frozen lockfile; it does not contact the database or run migrations.

The final image contains the traced standalone server, static files, and public assets. It runs as the unprivileged `node` user and starts with `node server.js`; pnpm and migration tooling are not required for app startup. Its HTTP healthcheck requests `/` and expects 200. The current pages do not query the database, so verify the generated Prisma engine separately before introducing database-backed routes or changing the base image or CPU architecture.

Run from the repository root; on Windows use `pnpm.cmd` if PowerShell blocks `pnpm`:

```sh
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm exec prisma validate
pnpm db:restore:check
pnpm build
docker build --check .
docker build --progress=plain -t aia-home-solution-bd:local .
```

These commands build locally, not on a hosting provider. Builds need registry/package access, and the current Google font imports may require outbound access. No database password or database connection is required in the build context. Do not supply runtime secrets through Docker build arguments. Real environment files, credentials, private keys, generated output, backup files, and local database directories are recursively excluded by [.dockerignore](../.dockerignore). Prisma migration SQL remains included. Do not mount the development database volume into an app-build or restore-test container.

The base tags receive updates. Rebuild regularly and pin reviewed image digests when introducing a release pipeline. If a local app-container smoke test is needed, use a fresh container name and loopback-only port binding; do not replace or remove existing containers without approval.

## Portable schema and backups

The initial [Prisma schema](../prisma/schema.prisma) contains only the technical health-check model. Business entities, admin import/export, and media handling remain deferred. Keep [versioned migrations](../prisma/migrations/) in Git.

Use `prisma migrate dev` only when intentionally authoring a new local migration. Review the generated SQL. Never accept a reset prompt against an existing database without separate approval. Future releases should apply reviewed migrations using `pnpm db:deploy` from a trusted checkout or a dedicated migration job with Prisma CLI and the migration files available. The lean app image does not include that release tooling. Do not run migrations automatically on every app startup.

See [database backup and restore](database.md) for custom-format `pg_dump` archives, `pg_restore`, manifests, and the tested isolated restore workflow. Restoration uses a separate container with no network, development volume, or development credentials. It does not modify the source database. Test containers are retained; stopping one discards its tmpfs data. Cleanup always needs separate approval.

Portable database archives do not include cluster roles, credentials, or external media. Future CSV/JSON admin workflows should remain application-level features. Store future media through an external S3-compatible interface rather than database blobs or app-container storage; no provider SDK is required in this phase.

## Credentials and future hosting migration

Keep current local credentials unchanged. For a new environment, generate a fresh random password of at least 32 bytes with a trusted password manager or cryptographic generator and store it directly in that environment's private secret settings. Do not put generated passwords in chat, terminal transcripts, source files, build logs, or shell history. Hex-encoded random bytes avoid URL-reserved characters; otherwise URL-encode the password component when constructing `DATABASE_URL`.

Keep the raw database password and the URL's encoded password consistent. Never prefix a database secret with `NEXT_PUBLIC_`: those variables are public browser values. Keep real env files, `.pgpass`, private keys, and backups outside Git. Backups are not encrypted by `pg_dump`; protect local copies and encrypt long-term or off-machine copies.

When hosting is authorized:

1. Choose standard PostgreSQL in the same private region/network as the app. Use the host's required TLS verification and a private reachable database hostname; `localhost` inside an app container refers to that container.
2. Create new hosting credentials, not copies of local credentials. Use a least-privilege app role and a separately controlled migration/owner role. The local image's `POSTGRES_USER` is a bootstrap administrator, not a recommended production app role.
3. Create a backup and test restoration in isolation. Restore into a separate, explicitly reviewed target; never overwrite the local source. Provision roles and grants separately and retain an approved rollback/backup plan.
4. Apply reviewed migrations, verify application connectivity, and plan pooling and connection limits before adding app replicas.
5. Configure off-machine encrypted backups and periodic restoration tests. Coordinate future media migration separately.

For Dokploy, create an application using Dockerfile build type, repository-root context, and final target `runner` only after deployment approval. Set runtime secrets through private environment settings. Route HTTPS through the reverse proxy to port 3000; keep the image defaults `NODE_ENV=production`, `PORT=3000`, and `HOSTNAME=0.0.0.0`. Do not publicly publish PostgreSQL or run the local-development Compose file unchanged on a VPS. Apply the same principles with another orchestrator; no Dokploy- or AWS-specific dependency is built into the application.

For Bangladesh users, benchmark nearby hosting locations and CDN coverage before choosing a region. Measure TTFB, LCP, and p95 latency; this image alone does not guarantee latency. Multiple app replicas also need a review of shared Next.js cache behavior and deployment consistency.
