// Explicit operator command; never called by builds, migrations or public APIs.
import {PrismaClient} from '@prisma/client';
import {loadEnvFile} from 'node:process';
import {existsSync,mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {randomBytes,createHash} from 'node:crypto';
for(const file of ['.env','.env.local'])if(existsSync(file))loadEnvFile(file);
const email=process.argv[2]||(existsSync('.onboarding/owner.json')?JSON.parse(readFileSync('.onboarding/owner.json','utf8')).email:null);if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Owner-approved private onboarding configuration required.');
if(process.env.AIA_BUSINESS_ENABLED!=='true'||!process.env.BETTER_AUTH_URL)throw Error('Configure the approved database and authentication first.');
const prisma=new PrismaClient(),token=randomBytes(32).toString('base64url');
try {
  const result=await prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(32751, 1)`;
    if(await tx.user.count({where:{disabledAt:null,roles:{some:{role:{kind:'SUPER_ADMIN'}}}}}))throw Error('An active Root Admin already exists; refusing reprovision.');
    const root=await tx.role.upsert({where:{name:'Root Admin'},create:{name:'Root Admin',kind:'SUPER_ADMIN'},update:{}});
    if(root.kind!=='SUPER_ADMIN')throw Error('Root role name collision; manual review required.');
    await tx.staffInvitation.updateMany({where:{rootBootstrap:true,consumedAt:null},data:{consumedAt:new Date()}});
    const row=await tx.staffInvitation.create({data:{email:email.toLowerCase(),tokenHash:createHash('sha256').update(token).digest('hex'),purpose:'INVITE',rootBootstrap:true,expiresAt:new Date(Date.now()+60*60*1000),roles:{create:{roleId:root.id}}}});
    await tx.auditLog.create({data:{action:'root.onboarding.prepared',entityType:'StaffInvitation',entityId:row.id,metadata:{operatorCommand:true,noPasswordGenerated:true}}});return row;
  },{isolationLevel:'Serializable'});
  mkdirSync('.onboarding',{recursive:true,mode:0o700});
  const file=`.onboarding/root-${result.id}.txt`;
  writeFileSync(file,`${process.env.BETTER_AUTH_URL}/en/onboarding#token=${token}\nExpires: ${result.expiresAt.toISOString()}\nSingle use. Choose your own password. No email was sent.\n`,{flag:'wx',mode:0o600});
  console.log(`Private single-use onboarding link written to ${file}. Do not share it in logs or Git.`);
}finally{await prisma.$disconnect();}
