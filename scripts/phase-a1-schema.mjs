// Offline proposal generation. These commands never connect to PostgreSQL.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
const env = {
  ...process.env,
  DATABASE_URL: "postgresql://review:review@127.0.0.1:1/review",
  DIRECT_URL: "postgresql://review:review@127.0.0.1:1/review",
};
function prisma(args) {
  const result = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", ...args],
    { env, encoding: "utf8", windowsHide: true },
  );
  if (result.status !== 0) throw Error(result.stderr || result.stdout);
  return result.stdout;
}
let schema = readFileSync("prisma/proposals/phase-a.prisma", "utf8").replace(
  "phase-a-review",
  "phase-a1-review",
);
schema = schema.replace(
  "model Product {",
  "model Product {\n  sku String? @unique",
);
schema = schema.replace(
  "model Inventory {",
  "model Inventory {\n  reorderPoint Decimal @default(0) @db.Decimal(16,4)",
);
for (const [model, fields] of Object.entries({
  Customer: "  sales Sale[]",
  QuotationVersion: "  originatingSales Sale[]",
  Product: "  saleItems SaleItem[]\n  stockMovements StockMovement[]",
  DocumentVersion: "  commercial CommercialDocument?",
})) {
  schema = schema.replace(`model ${model} {`, `model ${model} {\n${fields}`);
}
schema +=
  "\n" +
  readFileSync("prisma/proposals/phase-a1-extension.prisma.part", "utf8");
writeFileSync("prisma/proposals/phase-a1.prisma", schema);
console.log(
  prisma(["validate", "--schema", "prisma/proposals/phase-a1.prisma"]).replace(
    /Environment variables.*\n/g,
    "",
  ),
);
const sql = prisma([
  "migrate",
  "diff",
  "--from-schema-datamodel",
  "prisma/proposals/phase-a.prisma",
  "--to-schema-datamodel",
  "prisma/proposals/phase-a1.prisma",
  "--script",
]);
if (
  /\b(DROP|TRUNCATE)\b/i.test(sql) ||
  /ALTER TABLE "DatabaseHealthCheck"/i.test(sql)
)
  throw Error("Non-additive proposal");
const names = [...sql.matchAll(/CREATE TABLE "([^"]+)"/g)].map((m) => m[1]);
const rls = names
  .map(
    (n) =>
      `ALTER TABLE "${n}" ENABLE ROW LEVEL SECURITY;\nREVOKE ALL ON TABLE "${n}" FROM PUBLIC;`,
  )
  .join("\n");
const invariants = readFileSync(
  "prisma/proposals/phase-a1-invariants.sql",
  "utf8",
);
writeFileSync(
  "prisma/proposals/phase-a1-extension.sql",
  `-- REVIEW ONLY. Requires the reviewed Phase A proposal first. Nothing applied.\n-- Offline schema diff; target-role, concurrency and restore tests remain Phase B gates.\nBEGIN;\n${sql}\n${invariants}\n${rls}\nDO $$ DECLARE t text; r text; BEGIN FOREACH t IN ARRAY ARRAY[${names.map((n) => `'${n}'`).join(",")}] LOOP FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r) THEN EXECUTE format('REVOKE ALL ON TABLE %I FROM %I',t,r); END IF; END LOOP; END LOOP; END $$;\nCOMMIT;\n`,
);
const diagram = ["erDiagram"];
for (const [, name, body] of [
  ...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm),
].filter((m) => names.includes(m[1]))) {
  diagram.push(`  ${name} {`, `    String id PK`, "  }");
  for (const line of body
    .split("\n")
    .filter((l) => /@relation\(.*fields:/.test(l))) {
    const [field, type] = line.trim().split(/\s+/);
    diagram.push(
      `  ${type.replace("?", "")} ${type.endsWith("?") ? "|o" : "||"}--o{ ${name} : "${field}"`,
    );
  }
}
writeFileSync(
  "docs/phase-a1-schema-erd.md",
  "# Phase A.1 sales extension\n\nReview only. Extends the [Phase A diagram](phase-a-schema-erd.md), not the active database. The [combined proposal](../prisma/proposals/phase-a1.prisma) and [incremental SQL](../prisma/proposals/phase-a1-extension.sql) are generated offline. Commercial documents reuse existing version, approval, immutable snapshot, private file and portal grant records.\n\n```mermaid\n" +
    diagram.join("\n") +
    "\n```\n",
);
console.log(`Prepared ${names.length} additive tables; no SQL executed.`);
