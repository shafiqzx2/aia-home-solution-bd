// Explicit approved local activation only. No production targets or resets.
import {loadEnvFile} from 'node:process';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {PrismaClient} from '@prisma/client';
import {docker} from './db-postgres.mjs';
for(const file of ['.env','.env.local'])if(existsSync(file))loadEnvFile(file);
if(process.env.VERCEL||process.env.NODE_ENV==='production')throw Error('Local development activation only.');
if(process.env.AIA_APPROVE_LOCAL_PHASE_B!=='20261109')throw Error('Explicit local activation gate required.');
const url=new URL(process.env.DATABASE_URL||'');
if(!['localhost','127.0.0.1'].includes(url.hostname)||url.port!=='5432'||url.pathname!=='/aia')throw Error('Unexpected database target.');
if(process.env.DIRECT_URL&&process.env.DIRECT_URL!==process.env.DATABASE_URL)throw Error('Direct database target requires separate verification.');
const inspected=JSON.parse(await docker(['inspect','aia-home-solution-bd-postgres-1']));
const container=inspected[0];
if(!container?.State?.Running||container.Config.Labels['com.docker.compose.service']!=='postgres'||container.NetworkSettings.Ports['5432/tcp']?.some(p=>p.HostIp!=='127.0.0.1'||p.HostPort!=='5432'))throw Error('Unexpected local database container.');
const evidence=JSON.parse(readFileSync('docs/phase-b-review/sql-checks.json','utf8'));
const sql=readFileSync('prisma/proposals/phase-b.sql','utf8');
const backup=process.argv[2];if(!backup)throw Error('Verified backup path required.');
const manifest=JSON.parse(readFileSync(backup+'.json','utf8'));
const hash=value=>createHash('sha256').update(value).digest('hex');
if(hash(readFileSync(backup))!==manifest.sha256||evidence.backupSha256!==manifest.sha256||evidence.sqlSha256!==hash(sql)||!evidence.target.isolated||evidence.checks.length!==5||evidence.checks.some(c=>!c.passed))throw Error('Backup or isolated restore evidence mismatch.');
if(Date.now()-new Date(manifest.createdAt).getTime()>24*60*60*1000)throw Error('Backup is stale.');
if(/\b(DROP|TRUNCATE)\b/i.test(sql)||/ALTER TABLE "DatabaseHealthCheck"/i.test(sql))throw Error('Destructive SQL rejected.');
const prisma=new PrismaClient();
try {
 const current=await prisma.$queryRaw`SELECT current_database() AS name`;
 const history=await prisma.$queryRaw`SELECT migration_name,finished_at,rolled_back_at FROM "_prisma_migrations"`;
 if(current[0].name!=='aia'||history.length!==1||history[0].migration_name!=='20261107000000_initial'||!history[0].finished_at||history[0].rolled_back_at)throw Error('Unexpected migration history; stop for review.');
 const rows=await prisma.databaseHealthCheck.count();if(rows!==manifest.snapshot.rows.DatabaseHealthCheck.count)throw Error('Health row count changed.');
 const env={...process.env,DIRECT_URL:process.env.DATABASE_URL};
 function run(args){const result=spawnSync(process.execPath,['node_modules/prisma/build/index.js',...args],{env,encoding:'utf8',windowsHide:true});if(result.status!==0)throw Error(`Prisma ${args[0]} failed; target left intact for review. ${result.stderr.replaceAll(url.password,'[redacted]')}`);return result.stdout;}
 run(['migrate','diff','--from-schema-datasource','prisma/schema.prisma','--to-schema-datamodel','prisma/proposals/phase-b-from.prisma','--exit-code']);
 const directory='prisma/migrations/20261109000000_phase_b_business';if(existsSync(directory))throw Error('Migration directory already exists; stop for review.');
 mkdirSync(directory);writeFileSync(directory+'/migration.sql',sql,{flag:'wx'});
 console.log('Verified local development target: aia at 127.0.0.1:5432; backup and isolated restore verified; additive SQL unchanged.');
 console.log(run(['migrate','deploy']));
 if(await prisma.databaseHealthCheck.count()!==rows)throw Error('Post-migration health count mismatch.');
 console.log('Approved local Phase B migration applied; original health records preserved.');
}finally{await prisma.$disconnect();}
