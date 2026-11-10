// Imports only existing approved public content. Never overwrites CMS edits.
import fs from 'node:fs';
import ts from 'typescript';
import {PrismaClient} from '@prisma/client';
import {createRequire} from 'node:module';
const loadSource=createRequire(import.meta.url);
for(const p of ['.env','.env.local'])if(fs.existsSync(p))process.loadEnvFile(p);
loadSource.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,file);
const source=loadSource('../lib/public-content.ts'),{dictionaries}=loadSource('../lib/i18n.ts'),validation=loadSource('../lib/business/validation.ts');
const target=new URL(process.env.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(target.hostname)||target.pathname!=='/aia'||process.env.VERCEL)throw Error('Approved local target only.');
const owner=JSON.parse(fs.readFileSync('.onboarding/owner.json','utf8'));
if(JSON.stringify(source).toLowerCase().includes(owner.email.toLowerCase()))throw Error('Private identity must not enter public content.');
const db=new PrismaClient();
async function run(){
 await db.$transaction(async tx=>{
 const categories=new Map();
 async function add(nodes,parentId=null){for(const c of nodes){let row=await tx.category.findUnique({where:{slug:c.id}});if(!row)row=await tx.category.create({data:{slug:c.id,parentId,status:'PUBLISHED',translations:{create:['en','bn'].map(locale=>({locale,name:c.name[locale],description:c.description[locale]}))}}});categories.set(c.id,row.id);if(c.children)await add(c.children,row.id);}}
 await add(source.categories);
 for(const item of source.productConcepts){if(await tx.product.findUnique({where:{slug:item.slug}}))continue;const editorial=validation.productPublicSchema.parse({...item,images:item.images||[],specifications:item.specifications||[]});await tx.product.create({data:{slug:item.slug,sku:'AIA-CONTENT-'+item.slug.toUpperCase(),contentKind:item.contentKind,categoryId:categories.get(item.category),status:'PUBLISHED',draft:editorial,publicData:editorial,translations:{create:['en','bn'].map(locale=>({locale,name:item.name[locale],description:item.description[locale],specifications:item.specifications||[]}))},inventory:{create:{quantity:0,reorderPoint:0}}}});}
 for(const item of source.publicServices){if(await tx.service.findUnique({where:{slug:item.slug}}))continue;const editorial=validation.servicePublicSchema.parse(item);await tx.service.create({data:{slug:item.slug,categoryId:categories.get(item.areas[0])||categories.values().next().value,status:'PUBLISHED',draft:editorial,publicData:editorial,bookingConfiguration:{},translations:{create:['en','bn'].map(locale=>({locale,name:item.name[locale],description:item.description[locale],scope:item.scope}))}}});}
 for(const key of ['home','about']){if(await tx.contentEntry.findUnique({where:{kind_slug:{kind:'PAGE',slug:key}}}))continue;const copy=locale=>Object.fromEntries(Object.entries(dictionaries[locale]).filter(([,value])=>typeof value==='string'||Array.isArray(value)));const draft={slug:key,kind:'PAGE',revision:0,title:{en:key==='home'?'Home':'About AIA',bn:dictionaries.bn[key]},body:{en:{copy:copy('en'),hiddenSections:[]},bn:{copy:copy('bn'),hiddenSections:[]}},seo:{en:{title:'',description:''},bn:{title:'',description:''}}};validation.contentInput.parse(draft);await tx.contentEntry.create({data:{kind:'PAGE',slug:key,status:'PUBLISHED',draft,translations:{create:['en','bn'].map(locale=>({locale,title:draft.title[locale],body:draft.body[locale],seo:draft.seo[locale]}))}}});}
 for(const project of source.portfolio){if(await tx.contentEntry.findUnique({where:{kind_slug:{kind:'PROJECT',slug:project.slug}}}))continue;const body={en:{copy:{},hiddenSections:[],project},bn:{copy:{},hiddenSections:[],project}},draft={slug:project.slug,kind:'PROJECT',revision:0,title:project.name,body,seo:{en:{title:'',description:''},bn:{title:'',description:''}}};validation.contentInput.parse(draft);await tx.contentEntry.create({data:{kind:'PROJECT',slug:project.slug,status:'PUBLISHED',draft,translations:{create:['en','bn'].map(locale=>({locale,title:project.name[locale],body:body[locale],seo:{}}))}}});}
 if(!await tx.companySettings.findUnique({where:{id:'company'}})){const c=source.company,draft={revision:0,name:c.name,address:c.contact.address,phone:c.contact.phone,email:c.contact.email,whatsapp:c.contact.whatsapp,logo:c.logos.header.light.src,socialLinks:c.socialLinks};validation.companyInput.parse(draft);await tx.companySettings.create({data:{id:'company',name:c.name,contact:{address:c.contact.address,phone:c.contact.phone,email:c.contact.email,whatsapp:c.contact.whatsapp},socialLinks:c.socialLinks,logoVariants:{document:draft.logo},draft,branches:[],businessHours:{},quotationTerms:{},documentFooter:{},emailFooter:{},numberingPreferences:{}}});}
 await tx.auditLog.create({data:{action:'cms.existing_content.imported',entityType:'Bootstrap',entityId:'approved-public-content',metadata:{source:'existing approved website',overwrites:false,financialRecords:false}}});
 },{timeout:30000});
 console.log(JSON.stringify({categories:await db.category.count(),products:await db.product.count(),services:await db.service.count(),pagesAndProjects:await db.contentEntry.count(),existingEditsPreserved:true}));
}
run().catch(e=>{console.error('Local public-content import failed:',e.code||e.name,e.message.split('\n').filter(line=>/Argument .* missing|Unknown argument|Invalid value|Expected /.test(line)).join(' '));process.exitCode=1;}).finally(()=>db.$disconnect());
