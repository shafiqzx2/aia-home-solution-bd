import assert from 'node:assert/strict';
import {browser} from './lib/cdp.mjs';
const base='http://localhost:3003';
const checks=[];
async function check(name,work){await work();checks.push(name);console.log('PASS',name);}
await check('Anonymous Admin API denies access',async()=>{const r=await fetch(base+'/api/admin/products');assert.equal(r.status,401);assert.match(r.headers.get('cache-control'),/no-store/);});
await check('Unconfigured public persistence fails explicitly',async()=>{const r=await fetch(base+'/api/requests',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({})});assert.equal(r.status,503);});
await check('Unconfigured authentication fails explicitly',async()=>{const r=await fetch(base+'/api/auth/get-session');assert.equal(r.status,503);});
const b=await browser();
try {
 for(const width of [1440,390]) {
  await b.viewport(width,900);
  for(const path of ['/en','/en/products','/en/about','/en/request','/en/login','/bn'])await check(`${path} renders without overflow at ${width}px`,async()=>{
   await b.navigate(base+path);
   assert.equal(await b.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true);
   assert.equal(await b.evaluate('!!document.querySelector("h1")'),true);
  });
 }
 await check('Admin browser navigation requires sign-in',async()=>{await b.navigate(base+'/en/admin/products');await b.until('location.pathname==="/en/login"');});
 await check('Unavailable login does not accept credentials',async()=>{assert.equal(await b.evaluate('document.querySelector("form fieldset")?.disabled'),true);});
 await check('Stale cart entries do not crash the request form',async()=>{await b.evaluate('localStorage.setItem("aia-consultation-cart-v1",JSON.stringify([{id:"unavailable-test-only-product",quantity:1}]))');await b.navigate(base+'/en/request?entry=cart');assert.equal(await b.evaluate('!!document.querySelector("form.request-form")'),true);});
 assert.deepEqual(b.errors,[],'Browser runtime errors');
 console.log(JSON.stringify({passed:checks.length,browserErrors:b.errors.length,mode:'backend-disabled production build; no database writes'}));
} finally {await b.close();}
