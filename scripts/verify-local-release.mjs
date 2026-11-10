import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {loadEnvFile} from 'node:process';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {PrismaClient} from '@prisma/client';
for(const file of ['.env','.env.local'])if(existsSync(file))loadEnvFile(file);
const email=JSON.parse(readFileSync('.onboarding/owner.json','utf8')).email.toLowerCase();
const listed=spawnSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8',windowsHide:true});if(listed.status)throw Error('Source inventory unavailable.');
let checked=0;for(const file of new Set(listed.stdout.split('\0').filter(Boolean))){if(!/\.(?:tsx?|[cm]?js|json|md|html|ya?ml|prisma|sql|txt)$/.test(file)||!existsSync(file))continue;checked++;if(readFileSync(file,'utf8').toLowerCase().includes(email))throw Error('Private identity found in source: '+file);}
let bundles=0;function scan(dir){if(!existsSync(dir))return;for(const entry of readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())scan(file);else if(/\.(js|json|html)$/.test(file)){bundles++;if(readFileSync(file,'utf8').toLowerCase().includes(email))throw Error('Private identity found in public build output.');}}}scan('.next/static');
const db=new PrismaClient();try{
 const roots=await db.user.count({where:{roles:{some:{role:{kind:'SUPER_ADMIN'}}}}});
 const pending=await db.staffInvitation.findMany({where:{rootBootstrap:true,consumedAt:null},select:{expiresAt:true}});
 const company=await db.companySettings.findUnique({where:{id:'company'},select:{contact:true}});if(JSON.stringify(company).toLowerCase().includes(email))throw Error('Public company contact contains a private authentication identity.');
 const activeQA=await db.user.count({where:{email:{contains:'@example.invalid'},displayName:'LOCAL VERIFICATION ONLY',disabledAt:null}});if(activeQA)throw Error('Synthetic verification accounts remain active.');
 const history=await db.$queryRaw`SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name`;
 console.log(JSON.stringify({sourceFilesChecked:checked,publicBundlesChecked:bundles,privateIdentityLeaks:0,rootAccounts:roots,validPendingRootInvitations:pending.filter(i=>i.expiresAt>new Date()).length,mfaActivated:process.env.AIA_MFA_ENABLED==='true',activeSyntheticAccounts:activeQA,migrations:history.map(r=>r.migration_name)},null,2));
}finally{await db.$disconnect();}
