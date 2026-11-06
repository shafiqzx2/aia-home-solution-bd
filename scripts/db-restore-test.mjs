import { createHash, randomBytes, randomUUID } from "node:crypto";
import { open, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import { docker, snapshot } from "./db-postgres.mjs";

const label = "bd.aia.restore-test";
const role = "aia_restore";
const admin = "aia_test_bootstrap";
const tmpfs = {
  "/var/lib/postgresql/data": "rw,nosuid,nodev,size=512m,mode=1777",
  "/var/run/postgresql": "rw,nosuid,nodev,size=16m,mode=1777",
  "/tmp": "rw,nosuid,nodev,size=64m,mode=1777",
};

export function validateArchive(bytes, manifest) {
  if (bytes.subarray(0, 5).toString() !== "PGDMP" || bytes.length < 32 ||
      manifest?.format !== 1 || !/^[a-f0-9]{64}$/.test(manifest.sha256 ?? "") ||
      createHash("sha256").update(bytes).digest("hex") !== manifest.sha256 ||
      !manifest.snapshot?.rows || !Array.isArray(manifest.snapshot.columns) ||
      !manifest.snapshot.sequenceValues) {
    throw new Error("Invalid custom archive, checksum, or manifest; no container created.");
  }
}

export function createPlan(image) {
  if (!/^sha256:[a-f0-9]{64}$/.test(image)) throw new Error("Expected a local PostgreSQL image ID.");
  const token = randomUUID().replaceAll("-", "");
  return { image, token, name: `aia-restore-test-${token}`, database: `aia_restore_test_${token}` };
}

export function createArgs(plan) {
  return ["create", "--pull=never", "--name", plan.name, "--label", `${label}=${plan.token}`,
    "--network", "none", "--read-only", "--user", "postgres", "--cap-drop", "ALL",
    "--security-opt", "no-new-privileges:true", "--restart", "no", "--no-healthcheck",
    "--memory", "1g", "--cpus", "1", "--pids-limit", "128",
    ...Object.entries(tmpfs).flatMap(([target, options]) => ["--tmpfs", `${target}:${options}`]),
    "--env", `POSTGRES_USER=${admin}`, "--env", "POSTGRES_DB=postgres",
    "--env", "POSTGRES_PASSWORD", "--env", "PGDATA=/var/lib/postgresql/data/pgdata",
    "--env", "POSTGRES_INITDB_ARGS=--auth-local=scram-sha-256 --auth-host=scram-sha-256",
    plan.image, "postgres", "-c", "listen_addresses=", "-c", "unix_socket_directories=/var/run/postgresql"];
}

export function assertIsolation(info, plan, id) {
  const host = info.HostConfig;
  if (!/^[a-f0-9]{64}$/.test(id) || info.Id !== id || info.Name !== `/${plan.name}` ||
      info.Image !== plan.image || info.Config?.Labels?.[label] !== plan.token ||
      info.Config.User !== "postgres" || host?.NetworkMode !== "none" ||
      Object.keys(info.NetworkSettings?.Networks ?? {}).some((network) => network !== "none") ||
      !host.ReadonlyRootfs || host.Privileged || host.PublishAllPorts ||
      Object.keys(host.PortBindings ?? {}).length || (host.Binds ?? []).length ||
      (host.VolumesFrom ?? []).length || (host.Devices ?? []).length ||
      (host.DeviceRequests ?? []).length || host.PidMode === "host" || host.IpcMode === "host" ||
      !host.CapDrop?.includes("ALL") || !host.SecurityOpt?.some((option) => /^no-new-privileges(?::true)?$/.test(option)) ||
      Object.keys(host.Tmpfs ?? {}).length !== Object.keys(tmpfs).length ||
      Object.entries(tmpfs).some(([target, options]) => host.Tmpfs?.[target] !== options) ||
      (info.Mounts ?? []).some((mount) => mount.Type !== "tmpfs" || !Object.hasOwn(tmpfs, mount.Destination))) {
    throw new Error("Container identity or isolation validation failed; refusing setup/restore.");
  }
}

export function assertRestoreRole(identity, database) {
  if (identity.database !== database || identity.user !== role || identity.superuser !== false ||
      identity.createDb !== false || identity.createRole !== false || identity.replication !== false ||
      identity.bypassRls !== false || identity.inherit !== false || identity.memberships !== 0 ||
      identity.databaseCreate !== false || identity.schemaCreate !== true || identity.schemaUsage !== true ||
      identity.objects !== 0) {
    throw new Error("Restore identity, privileges, or empty target validation failed.");
  }
}

export async function restoreIsolated(bytes, manifest, { run = docker, delay = setTimeout, log = console.log } = {}) {
  validateArchive(bytes, manifest);
  const plan = createPlan(await run(["image", "inspect", "postgres:16-alpine", "--format", "{{.Id}}"]));
  const adminPassword = randomBytes(32).toString("hex");
  const restorePassword = randomBytes(32).toString("hex");
  const id = await run(createArgs(plan), { env: { POSTGRES_PASSWORD: adminPassword } });
  log(`Isolated test container: ${plan.name}\nTemporary database: ${plan.database}\nContainer ID: ${id}`);
  log("Retained on success or failure; stopping it discards its tmpfs data. No automatic cleanup.");
  const inspect = async () => {
    const [info] = JSON.parse(await run(["inspect", id]));
    assertIsolation(info, plan, id);
  };
  await inspect();
  await run(["start", id]);
  await inspect();

  const psql = (user, database, password, sql) => run([
    "exec", "-i", "--user", "postgres", "--env", "PGPASSWORD", id,
    "psql", "-X", "-q", "-A", "-t", "--no-password", "--set=ON_ERROR_STOP=1",
    "--host=/var/run/postgresql", `--username=${user}`, `--dbname=${database}`,
  ], { env: { PGPASSWORD: password }, input: sql });
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      await run(["exec", "--user", "postgres", id, "sh", "-c", 'test "$(cat /proc/1/comm)" = postgres']);
      await psql(admin, "postgres", adminPassword, "SELECT 1;");
      ready = true;
      break;
    } catch {
      await delay(1000);
    }
  }
  if (!ready) throw new Error("Isolated PostgreSQL did not become ready; container retained.");

  // Validate the whole archive without executing its SQL or connecting to a database.
  await run(["exec", "-i", "--user", "postgres", id,
    "pg_restore", "--format=custom", "--file=/dev/null"], { input: bytes });
  await inspect();
  await psql(admin, "postgres", adminPassword, `
    CREATE ROLE ${role} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
      NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD '${restorePassword}';
    CREATE DATABASE ${plan.database} TEMPLATE template0;
    REVOKE ALL ON DATABASE ${plan.database} FROM PUBLIC;
    GRANT CONNECT ON DATABASE ${plan.database} TO ${role};
  `);
  await psql(admin, plan.database, adminPassword, `
    REVOKE ALL ON SCHEMA public FROM PUBLIC;
    GRANT USAGE, CREATE ON SCHEMA public TO ${role};
  `);
  const query = (sql) => psql(role, plan.database, restorePassword, `BEGIN READ ONLY;\n${sql};\nCOMMIT;`);
  const identity = JSON.parse(await query(`
    SELECT json_build_object('database', current_database(), 'user', current_user,
      'superuser', rolsuper, 'createDb', rolcreatedb, 'createRole', rolcreaterole,
      'replication', rolreplication, 'bypassRls', rolbypassrls, 'inherit', rolinherit,
      'memberships', (SELECT count(*) FROM pg_auth_members WHERE member = r.oid),
      'databaseCreate', has_database_privilege(current_database(), 'CREATE'),
      'schemaCreate', has_schema_privilege('public', 'CREATE'),
      'schemaUsage', has_schema_privilege('public', 'USAGE'),
      'objects', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public')) FROM pg_roles r WHERE rolname = current_user
  `));
  assertRestoreRole(identity, plan.database);
  await inspect();
  // Connect as the restricted role itself, not as an admin using SET ROLE.
  await run(["exec", "-i", "--user", "postgres", "--env", "PGPASSWORD", id,
    "pg_restore", "--format=custom", "--exit-on-error", "--single-transaction",
    "--no-owner", "--no-acl", "--no-tablespaces", "--no-password", "--host=/var/run/postgresql",
    `--username=${role}`, `--dbname=${plan.database}`], { env: { PGPASSWORD: restorePassword }, input: bytes });
  const restored = await snapshot(query);
  if (JSON.stringify(restored) !== JSON.stringify(manifest.snapshot)) {
    throw new Error("Restored rows, columns, or sequence values differ from the backup manifest.");
  }
  log(`Restore verified: ${JSON.stringify(restored.rows)}`);
  log("The development database was never connected to, mounted, or networked with this container.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [file, ...extra] = process.argv.slice(2);
    if (!file || extra.length) throw new Error("Usage: pnpm db:restore:test <backup.dump> (no target arguments).");
    const archive = await open(path.resolve(file), "r");
    let bytes;
    try {
      const info = await archive.stat();
      if (!info.isFile() || info.size > 256 * 1024 * 1024) throw new Error("Expected a regular local backup of at most 256 MiB.");
      bytes = await archive.readFile();
    } finally {
      await archive.close();
    }
    const manifest = JSON.parse(await readFile(`${path.resolve(file)}.json`, "utf8"));
    await restoreIsolated(bytes, manifest);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
