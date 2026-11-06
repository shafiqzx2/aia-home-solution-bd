import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { docker, snapshot } from "./db-postgres.mjs";

function pg(tool, args = [], options = {}) {
  const envFiles = [".env", ".env.local"].filter(existsSync)
    .flatMap((file) => ["--env-file", file]);
  return docker([
    "compose", ...envFiles, "exec", "-T", "postgres", "sh", "-c",
    'export PGPASSWORD="$POSTGRES_PASSWORD"; exec "$@" --host=/var/run/postgresql --username="$POSTGRES_USER" --dbname="$POSTGRES_DB"',
    "db-tools", tool, ...args,
  ], options);
}

function query(sql) {
  return pg("psql", ["-X", "-q", "-A", "-t", "--set=ON_ERROR_STOP=1"], {
    input: `BEGIN READ ONLY;\n${sql};\nCOMMIT;\n`,
  });
}

async function checksum(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

async function backup() {
  const before = await snapshot(query);
  await mkdir("backups", { recursive: true, mode: 0o700 });
  const file = path.resolve("backups", `aia-${new Date().toISOString().replaceAll(":", "-")}-${randomUUID()}.dump`);
  await pg("pg_dump", ["--format=custom", "--no-owner", "--no-acl"], {
    output: createWriteStream(file, { flags: "wx", mode: 0o600 }),
  });
  const after = await snapshot(query);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(`Database changed during backup; archive retained but not verified: ${file}. Retry when local writes are paused.`);
  }
  const manifest = { format: 1, createdAt: new Date().toISOString(), sha256: await checksum(file), snapshot: before };
  await writeFile(`${file}.json`, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  console.log(`Backup: ${file}\nBytes: ${(await stat(file)).size}\nSHA-256: ${manifest.sha256}`);
}

try {
  const [command, ...extra] = process.argv.slice(2);
  if (command !== "backup" || extra.length) throw new Error("Usage: pnpm db:backup (no restore or target arguments).");
  await backup();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
