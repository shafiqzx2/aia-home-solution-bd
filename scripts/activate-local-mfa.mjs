// Local MFA activation required by the owner's secure onboarding request.
import {loadEnvFile} from 'node:process';
import {readFileSync,writeFileSync,existsSync,mkdirSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {PrismaClient} from '@prisma/client';
import {restoreIsolated} from './db-restore-test.mjs';
for(const file of ['.env','.env.local'])if(existsSync(file))loadEnvFile(file);
const target=new URL(process.env.DATABASE_URL||'');
if(process.env.VERCEL||process.env.NODE_ENV==='production'||!['localhost','127.0.0.1'].includes(target.hostname)||target.port!=='5432'||target.pathname!=='/aia')throw Error('Verified local development target required.');
const file=process.argv[2];if(!file)throw Error('Fresh verified backup required.');
const manifest=JSON.parse(readFileSync(file+'.json','utf8')),bytes=readFileSync(file),sql=readFileSync('prisma/proposals/phase-b-mfa.sql','utf8');
const evidence=JSON.parse(readFileSync('docs/phase-b-review/mfa-schema-checks.json','utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
if(hash(bytes)!==manifest.sha256||Date.now()-new Date(manifest.createdAt)>86400000||hash(sql)!==evidence.sqlSha256||!evidence.isolated||Object.values(evidence.checks).some(v=>!v)||/\b(DROP|TRUNCATE)\b/i.test(sql))throw Error('Backup or additive SQL evidence mismatch.');
await restoreIsolated(bytes,manifest,{onVerifiedRestore:async restored=>{await restored.executeSql(sql);if(Number(await restored.executeSql('SELECT count(*) FROM "TwoFactor";'))!==0)throw Error('Unexpected MFA data.');}});
const db=new PrismaClient();try{
 const history=await db.$queryRaw`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`;
 if(history.map(r=>r.migration_name).join(',')!=='20261107000000_initial,20261109000000_phase_b_business')throw Error('Unexpected migration history; stop for review.');
 const before=[await db.user.count(),await db.account.count(),await db.product.count(),await db.customerRequest.count()];
 const env={...process.env,DIRECT_URL:process.env.DATABASE_URL};
 function run(args){const r=spawnSync(process.execPath,['node_modules/prisma/build/index.js',...args],{env,encoding:'utf8',windowsHide:true});if(r.status)throw Error('Prisma verification or deployment failed; inspect migration state before retrying.');return r.stdout;}
 // These two reviewed composite foreign keys are deliberate SQL invariants,
 // outside Prisma's relation model. Preserve them; never execute this diff.
 const diff=run(['migrate','diff','--from-schema-datasource','prisma/schema.prisma','--to-schema-datamodel','prisma/schema.prisma','--script']);
 const unexpected=diff.replace(/--[^\n]*/g,'').replace(/ALTER TABLE "BusinessDocument" DROP CONSTRAINT "current_document_belongs_to_document";/g,'').replace(/ALTER TABLE "Quotation" DROP CONSTRAINT "current_quote_belongs_to_quote";/g,'').trim();
 if(unexpected)throw Error('Unexpected database drift; stop for review.');
 const dir='prisma/migrations/20261109010000_root_mfa';if(existsSync(dir))throw Error('MFA migration directory already exists; review required.');mkdirSync(dir);writeFileSync(dir+'/migration.sql',sql,{flag:'wx'});
 console.log(run(['migrate','deploy']));
 const after=[await db.user.count(),await db.account.count(),await db.product.count(),await db.customerRequest.count()];if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Unexpected concurrent record changes; inspect before continuing.');
 copyFileSync('prisma/schema.prisma','prisma/proposals/phase-b-before-mfa.prisma');copyFileSync('prisma/proposals/phase-b-mfa.prisma','prisma/schema.prisma');
 let local=readFileSync('.env.local','utf8');local=/^AIA_MFA_ENABLED=/m.test(local)?local.replace(/^AIA_MFA_ENABLED=.*$/m,'AIA_MFA_ENABLED=true'):local+'\nAIA_MFA_ENABLED=true\n';writeFileSync('.env.local',local,{mode:0o600});
 writeFileSync('docs/phase-b-review/local-mfa-activation.json',JSON.stringify({timestamp:new Date().toISOString(),target:'local aia at 127.0.0.1:5432',backupSha256:manifest.sha256,sqlSha256:hash(sql),freshRestoreVerified:true,existingRecordCountsPreserved:true},null,2));
 console.log('Local MFA schema activated; existing record counts preserved. Owner password and authenticator remain unset.');
}finally{await db.$disconnect();}
