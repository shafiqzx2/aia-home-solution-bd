// Offline only: schema validation/diff never contacts a PostgreSQL server.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const env = { ...process.env, DATABASE_URL: 'postgresql://review:review@127.0.0.1:1/review', DIRECT_URL: 'postgresql://review:review@127.0.0.1:1/review' };
function prisma(args) {
  const r = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], { env, encoding: 'utf8', windowsHide: true });
  if (r.status !== 0) throw new Error(r.stderr || 'Prisma validation failed');
  return r.stdout;
}
console.log(prisma(['validate', '--schema', 'prisma/proposals/phase-a.prisma']).replace(/Environment variables.*\n/g, ''));
const sql = prisma(['migrate', 'diff', '--from-schema-datamodel', 'prisma/schema.prisma', '--to-schema-datamodel', 'prisma/proposals/phase-a.prisma', '--script']);
if (/\b(DROP|TRUNCATE)\b/i.test(sql) || /ALTER TABLE "DatabaseHealthCheck"/i.test(sql)) throw new Error('Proposal unexpectedly modifies existing objects');
const tables = [...sql.matchAll(/CREATE TABLE "([^"]+)"/g)].map(m => `'${m[1]}'`).join(',');
const invariants = readFileSync('prisma/proposals/invariants.sql', 'utf8').replace('__TABLES__', tables);
writeFileSync('prisma/proposals/phase-a.sql', `-- REVIEW ONLY. NOT IN THE EXECUTABLE MIGRATION DIRECTORY.\n-- Generated offline by scripts/phase-a-schema.mjs; no database was contacted.\nBEGIN;\n${sql}\n${invariants}\nCOMMIT;\n`);
console.log(`Prepared additive SQL proposal for ${tables.split(',').length} new tables. No SQL applied.`);
const schema = readFileSync('prisma/proposals/phase-a.prisma', 'utf8');
const models = [...schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)];
const diagram = ['erDiagram'];
for (const [, name, body] of models) {
  if (name === 'DatabaseHealthCheck') continue;
  const keys = body.split('\n').filter(l => /@id\b|@unique\b/.test(l) && !/^\s*@@/.test(l)).slice(0, 4).map(l => {
    const [field, type] = l.trim().split(/\s+/); return `    ${type.replace(/[?\[\]]/g, '')} ${field}`;
  });
  if (keys.length) diagram.push(`  ${name} {`, ...keys, '  }');
  for (const line of body.split('\n')) {
    if (!/@relation\(.*fields:/.test(line)) continue;
    const [field, type] = line.trim().split(/\s+/), target = type.replace('?', '');
    const optional = type.endsWith('?');
    diagram.push(`  ${target} ${optional ? '|o' : '||'}--o{ ${name} : "${field}"`);
  }
}
writeFileSync('docs/phase-a-schema-erd.md', '# Phase A proposed entity relationships\n\nReview only; the active database still has only its health probe model. Generated from the [schema proposal](../prisma/proposals/phase-a.prisma) by the offline review helper. This diagram shows relational links; JSON snapshots deliberately preserve issued history independently of mutable CRM/company data.\n\n```mermaid\n' + diagram.join('\n') + '\n```\n');
