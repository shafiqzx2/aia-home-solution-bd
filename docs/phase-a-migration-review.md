# Phase A database proposal — execution approval required

**Nothing here has been applied.** The executable migration directory and active schema remain unchanged. Review the [proposed Prisma schema](../prisma/proposals/phase-a.prisma), [generated SQL](../prisma/proposals/phase-a.sql), [extra invariants](../prisma/proposals/invariants.sql), [ER diagram](./phase-a-schema-erd.md) and [architecture](./phase-a-architecture.md) first.

## Exact proposal and affected data

The offline diff compares the active health-check-only schema to the proposed full domain schema. It proposes 58 new tables, typed enums, indexes, foreign keys, financial/ownership checks, immutable document/audit triggers, a transactional numbering helper, and RLS/revokes for the new tables. It has no DROP/TRUNCATE, existing-table alteration, seed/customer insert, or health-check migration changes. It is NOT registered under the deployable migrations directory. The proposed schema has a separate generator output; normal `pnpm build` still generates the original client.

Run `pnpm review:phase-a-schema` to validate and regenerate the review artifacts offline. This helper overrides its child process URLs with a non-listening local review address, uses schema-to-schema `migrate diff`, and never opens a DB connection. The placeholder URL is only for offline Prisma parsing; it is not written to the application environment or used by runtime builds. `pnpm db:migrate`/`pnpm db:deploy` do NOT execute this proposal automatically.

This is a full logical proposal for the requested system, not permission to apply all 58 tables in the first operational release. Prefer an initial reviewed identity/CRM/request slice, then a quotation/document slice. Reconcile the selected maintained authentication adapter and migration roles before turning either slice into an executable migration. Regenerate SQL from the approved slice and review its exact diff before execution.

## Pre-execution evidence and approval packet

1. Identify target organization/project/environment and database; explicitly distinguish Development, Staging and Production. Keep runtime and migration connections separate. Required connection names are `DATABASE_URL` and `DIRECT_URL`; never include their values in the review packet.
2. Read the target schema and Prisma migration history with authorized read-only access. This local audit does not certify live Supabase contents. Reconcile existing tables, extensions, policies/default grants, pg roles, ownership, PostgreSQL version, and pooling/TLS requirements. Stop on drift.
3. Finalize provider adapter fields, publication/content migration scope, permissions, numbering format/period, currency/tax policy and data retention. Current public static content has no durable product/customer identifiers yet.
4. Split the approved migration scope and generate exact SQL. Show model/SQL diff, new constraints/indexes/triggers, target grants and affected data. No actual customer data is backfilled by the current proposal. Future backfills must show record mapping, expected counts and conflict handling separately.
5. Create a target-appropriate backup of schema/data/migration history and verify checksum/completion. The existing local Compose backup helper does not back up Supabase. Use the provider's tested backup/export procedure for Supabase, confirm retention/PITR availability under the actual plan, and separately inventory/backup relevant R2 objects. Secrets and backup files stay outside public/Git/deployment inputs.
6. Restore that backup into a NEW isolated staging database and verify tables/counts/checksums and application reads. This creates external resources and needs explicit approval; it has not been performed. Do not overwrite the existing database or delete volumes.
7. On the isolated staging target, apply only the reviewed SQL with the intended migration role. Exercise transactional request creation/rollback, concurrent claims, stale reviews, quote numbering races, optimistic locking, issued-version immutability, private portal grants, RLS/Data API denial, and generated-asset retention. Verify no customer can read another customer's records. Pure unit tests and Prisma validation do not replace these tests.
8. Present results, exact remaining SQL, target, backup timestamp/identifier, maintenance window, rollback triggers and responsible operator. Obtain explicit approval to run that migration on that named environment. No approval is inferred from accepting the architecture or viewing the preview.

## Risks and recovery

| Risk | Required mitigation before execution |
| --- | --- |
| Wrong target or schema drift | Explicit target identity and migration-history comparison; no automatic reset or force reconciliation. |
| Provider adapter incompatibility | Pin and test the selected auth library/Prisma adapter; reconcile logical User/Session records first. |
| Supabase API/default grants | Review actual role privileges and ownership; new RLS without policies denies ordinary clients, while owner/bypass roles need explicit assessment. |
| SQL trigger and constraint correctness | Run the generated SQL and concurrency tests on an approved isolated PostgreSQL instance. The review SQL is not yet execution-tested. |
| Lost or reassigned guest identity | Verify both contact and private request evidence, row locking, manual conflict review and audited grants. |
| Financial/document corruption | Canonical approved snapshots, versioned calculation policy, immutable versions/files, line/header recomputation at issue and tested restore. |
| Long migrations/locks | Measure the approved slice in staging, bound lock/statement timeouts, verify connection routing; never run on a transaction-pool endpoint by assumption. |
| External side effects | Transactional outbox with stable idempotency, explicit sender review; no automatic send during migration or seeding. |
| Object storage outside SQL transaction | Immutable keys, state machine, checksums and retriable compensation; retain referenced historical files. |

If a migration transaction fails before commit, PostgreSQL should roll back its transaction; verify status/schema before retrying. The review SQL is wrapped in a transaction, but real Prisma migration behavior and lock/timeout handling must be tested. Do not invent a successful rollback from a failed CLI exit.

If schema is committed but no business writes occurred, redeploy the previously known good application while preserving additive tables; prefer a forward correction to dropping objects. If business writes occurred, pause affected writers, preserve evidence and backups, repair forward or restore to a separate recovery target, reconcile rows/object keys, then perform an explicitly approved cutover. Never issue automatic destructive down migrations or restore over live data. Historical financial approvals and emails cannot be undone by a schema rollback.

## Exact approvals still required

- Approval of the selected authentication/session provider and the minimal first migration scope.
- Explicit permission to create/restore/use a named isolated staging database and run staging integration tests.
- Explicit permission to apply the final reviewed migration to a named target, with a verified backup and recovery plan.
- Later, separate permission for real provider credentials/DNS changes, R2 operations, sending reviewed external emails, and deployments.
- Separate approval before any Git commit/push. No merge to main, Production promotion, database reset, volume deletion or Vercel protection change is requested or performed by Phase A.

Recommended next implementation: reconcile the auth adapter and implement the smallest identity + guest-request repository slice in local code. Prepare its precise staging migration/test packet; apply it only after the owner approves the named target and execution.
