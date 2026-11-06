import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";

export async function docker(args, { input, output, env = {} } = {}) {
  const child = spawn("docker", args, {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });
  let stdout = "";
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const done = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Docker command failed (${code}): ${stderr.trim()}`));
    });
  });
  const transfers = [];
  // Keep custom-format archives out of shell text pipelines.
  if (output) transfers.push(pipeline(child.stdout, output));
  else child.stdout.on("data", (chunk) => { stdout += chunk; });
  if (input && typeof input !== "string" && !Buffer.isBuffer(input)) {
    transfers.push(pipeline(input, child.stdin));
  } else {
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  }
  try {
    await Promise.all([done, ...transfers]);
  } catch (error) {
    child.kill();
    throw error;
  }
  if (stderr.trim()) console.error(stderr.trim());
  return stdout.trim();
}

const quoteIdentifier = (value) => `"${value.replaceAll('"', '""')}"`;

export async function snapshot(query) {
  const tables = JSON.parse(await query(`
    SELECT coalesce(json_agg(tablename ORDER BY tablename), '[]'::json)
    FROM pg_tables WHERE schemaname = 'public'
  `));
  const rows = {};
  for (const table of tables) {
    rows[table] = JSON.parse(await query(`
      SELECT json_build_object('count', count(*), 'checksum',
        md5(coalesce(string_agg(to_jsonb(t)::text, E'\\n' ORDER BY to_jsonb(t)::text COLLATE "C"), '')))
      FROM public.${quoteIdentifier(table)} AS t
    `));
  }
  const columns = JSON.parse(await query(`
    SELECT coalesce(json_agg(row_to_json(c) ORDER BY table_name, ordinal_position), '[]'::json)
    FROM (SELECT table_name, column_name, ordinal_position, data_type, is_nullable, column_default
      FROM information_schema.columns WHERE table_schema = 'public') c
  `));
  const sequences = JSON.parse(await query(`
    SELECT coalesce(json_agg(sequencename ORDER BY sequencename), '[]'::json)
    FROM pg_sequences WHERE schemaname = 'public'
  `));
  const sequenceValues = {};
  for (const sequence of sequences) {
    sequenceValues[sequence] = JSON.parse(await query(`
      SELECT row_to_json(s) FROM
        (SELECT last_value::text, is_called FROM public.${quoteIdentifier(sequence)}) s
    `));
  }
  return { rows, columns, sequenceValues };
}
