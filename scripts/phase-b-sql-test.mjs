// Applies the reviewed SQL only inside a NEW isolated restore-test database.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {restoreIsolated} from './db-restore-test.mjs';
const file=process.argv[2];if(!file)throw Error('Pass a verified local backup archive; no database target argument is accepted.');
const bytes=await readFile(file),manifest=JSON.parse(await readFile(file+'.json','utf8'));
const sql=await readFile('prisma/proposals/phase-b.sql','utf8');
const checks=[];
await restoreIsolated(bytes,manifest,{onVerifiedRestore:async target=>{
  await target.executeSql(sql);
  const tables=JSON.parse(await target.executeSql(`SELECT json_agg(tablename ORDER BY tablename) FROM pg_tables WHERE schemaname='public';`));
  if(!tables.includes('User')||!tables.includes('Sale')||!tables.includes('Product'))throw Error('Business tables missing');
  checks.push({check:'Additive migration executes as restricted restore role',passed:true});
  const count=await target.executeSql('SELECT count(*) FROM "DatabaseHealthCheck";');if(Number(count)!==Number(manifest.snapshot.rows.DatabaseHealthCheck.count))throw Error('Health data changed');
  checks.push({check:'Original health rows preserved',passed:true});
  await target.executeSql(`BEGIN; INSERT INTO "Role"(id,name,kind) VALUES('test-root','Test Root','SUPER_ADMIN'); INSERT INTO "User"(id,email,"emailVerified","displayName","updatedAt") VALUES('test-user','test@example.com',true,'Isolated test',now()); INSERT INTO "RoleAssignment"("userId","roleId") VALUES('test-user','test-root'); ROLLBACK;`);
  checks.push({check:'Auth and role relations execute transactionally',passed:true});
  let blocked=false;try{await target.executeSql(`INSERT INTO "PaymentRecord"(id,reference,"idempotencyKey","methodId","receivedAt",amount,currency,evidence) VALUES('invalid','invalid','invalid','missing',now(),-1,'BDT','{}');`);}catch{blocked=true;}
  if(!blocked)throw Error('Invalid payment was accepted');checks.push({check:'Invalid payment rejected',passed:true});
  const rls=Number(await target.executeSql(`SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname NOT IN ('DatabaseHealthCheck','_prisma_migrations') AND NOT c.relrowsecurity;`));
  if(rls)throw Error('Business table missing RLS');checks.push({check:'All new business tables enable RLS',passed:true});
  await mkdir('docs/phase-b-review',{recursive:true});
  await writeFile('docs/phase-b-review/sql-checks.json',JSON.stringify({timestamp:new Date().toISOString(),target:{database:target.database,containerId:target.containerId,isolated:true},backupSha256:manifest.sha256,sqlSha256:createHash('sha256').update(sql).digest('hex'),checks},null,2));
}});
console.log(JSON.stringify({passed:checks.length,failed:0,existingDatabaseModified:false}));
