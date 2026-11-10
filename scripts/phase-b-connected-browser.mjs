import {PrismaClient} from '@prisma/client';
import {hashPassword} from 'better-auth/crypto';
import {randomBytes,randomUUID} from 'node:crypto';
import {loadEnvFile} from 'node:process';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {browser} from './lib/cdp.mjs';
for(const p of ['.env','.env.local'])if(existsSync(p))loadEnvFile(p);
const url=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(url.hostname)||url.pathname!=='/aia'||process.env.VERCEL)throw Error('Local browser verification only.');
const base=process.env.AIA_TEST_BASE||'http://localhost:3000',db=new PrismaClient(),password=randomBytes(28).toString('base64url'),tag='browser-qa-'+randomUUID().slice(0,8),checks=[];let user,b;
async function check(name,work){await work();checks.push(name);console.log('PASS',name);}
try{
 const scopes=['products','categories','content','company','projects','requests','users','roles','reports','quotations','documents','sales','payments','inventory','customers','services','media'].map(s=>s+'.view');for(const scope of scopes)await db.permission.upsert({where:{scope},create:{scope},update:{}});
 const role=await db.role.create({data:{name:tag,kind:'STAFF',permissions:{create:scopes.map(scope=>({scope}))}}});
 user=await db.user.create({data:{email:tag+'@example.invalid',displayName:'LOCAL VERIFICATION ONLY',emailVerified:true,roles:{create:{roleId:role.id}}}});
 await db.account.create({data:{providerId:'credential',accountId:user.id,userId:user.id,password:await hashPassword(password)}});
 b=await browser();await b.navigate(base+'/en/login');await b.fill('Email',user.email);await b.fill('Password',password);await b.clickText('Sign in');await b.until('location.pathname.includes("/admin")');
 await check('Real browser sign-in reaches authorized workspace',async()=>{await b.until('!!document.querySelector(".a-workspace[data-workspace-ready]")');assert.equal(await b.evaluate('!!document.querySelector(".a-workspace[data-workspace-ready]")'),true);});

 await check('Dashboard uses authorized real counts and excludes verification accounts',async()=>{
  const result=await b.evaluate('fetch("/api/admin/dashboard").then(r=>r.json())');
  assert.equal(result.source,'POSTGRESQL');assert.equal(result.financial,true);
  const users=await b.evaluate('fetch("/api/admin/users").then(r=>r.json())');assert(!users.some(u=>u.displayName==='LOCAL VERIFICATION ONLY'));
  const roles=await b.evaluate('fetch("/api/admin/roles").then(r=>r.json())');assert(!roles.some(r=>/^(local-qa-|browser-qa-|mfa-qa-)/.test(r.name)));
  const requests=await b.evaluate('fetch("/api/admin/requests").then(r=>r.json())');assert(!requests.some(r=>r.guest?.name==='LOCAL VERIFICATION ONLY'&&r.guest?.email?.endsWith('@example.invalid')));
  assert.equal(result.requests,await db.customerRequest.count({where:{archivedAt:null,NOT:{guest:{is:{name:'LOCAL VERIFICATION ONLY',email:{endsWith:'@example.invalid'}}}}}}));
 });
 const output='docs/phase-b-review';mkdirSync(output,{recursive:true});
 for(const width of [1440,390])for(const theme of ['light','dark'])await check(`Premium dashboard at ${width}px in ${theme}`,async()=>{
  await b.viewport(width,1050);await b.navigate(base+'/en/admin/dashboard');await b.until('!!document.querySelector(".a-kpi")');
  await b.evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.style.colorScheme=${JSON.stringify(theme)}`);
  assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true);
  const text=await b.evaluate('document.querySelector(".a-main").innerText');assert(!/651,800|421,375|230,425|DEMO SALES|fictional demo data|demo requests|Fixed review period|08 Nov 2026|LOCAL VERIFICATION ONLY|\\ufffd/i.test(text));
  assert.equal(await b.evaluate('document.querySelectorAll(".a-kpi").length'),4);
  assert.equal(await b.evaluate('[...document.querySelectorAll(".a-nav-items [aria-current=page]")].length'),1);
  if(width===1440)assert.equal(await b.evaluate('Math.round(document.querySelector(".a-sidebar").getBoundingClientRect().width)'),274);
  if(width===390){await b.evaluate('document.querySelector(".a-mobile-toggle").click()');await b.until('!!document.querySelector(".a-mobile-open")');assert.equal(await b.evaluate('document.querySelector(".a-mobile-toggle").getAttribute("aria-expanded")'),'true');await b.evaluate('document.querySelector(".a-backdrop").click()');}
  writeFileSync(`${output}/premium-admin-${width}-${theme}.png`,await b.screenshot());
 });
 for(const width of [1440,390]){await b.viewport(width,1000);for(const section of ['products','categories','homepage','about','settings','projects','requests','users','quotations','memo-studio','invoices','documents','orders','payments','customers','inventory','services','media'])await check(`Connected ${section} module fits ${width}px`,async()=>{await b.navigate(base+'/en/admin/'+section);await b.until('!!document.querySelector(".a-workspace[data-workspace-ready]")');assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true);assert.equal(await b.evaluate('!!document.querySelector("h1")'),true);});}

 await check('Existing session honors individual dashboard and route denials',async()=>{
  await db.userPermission.createMany({data:['reports.view','requests.view','users.view'].map(scope=>({userId:user.id,scope,effect:'DENY'}))});
  await b.navigate(base+'/en/admin/dashboard');await b.until('!!document.querySelector(".a-kpi")');
  const result=await b.evaluate('fetch("/api/admin/dashboard").then(r=>r.json())');assert.equal(result.financial,false);assert.equal(result.requests,null);assert.equal(typeof result.products,'number');
  assert.equal(await b.evaluate('fetch("/api/admin/users").then(r=>r.status)'),403);
  assert.equal(await b.evaluate('!!document.querySelector(".a-nav-items button[title^=Users]")'),false);
  await b.navigate(base+'/en/admin/users');await b.until('location.pathname==="/en/admin/dashboard"');
 });
 await check('Public bilingual pages use persisted catalog without overflow',async()=>{for(const route of ['/en','/bn','/en/products','/en/projects','/en/request']){await b.navigate(base+route);assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true);}});
 await b.navigate(base+'/en/admin/products');await b.until('!!document.querySelector(".a-workspace[data-workspace-ready]")');await b.evaluate('[...document.querySelectorAll(".a-avatar")].find(e=>e.getClientRects().length).click()');await b.until('!![...document.querySelectorAll("button")].find(e=>e.textContent.trim()==="Sign out"&&e.getClientRects().length&&Object.keys(e).some(k=>k.startsWith("__reactProps")))');await b.evaluate('[...document.querySelectorAll("button")].find(e=>e.textContent.trim()==="Sign out"&&e.getClientRects().length).click()');await b.until('location.pathname==="/en/login"');
 await check('Browser logout prevents workspace reuse',async()=>{await b.navigate(base+'/en/admin/products');await b.until('location.pathname==="/en/login"');});
 assert.deepEqual(b.errors,[],'Browser runtime errors');console.log(JSON.stringify({passed:checks.length,browserRuntimeErrors:0,ownerCredentialsUsed:false}));
}finally{if(b)await b.close();if(user){await db.session.deleteMany({where:{userId:user.id}});await db.user.update({where:{id:user.id},data:{disabledAt:new Date()}});}await db.$disconnect();}
