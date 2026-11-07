# Local database backup and restore

Architecture update (2026-11-07): production durable business data now targets **Supabase PostgreSQL**, with media binaries in **Cloudflare R2**. Follow the [storage and fetching plan](./data-store-logic.md) for the proposed migration, pooling, schema/security, pagination, caching, and recovery work. The procedures below remain the existing **local Compose PostgreSQL** backup workflow. The backup helper does not follow a remote `DATABASE_URL`; it is not a Supabase backup tool. Add and test a separate Supabase backup/restore procedure and R2 object recovery policy before cutover. No migration has been performed by this documentation update.

Use the existing PostgreSQL Compose service and Prisma migrations. No hosting account, cloud SDK, or provider-specific format is involved. Run these commands from the project root with Node 24, pnpm, and the existing Docker engine running. On Windows, use `pnpm.cmd` if PowerShell blocks `pnpm`.

## Environment and routine verification

Preserve existing local environment files and credentials. For a new checkout only, copy [.env.example](../.env.example) to `.env` and supply a unique password and matching database URL; its blank values are deliberately nonfunctional. Compose requires `POSTGRES_PASSWORD` with no fallback. The current checkout stores that value in `.env.local`, so load `.env` followed by `.env.local` explicitly. Next.js reads `.env.local` automatically, but Prisma 6 commands read `.env` and shell variables. Keep shared database settings consistent. Existing PostgreSQL volume credentials do not change when environment files change. Do not reinitialize the volume to fix a credential mismatch.

```sh
docker compose --env-file .env --env-file .env.local config --quiet
docker compose --env-file .env --env-file .env.local ps
pnpm db:generate
pnpm db:check
pnpm exec prisma migrate status
pnpm exec prisma validate
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

[db-check.mjs](../scripts/db-check.mjs) checks the configured Prisma connection, generated model query, and applied migrations in a read-only transaction. It loads `.env` without printing connection strings. Prisma commands do not automatically load `.env.local`.

For a new checkout with no `.env.local`, omit its `--env-file` option. Do not print a resolved Compose configuration or container environment because it may expose passwords. Validation does not need Compose `up`, service recreation, or password changes. See [credential management and hosting](deployment.md#credentials-and-future-hosting-migration) before creating credentials for a new environment.

## Create and verify a backup

```sh
pnpm db:backup
pnpm db:restore:test backups/<printed-backup-name>.dump
```

[db-backup.mjs](../scripts/db-backup.mjs) runs the existing container's PostgreSQL tools through `docker compose exec -T`, explicitly loading whichever of `.env` and `.env.local` exist, in that order. No host PostgreSQL install is needed. Credentials come from the running container environment, not command-line passwords. The script connects to that local container over its Unix socket; it never follows a remote `DATABASE_URL`.

The backup is a compressed custom-format `pg_dump` archive containing schema, rows, sequences, and Prisma migration history. Each run uses a timestamp and UUID, opens files exclusively to avoid overwriting, and writes a JSON sidecar with a SHA-256 digest and verification snapshot. Binary streams bypass shell text redirection, including on Windows. Treat any archive without its completed JSON sidecar as unverified.

### Isolated restore test (approval required before execution)

[db-restore-test.mjs](../scripts/db-restore-test.mjs) is separate from the backup command. It never calls Compose, loads environment files, uses development credentials, or connects to the main database. The old restore path in the backup script has been removed. [db-postgres.mjs](../scripts/db-postgres.mjs) shares binary-safe process handling and read-only snapshot queries, not database connection settings.

Before creating anything, the helper reads one regular archive of at most 256 MiB into memory, checks its `PGDMP` header, SHA-256 digest, and manifest structure, and resolves the already-installed `postgres:16-alpine` image to its immutable local image ID. It does not pull an image. Keeping the verified bytes in memory avoids reopening a different file for restoration.

Each approved execution creates an `aia-restore-test-<uuid>` container and an `aia_restore_test_<uuid>` database. Containers and databases are never reused. The container has:

- `--network none`, no published ports, and PostgreSQL TCP listening disabled.
- No bind mounts, shared volumes, Docker socket, or development-network attachment.
- A read-only root filesystem and only bounded tmpfs storage for database files, sockets, and temporary files. No persistent volume is created.
- The non-root `postgres` operating-system user, all Linux capabilities dropped, `no-new-privileges`, and CPU, memory, and process limits.

Docker inspection checks the exact newly created container ID, UUID label, name, pinned image, mounts, network, and security settings before startup, setup SQL, and restoration. The archive is fully parsed into `/dev/null` inside the isolated container before the test role or database is created; this does not execute archive SQL or connect to a database. PostgreSQL setup waits for the final server process rather than the image's temporary initialization server.

A fresh random bootstrap password is used only to initialize the separate cluster and grant permissions. The archive connection authenticates directly as `aia_restore`, with its own independently generated password, not as an administrator using `SET ROLE`. That role has no superuser, database creation, role creation, inheritance, replication, bypass-RLS privileges, or role memberships. It receives only `CONNECT` to the new database and `USAGE, CREATE` in its public schema; it owns only the objects it restores. The helper validates the actual database, role privileges, schema access, and empty public schema before executing `pg_restore --single-transaction --exit-on-error --no-owner --no-acl --no-tablespaces`. No caller-supplied database/container target, `--clean`, or `--create` option is accepted.

Verification compares every public table's row count and order-independent row checksum, column definitions, and sequence values with the backup snapshot, including `_prisma_migrations`. The restore helper deliberately does not query the development database, even for before/after comparisons. Pause application writes while creating a backup so its verification snapshots agree; the isolated restore does not require access to the source afterward.

The container name, ID, and database name are printed and retained on success or failure. There is no automatic stop, deletion, volume removal, or cleanup command. Stopping the container discards its tmpfs database data, so it is useful for inspection only while running. Any later cleanup requires separate approval identifying that exact test container. These tools target the small initial public-schema database; large archives, additional schemas, extensions, and large business datasets need a reviewed update rather than extra privileges granted to the restore role.

### Safety checks without a real restore

```sh
pnpm db:restore:check
```

[db-restore-test.test.mjs](../scripts/db-restore-test.test.mjs) checks target generation, container/role rejection, archive checks, and orchestration using a mocked Docker runner. It does not start containers, connect to a database, or run `pg_restore`. Passing these checks is not a substitute for a separately approved live restore test.

## Keep private data local

The entire `backups/` directory, dump files, local environment files, and possible host database directories are excluded from Git and Docker build contexts. Prisma migration SQL is explicitly allowed so schema history remains versionable. The named Docker volume lives outside the repository and build context. Never store backups under `public/` or add them to Git, even under another filename. Store any longer-term copy in a private location outside this checkout. Backups contain database data and are not encrypted by `pg_dump`.

## Native PostgreSQL portability

The `.dump` file is an ordinary PostgreSQL custom archive; Docker and the JSON sidecar are not required to restore it with native tools. Use PostgreSQL 16 clients for this server, or compatible newer tools when migrating to a newer server. An older server is not a supported downgrade target. Provision a separate new target database and role when hosting migration is authorized. Roles, passwords, grants, and external media files are not included in this application-database archive.

With `PGHOST`, `PGPORT`, `PGUSER`, and a private `PGPASSFILE` set for the intended server, these standard commands work without a Prisma URL (whose `?schema=public` parameter is not a libpq parameter):

```sh
pg_dump --format=custom --no-owner --no-acl --dbname=aia --file=/private/path/aia.dump
pg_restore --list /private/path/aia.dump
createdb --maintenance-db=postgres --template=template0 aia_restore_review_001
pg_restore --single-transaction --exit-on-error --no-owner --no-acl --dbname=aia_restore_review_001 /private/path/aia.dump
```

`createdb` must succeed first; stop if the name already exists or any command fails. Never substitute the main development database as the restore target. Review the target connection before any future hosting restore, use the host's required TLS settings, and apply reviewed Prisma migrations separately rather than on every application start. Restore only trusted archives.

Future CSV/JSON admin workflows and S3-compatible external media storage remain separate concerns; neither is implemented in this phase.

References: PostgreSQL 16 [pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html) and [pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html); Docker [none networking](https://docs.docker.com/engine/network/drivers/none/) and [tmpfs mounts](https://docs.docker.com/engine/storage/tmpfs/).
