import test from 'node:test';
import assert from 'node:assert/strict';
import {hasAccess,effectiveScopes} from '../lib/business/access.ts';
import {productPublicSchema,inquiryInput,imagePath,contentInput,companyInput} from '../lib/business/validation.ts';
import {validateCart} from '../lib/cart.ts';
import {redactIdentities} from '../lib/business/identity-redaction.ts';
import {canOpenModule,canonicalModule} from '../lib/business/workspace-access.ts';
import {workspaceModules} from '../lib/business/modules.ts';
import {authenticatorCode,base32} from '../lib/business/totp.ts';
test('authenticator rotation follows RFC 6238 SHA-1 vectors and Base32 encoding',()=>{assert.equal(base32(Buffer.from('foo')),'MZXW6');assert.equal(authenticatorCode('12345678901234567890',59000),'287082');assert.equal(authenticatorCode('12345678901234567890',1111111109000),'081804');});
const staff={id:'test-only',active:true,root:false,customerOnly:false,roles:['TEST ONLY'],allowed:['products.view'],denied:[]};
test('premium module routes enforce effective permissions, canonical aliases and Root-only areas',()=>{
 assert.equal(canOpenModule(staff,'products'),true);
 for(const id of ['users','roles','requests','settings','root-admin','audit-logs','unknown'])assert.equal(canOpenModule(staff,id),false);
 assert.equal(canOpenModule({...staff,denied:['products.view']},'products'),false);
 assert.equal(canOpenModule({...staff,customerOnly:true},'dashboard'),false);
 for(const item of workspaceModules)assert.equal(canOpenModule({...staff,root:true},item.id),true,item.id);
 assert.equal(canonicalModule('home'),'homepage');assert.equal(canonicalModule('company'),'settings');assert.equal(canonicalModule('access'),'users');
});
test('server access rejects anonymous, inactive, customer-only and unknown permissions',()=>{
 assert.equal(hasAccess(null,'products.view'),false);
 assert.equal(hasAccess({...staff,active:false},'products.view'),false);
 assert.equal(hasAccess({...staff,customerOnly:true},'products.view'),false);
 assert.equal(hasAccess({...staff,root:true},'products.unrecognized'),false);
 assert.equal(hasAccess(staff,'products.view'),true);
 assert.equal(hasAccess(staff,'users.manage'),false);
});
test('per-user deny beats role and user allow while Root retains known permissions',()=>{
 const scopes=effectiveScopes(['products.view','products.publish'],[{scope:'products.publish',effect:'DENY'},{scope:'products.publish',effect:'ALLOW'},{scope:'products.update',effect:'ALLOW'}]);
 assert.equal(hasAccess({...staff,...scopes},'products.publish'),false);
 assert.equal(hasAccess({...staff,...scopes},'products.update'),true);
 assert.equal(hasAccess({...staff,...scopes,root:true},'products.publish'),true);
});
test('published product DTO refuses private financial fields',()=>{
 const product={slug:'test-only',category:'test',name:{en:'TEST ONLY',bn:''},description:{en:'',bn:''},illustration:'linear',images:[],specifications:[],status:'published',contentKind:'verified-product'};
 assert.equal(productPublicSchema.safeParse(product).success,true);
 for(const key of ['unitPrice','privatePrice','cost','supplier'])assert.equal(productPublicSchema.safeParse({...product,[key]:'123'}).success,false);
});
test('CMS image paths exclude external, traversal and executable content',()=>{
 assert.equal(imagePath.safeParse('/images/test-only.webp').success,true);
 for(const path of ['https://example.test/a.png','/images/../secret','javascript:alert(1)','/images/a.svg?script=1'])assert.equal(imagePath.safeParse(path).success,false);
});
const inquiry={idempotencyKey:'54cf57f5-a9f2-487d-9bf6-2128cf9ea86d',kind:'CONSULTATION',name:'TEST ONLY',email:'test@example.invalid',phone:'+8801700000000',address:'',requirements:'TEST ONLY',preferredCommunication:'phone',items:[],consent:true};
test('inquiries require consent, valid contact, bounded quantities and stable UUID key',()=>{
 assert.equal(inquiryInput.safeParse(inquiry).success,true);
 for(const update of [{consent:false},{phone:'abc'},{idempotencyKey:'duplicate-key'},{items:[{slug:'test',quantity:100}]},{website:'bot'}])assert.equal(inquiryInput.safeParse({...inquiry,...update}).success,false);
 assert.equal(inquiryInput.safeParse({...inquiry,email:'',preferredCommunication:'email'}).success,false);
 assert.equal(inquiryInput.safeParse({...inquiry,serviceSlugs:['service-one','service-two']}).success,true);
});
test('cart supports newly published CMS slugs and rejects malformed identifiers',()=>{
 assert.deepEqual(validateCart([{id:'new-cms-product',quantity:2},{id:'../private',quantity:1},{id:'test',quantity:0}]),[{id:'new-cms-product',quantity:2}]);
});
test('private identities are redacted recursively and case-insensitively without regex overmatching',()=>{
 const result=redactIdentities({guest:{email:'PRIVATE+ROOT@example.invalid'},notes:'Contact private+root@example.invalid',unrelated:'privateXroot@example.invalid'},['private+root@example.invalid']);
 assert.equal(result.guest.email,'[protected identity]');assert.equal(result.notes,'Contact [protected identity]');assert.equal(result.unrelated,'privateXroot@example.invalid');
});
test('CMS accepts bilingual CEO content but refuses unknown body structures',()=>{
 const page={slug:'about',kind:'PAGE',revision:0,title:{en:'TEST ONLY',bn:''},body:{en:{copy:{aboutTitle:'TEST ONLY'},leadership:{name:'TEST ONLY',designation:'CEO',biography:'TEST ONLY'}},bn:{copy:{}}},seo:{en:{title:'',description:''},bn:{title:'',description:''}}};
 assert.equal(contentInput.safeParse(page).success,true);
 assert.equal(contentInput.safeParse({...page,body:{...page.body,en:{copy:{},script:'<script>'}}}).success,false);
 assert.equal(companyInput.safeParse({revision:0,name:'TEST ONLY',address:{en:'',bn:''},phone:'',email:'test@example.invalid',whatsapp:'',logo:'/images/test-only.webp',socialLinks:{facebookUrl:null,instagramUrl:null,youtubeUrl:null,linkedinUrl:null}}).success,true);
});
