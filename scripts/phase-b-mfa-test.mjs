// New MFA integration only; never uses or sets owner credentials.
import {PrismaClient} from '@prisma/client';
import {hashPassword} from 'better-auth/crypto';
import {randomBytes,randomUUID,createHmac} from 'node:crypto';
import {loadEnvFile} from 'node:process';
import {existsSync} from 'node:fs';
import assert from 'node:assert/strict';
for(const f of ['.env','.env.local'])if(existsSync(f))loadEnvFile(f);
const target=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(target.hostname)||target.pathname!=='/aia'||process.env.VERCEL)throw Error('Local MFA verification only.');
if(process.env.AIA_MFA_ISOLATED==='true'){target.pathname='/aia_workflow_verify_20261110_a1';process.env.DATABASE_URL=target.href;}
const base=process.env.AIA_TEST_BASE||'http://localhost:3003',db=new PrismaClient(),password=randomBytes(28).toString('base64url'),tag='mfa-qa-'+randomUUID().slice(0,8),jar=new Map(),checks=[];let user;
function totp(secret,offset=0){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret.toUpperCase().replace(/=+$/,''))bits+=alphabet.indexOf(c).toString(2).padStart(5,'0');const key=Buffer.from((bits.match(/.{8}/g)||[]).map(s=>parseInt(s,2)));const step=Buffer.alloc(8);step.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)+offset));const hash=createHmac('sha1',key).update(step).digest(),index=hash[hash.length-1]&15;return ((hash.readUInt32BE(index)&0x7fffffff)%1000000).toString().padStart(6,'0');}
async function request(path,body,expected=200,attempt=0){const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Origin:base,Cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});if(r.status===429&&expected===200&&attempt<2){console.log("Rate limit active; waiting for its normal window.");await new Promise(resolve=>setTimeout(resolve,path.includes("sign-in")?61000:11000));return request(path,body,expected,attempt+1);}for(const cookie of r.headers.getSetCookie()){const first=cookie.split(';')[0],index=first.indexOf('='),name=first.slice(0,index);if(/max-age=0/i.test(cookie))jar.delete(name);else jar.set(name,first.slice(index+1));}const data=await r.json();if(expected!==null)assert.equal(r.status,expected,`${path}: unexpected status ${r.status}`);return {status:r.status,data};}
async function check(name,work){await work();checks.push(name);console.log('PASS',name);}
try{
 await db.permission.upsert({where:{scope:'products.view'},create:{scope:'products.view'},update:{}});const role=await db.role.create({data:{name:tag,kind:'STAFF',permissions:{create:{scope:'products.view'}}}});
 user=await db.user.create({data:{email:tag+'@example.invalid',displayName:'LOCAL VERIFICATION ONLY',emailVerified:true,roles:{create:{roleId:role.id}}}});await db.account.create({data:{providerId:'credential',accountId:user.id,userId:user.id,password:await hashPassword(password)}});
 const signIn=()=>request('/api/auth/sign-in/email',{email:user.email,password});
 await signIn();const enabled=await request('/api/auth/two-factor/enable',{password,method:'totp'}),secret=new URL(enabled.data.totpURI).searchParams.get('secret'),codes=enabled.data.backupCodes;
 await check('Enrollment stores encrypted factor data and remains unverified',async()=>{const row=await db.twoFactor.findUnique({where:{userId:user.id}});assert.equal(row.verified,false);assert(row.secret!==secret,'Factor data must be encrypted');assert(!row.backupCodes.includes(codes[0]));assert.equal((await db.user.findUnique({where:{id:user.id}})).twoFactorEnabled,false);});
 await check('Verified enrollment rotates the session and records MFA proof',async()=>{await request('/api/auth/two-factor/verify-totp',{code:totp(secret),trustDevice:false});const current=(await request('/api/auth/get-session')).data;assert(!current.user.email);assert(!current.session.token);assert(await db.verification.findFirst({where:{identifier:'aia-mfa:'+current.session.id,value:user.id}}));assert.equal((await db.user.findUnique({where:{id:user.id}})).twoFactorEnabled,true);});
 await request('/api/auth/sign-out',{});
 await check('Password alone cannot finish MFA-enabled sign-in',async()=>{const result=await signIn();assert.equal(result.data.twoFactorRedirect,true);await request('/api/admin/me',undefined,401);});
 await check('Invalid authenticator code is denied',async()=>{let invalid='000000';while([-1,0,1].some(offset=>totp(secret,offset)===invalid))invalid=(Number(invalid)+1).toString().padStart(6,'0');const result=await request('/api/auth/two-factor/verify-totp',{code:invalid,trustDevice:false},null);assert([400,401].includes(result.status));});
 await check('Valid authenticator completes sign-in and server authorization',async()=>{await request('/api/auth/two-factor/verify-totp',{code:totp(secret),trustDevice:false});await request('/api/admin/products');});
 // Respect the library's three-verifications-per-ten-seconds limit.
 await new Promise(resolve=>setTimeout(resolve,11000));
 await check('Recent password plus MFA verification works',async()=>{await request('/api/security/reauth',{password,code:totp(secret)});const current=(await request('/api/auth/get-session')).data;assert(await db.verification.findFirst({where:{identifier:'aia-sensitive:'+current.session.id,value:user.id}}));});
 await request('/api/auth/sign-out',{});await signIn();
 await check('Single-use recovery code completes MFA',async()=>{await request('/api/auth/two-factor/verify-backup-code',{code:codes[0],trustDevice:false});await request('/api/admin/products');});
 await request('/api/auth/sign-out',{});await signIn();
 await check('Reused recovery code is rejected',async()=>{const result=await request('/api/auth/two-factor/verify-backup-code',{code:codes[0],trustDevice:false},null);assert([400,401].includes(result.status));});

 if(process.env.AIA_MFA_ISOLATED==='true'){
  await request('/api/auth/two-factor/verify-totp',{code:totp(secret),trustDevice:false});
  await check('Rotation requires a recent password and existing MFA confirmation',()=>request('/api/security/rotate-mfa',{phase:'begin',confirm:true},403));
  await new Promise(resolve=>setTimeout(resolve,11000));
  await request('/api/security/reauth',{password,code:totp(secret)});
  const before=await db.twoFactor.findUnique({where:{userId:user.id}}),replacement=await request('/api/security/rotate-mfa',{phase:'begin',confirm:true}),newSecret=new URL(replacement.data.totpURI).searchParams.get('secret');
  await check('Staged rotation preserves old credentials and encrypts pending secrets',async()=>{assert.equal((await db.twoFactor.findUnique({where:{userId:user.id}})).secret,before.secret);const pending=await db.verification.findFirst({where:{identifier:'aia-mfa-rotation:'+user.id}});assert(!pending.value.includes(newSecret));assert(!pending.value.includes(replacement.data.backupCodes[0]));});
  await check('Invalid replacement code cannot change the enrolled factor',async()=>{let code='000000';while([-1,0,1].some(offset=>totp(newSecret,offset)===code))code=(Number(code)+1).toString().padStart(6,'0');await request('/api/security/rotate-mfa',{phase:'finish',code,savedRecoveryCodes:true},403);assert.equal((await db.twoFactor.findUnique({where:{userId:user.id}})).secret,before.secret);});
  await check('Verified replacement revokes all sessions and consumes pending rotation',async()=>{await request('/api/security/rotate-mfa',{phase:'finish',code:totp(newSecret),savedRecoveryCodes:true});assert.equal(await db.session.count({where:{userId:user.id}}),0);assert.equal(await db.verification.count({where:{identifier:'aia-mfa-rotation:'+user.id}}),0);await request('/api/admin/me',undefined,401);});
  await signIn();
  await check('Old recovery codes fail after rotation and new authenticator signs in',async()=>{const rejected=await request('/api/auth/two-factor/verify-backup-code',{code:codes[1],trustDevice:false},null);assert([400,401].includes(rejected.status));await request('/api/auth/two-factor/verify-totp',{code:totp(newSecret),trustDevice:false});await request('/api/admin/products');});
 }
 console.log(JSON.stringify({passed:checks.length,ownerCredentialsUsed:false}));
}finally{if(user){await db.session.deleteMany({where:{userId:user.id}});await db.user.update({where:{id:user.id},data:{disabledAt:new Date()}});}await db.$disconnect();}
