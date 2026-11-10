import {PrismaClient} from '@prisma/client';
import {hashPassword} from 'better-auth/crypto';
import {randomBytes,randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {browser} from './lib/cdp.mjs';
for(const file of ['.env','.env.local'])if(existsSync(file))process.loadEnvFile(file);
const target=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(target.hostname)||target.pathname!=='/aia'||process.env.VERCEL)throw Error('Local source required.');target.pathname='/aia_workflow_verify_20261110_a1';process.env.DATABASE_URL=target.href;
const db=new PrismaClient(),base='http://localhost:3004',tag='browser-qa-'+randomUUID(),password=randomBytes(28).toString('base64url');let user,b;
try{const scopes=['media.view','media.create','media.publish','quotations.view','quotations.export'];const role=await db.role.create({data:{name:tag,kind:'STAFF',permissions:{create:scopes.map(scope=>({scope}))}}});user=await db.user.create({data:{email:tag+'@example.invalid',emailVerified:true,displayName:'LOCAL VERIFICATION ONLY',roles:{create:{roleId:role.id}}}});await db.account.create({data:{providerId:'credential',accountId:user.id,userId:user.id,password:await hashPassword(password)}});
 b=await browser();await b.navigate(base+'/en/login');await b.fill('Email',user.email);await b.fill('Password',password);await b.clickText('Sign in');await b.until('location.pathname.includes("/admin")');
 for(const section of ['media','quotations']){await b.navigate(base+'/en/admin/'+section);await b.until('!!document.querySelector(".a-workspace[data-workspace-ready]")');if(section==='media')await b.until('!!document.querySelector("input[type=file]")');else{await b.until('[...document.querySelectorAll("tr")].some(row=>row.textContent.includes("ISSUED"))');await b.evaluate('[...document.querySelectorAll("tr")].find(row=>row.textContent.includes("ISSUED")).querySelector("button").click()');await b.until('[...document.querySelectorAll("button")].some(button=>button.textContent==="Archive issued PDF"&&!button.disabled)');await b.evaluate('[...document.querySelectorAll("button")].find(button=>button.textContent==="Archive issued PDF").click()');await b.until('[...document.querySelectorAll("a")].some(link=>link.textContent==="Download archived PDF")');}
  for(const width of [1440,390])for(const theme of ['light','dark']){await b.viewport(width,1050);await b.evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true,section+' '+width+' '+theme);}
 }
 assert.deepEqual(b.errors,[]);console.log(JSON.stringify({newMediaAndArchiveUiChecks:8,themes:['light','dark'],widths:[1440,390],browserRuntimeErrors:0,ownerCredentialsUsed:false}));
}finally{if(b)await b.close();if(user){await db.session.deleteMany({where:{userId:user.id}});await db.user.update({where:{id:user.id},data:{disabledAt:new Date()}});}await db.$disconnect();}
