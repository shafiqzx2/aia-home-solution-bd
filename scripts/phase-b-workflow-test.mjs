// Exercises real APIs against a separately restored LOCAL database only.
import {PrismaClient} from '@prisma/client';
import {hashPassword} from 'better-auth/crypto';
import {randomBytes,randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {allScopes} from '../lib/business/access.ts';
import {emptyQuotation} from '../lib/business/documents.ts';
for(const file of ['.env','.env.local'])if(existsSync(file))process.loadEnvFile(file);
const target=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(target.hostname)||target.pathname!=='/aia'||process.env.VERCEL)throw Error('Local source configuration required.');
target.pathname='/aia_workflow_verify_20261110_a1';process.env.DATABASE_URL=target.href;
const db=new PrismaClient(),base='http://localhost:3004',password=randomBytes(28).toString('base64url'),tag='local-qa-'+randomUUID(),jar=new Map(),checks=[];let user;
async function request(path,body,expected=200,method=body===undefined?'GET':'POST'){
 const response=await fetch(base+path,{method,headers:{Origin:base,Cookie:[...jar].map(([k,v])=>k+'='+v).join('; '),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 for(const cookie of response.headers.getSetCookie()){const first=cookie.split(';')[0],index=first.indexOf('=');jar.set(first.slice(0,index),first.slice(index+1));}
 const data=await response.json();assert.equal(response.status,expected,`${path}: ${response.status} ${data.error||''}`);return data;
}
async function check(name,work){await work();checks.push(name);console.log('PASS',name);}
const draft={...emptyQuotation(),client:'ISOLATED WORKFLOW VERIFICATION <script>',date:new Date().toISOString().slice(0,10),items:[{id:randomUUID(),code:'VERIFY',description:'Isolated verification item',quantity:'2',unit:'pcs',unitPrice:'125'}],discount:'10',taxPercent:'10',charges:'5'};
try{
 const role=await db.role.create({data:{name:tag,kind:'STAFF'}});for(const scope of allScopes)await db.permission.upsert({where:{scope},create:{scope},update:{}});await db.rolePermission.createMany({data:allScopes.map(scope=>({roleId:role.id,scope}))});
 user=await db.user.create({data:{email:tag+'@example.invalid',emailVerified:true,displayName:'LOCAL VERIFICATION ONLY',roles:{create:{roleId:role.id}}}});await db.account.create({data:{providerId:'credential',accountId:user.id,userId:user.id,password:await hashPassword(password)}});
 await request('/api/auth/sign-in/email',{email:user.email,password});assert.equal((await request('/api/admin/me')).id,user.id,'Server must use isolated verification database.');
 let quote,document,sale,payment,method,receipt;
 await check('Quotation revisions, stale writes, approval, issuance and authorized A4 output',async()=>{
  quote=await request('/api/admin/quotations',{expectedRevision:0,draft});
  await request('/api/admin/quotations',{id:quote.id,expectedRevision:99,draft},409);
  await request(`/api/admin/quotations/${quote.versionId}/issue`,{confirm:true},409);
  await request(`/api/admin/quotations/${quote.versionId}/submit`,{confirm:true});await request(`/api/admin/quotations/${quote.versionId}/approve`,{confirm:true});await request(`/api/admin/quotations/${quote.versionId}/issue`,{confirm:true});
  const preview=await request(`/api/admin/quotations/${quote.versionId}/preview`);assert(preview.html.includes('ISSUED'));assert(!preview.html.includes('>DEMO<'));assert(!preview.html.includes('<script>'));assert.match(preview.hash,/^[a-f0-9]{64}$/);
 });
 await check('Approved source converts to persisted memo and exactly one committed sale',async()=>{
  document=await request('/api/admin/documents',{expectedRevision:0,kind:'MEMO',sourceQuotationVersionId:quote.versionId,draft,issuer:'Isolated verifier'});
  await request(`/api/admin/documents/${document.versionId}/submit`,{confirm:true});await request(`/api/admin/documents/${document.versionId}/approve`,{confirm:true});await request(`/api/admin/documents/${document.versionId}/issue`,{confirm:true},422);
  const body={versionId:document.versionId,idempotencyKey:randomUUID(),confirm:true};sale=await request('/api/admin/sales/sale/commit',body);assert.equal(sale.total,'269');assert.equal((await request('/api/admin/sales/sale/commit',body)).id,sale.id);
  await request('/api/admin/sales/sale/commit',{...body,idempotencyKey:randomUUID()},409);await request(`/api/admin/documents/${document.versionId}/issue`,{confirm:true});
  await request('/api/admin/documents',{id:document.id,expectedRevision:1,kind:'MEMO',sourceQuotationVersionId:quote.versionId,draft,issuer:''},409);
 });
 await check('Payment allocation is idempotent, rejects overpayment and issues persisted receipts',async()=>{
  method=(await request('/api/admin/payment-methods')).find(m=>m.code==='CASH');if(!method)method=await request('/api/admin/payment-methods',{code:'CASH',label:'ISOLATED CASH VERIFICATION',active:true});
  const body={saleId:sale.id,methodId:method.id,amount:'100',externalRef:tag,receivedAt:new Date().toISOString(),idempotencyKey:randomUUID(),confirm:true};payment=await request('/api/admin/payments',body);assert.equal((await request('/api/admin/payments',body)).id,payment.id);
  await request('/api/admin/payments',{...body,amount:'269',idempotencyKey:randomUUID()},422);
  receipt=await request('/api/admin/payments/payment/receipt',{saleId:sale.id,paymentId:payment.id});const version=receipt.versions[0];await request(`/api/admin/documents/${version.id}/submit`,{confirm:true});await request(`/api/admin/documents/${version.id}/approve`,{confirm:true});await request(`/api/admin/documents/${version.id}/issue`,{confirm:true});const preview=await request(`/api/admin/documents/${version.id}/preview`);assert(preview.html.includes('ISSUED'));assert(preview.html.includes('100.00'));
 });
 await check('Independent invoice persists, commits and issues through the same approved workflow',async()=>{
  const row=await request('/api/admin/documents',{expectedRevision:0,kind:'INVOICE',sourceQuotationVersionId:null,draft,issuer:''});await request(`/api/admin/documents/${row.versionId}/submit`,{confirm:true});await request(`/api/admin/documents/${row.versionId}/approve`,{confirm:true});await request('/api/admin/sales/sale/commit',{versionId:row.versionId,idempotencyKey:randomUUID(),confirm:true});await request(`/api/admin/documents/${row.versionId}/issue`,{confirm:true});assert((await request(`/api/admin/documents/${row.versionId}/preview`)).html.includes('ISSUED'));
 });

 await check('Fully paid cash memos and follow-up invoices reuse a sale without double counting',async()=>{
  await request('/api/admin/sales/sale/document',{saleId:sale.id,kind:'MEMO'},422);
  await request('/api/admin/payments',{saleId:sale.id,methodId:method.id,amount:'169',externalRef:tag+'-balance',receivedAt:new Date().toISOString(),idempotencyKey:randomUUID(),confirm:true});
  const count=await db.sale.count();
  for(const kind of ['MEMO','INVOICE']){const record=await request('/api/admin/sales/sale/document',{saleId:sale.id,kind});const version=record.versions[0];await request(`/api/admin/documents/${version.id}/submit`,{confirm:true});await request(`/api/admin/documents/${version.id}/approve`,{confirm:true});await request(`/api/admin/documents/${version.id}/issue`,{confirm:true});const preview=await request(`/api/admin/documents/${version.id}/preview`);assert(preview.html.includes(kind==='MEMO'?'Cash memo':'Invoice'));assert(preview.html.includes('269.00'));}
  assert.equal(await db.sale.count(),count);
 });
 await check('Immutable issued documents and ledger rows resist database edits',async()=>{
  await assert.rejects(db.quotationVersion.update({where:{id:quote.versionId},data:{termsSnapshot:{draft:{...draft,client:'changed'}}}}));await assert.rejects(db.sale.update({where:{id:sale.id},data:{total:'1'}}));await assert.rejects(db.paymentRecord.delete({where:{id:payment.id}}));
 });
 await check('Permission denials block APIs and issued PDF access on existing sessions',async()=>{
  for(const scope of ['quotations.export','documents.create','inventory.update'])await db.userPermission.create({data:{userId:user.id,scope,effect:'DENY'}});
  await request(`/api/admin/quotations/${quote.versionId}/preview`,undefined,403);await request('/api/admin/documents',{expectedRevision:0,kind:'MEMO',sourceQuotationVersionId:null,draft,issuer:''},403);await request('/api/admin/inventory',{productId:'missing',delta:1,reason:'Denied test',idempotencyKey:randomUUID()},403);
 });
 await check('Unsupported action aliases cannot bypass resource permissions',async()=>{const count=await db.paymentRecord.count();await request('/api/admin/payments/payment/archive',{saleId:sale.id,methodId:method.id,amount:'1',externalRef:tag,receivedAt:new Date().toISOString(),idempotencyKey:randomUUID(),confirm:true},404);await request('/api/admin/customers/unknown/publish',{name:'Not permitted'},404);await request('/api/admin/services/unknown/archive',{revision:0},404);assert.equal(await db.paymentRecord.count(),count);});
 await check('Customer records, stock adjustments and public service drafts persist',async()=>{
  const customer=await request('/api/admin/customers',{name:'ISOLATED CUSTOMER VERIFICATION'});assert(await db.customer.findUnique({where:{id:customer.id}}));const updated=await request('/api/admin/customers',{id:customer.id,name:'ISOLATED CUSTOMER UPDATED',expectedUpdatedAt:customer.updatedAt},200,'PUT');await request('/api/admin/customers',{id:customer.id,name:'Stale',expectedUpdatedAt:customer.updatedAt},409,'PUT');await request(`/api/admin/customers/${customer.id}/archive`,{expectedUpdatedAt:updated.updatedAt});assert((await db.customer.findUnique({where:{id:customer.id}})).archivedAt);
  await db.userPermission.delete({where:{userId_scope:{userId:user.id,scope:'inventory.update'}}});const inventory=(await request('/api/admin/inventory'))[0];const body={productId:inventory.productId,delta:1,reason:'Isolated workflow verification',idempotencyKey:randomUUID()};const movement=await request('/api/admin/inventory',body);assert.equal((await request('/api/admin/inventory',body)).id,movement.id);await request('/api/admin/inventory',{...body,delta:-1000000,idempotencyKey:randomUUID()},422);
  const source=(await request('/api/admin/services'))[0];const changed=await request('/api/admin/services',{id:source.id,revision:source.revision,categoryId:source.categoryId,editorial:{...source.draft,name:{...source.draft.name,en:'ISOLATED SERVICE VERIFICATION'}},relatedProductIds:[]},200,'PUT');await request(`/api/admin/services/${source.id}/publish`,{revision:changed.revision});assert.equal((await db.service.findUnique({where:{id:source.id}})).publicData.name.en,'ISOLATED SERVICE VERIFICATION');
 });
 console.log(JSON.stringify({passed:checks.length,testDatabase:target.pathname.slice(1),workingDatabaseFinanceUntouched:true}));
}finally{if(user){await db.session.deleteMany({where:{userId:user.id}});await db.user.update({where:{id:user.id},data:{disabledAt:new Date()}});}await db.$disconnect();}
