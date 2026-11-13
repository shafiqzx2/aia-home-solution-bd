import "server-only";
import {verifiedMetrics} from "@/lib/trust-content";
import {cacheLife,cacheTag} from "next/cache";
import {prisma} from "@/lib/prisma";
import {businessEnabled} from "./config";
import {staticSnapshot,type PublicSnapshot} from "@/lib/public-snapshot";
import {productPublicSchema,servicePublicSchema,contentBodySchema,companyInput,projectPublicSchema,jobPublicSchema} from "@/lib/business/validation";
import type {SolutionCategory} from "@/lib/public-content";
export async function publishedSite():Promise<PublicSnapshot> {
  "use cache";
  cacheTag("public-cms");cacheLife("minutes");
  const trustBadges=verifiedMetrics.filter(m=>m.status==="published"&&m.approved&&m.sourceUrl&&m.verifiedAt).map(m=>({id:m.id,label:m.label,value:m.value}));
  if(!businessEnabled())return {...staticSnapshot,trustBadges};
  const [products,services,categories,content,settings]=await Promise.all([
    prisma.product.findMany({where:{status:"PUBLISHED",archivedAt:null,category:{status:"PUBLISHED"}},select:{publicData:true,category:{select:{slug:true}}},orderBy:[{sortOrder:"asc"},{id:"asc"}],take:200}),
    prisma.service.findMany({where:{status:"PUBLISHED",category:{status:"PUBLISHED"}},select:{publicData:true},orderBy:[{sortOrder:"asc"},{id:"asc"}],take:100}),
    prisma.category.findMany({where:{status:"PUBLISHED"},select:{id:true,slug:true,parentId:true,translations:{select:{locale:true,name:true,description:true}}},orderBy:[{sortOrder:"asc"},{id:"asc"}],take:200}),
    prisma.contentEntry.findMany({where:{status:"PUBLISHED"},select:{id:true,verifiedAt:true,consentAt:true,slug:true,kind:true,translations:{select:{locale:true,title:true,body:true,seo:true}}},take:100}),
    prisma.companySettings.findUnique({where:{id:"company"},select:{name:true,contact:true,logoVariants:true,socialLinks:true}}),
  ]);
  const map=new Map<string,SolutionCategory>();for(const c of categories){const t=(l:string)=>c.translations.find(t=>t.locale===l);map.set(c.id,{id:c.slug,name:{en:t('en')?.name||'',bn:t('bn')?.name||''},description:{en:t('en')?.description||'',bn:t('bn')?.description||''},children:[]});}
  const roots:SolutionCategory[]=[];for(const c of categories){const node=map.get(c.id)!;if(c.parentId&&map.has(c.parentId)){map.get(c.parentId)!.children?.push(node);}else roots.push(node);}
  const portfolio:PublicSnapshot["portfolio"]=content.filter(c=>c.kind==="PROJECT").flatMap(c=>{const english=c.translations.find(t=>t.locale==="en");const body=contentBodySchema.safeParse(english?.body);const project=projectPublicSchema.safeParse(body.success?body.data.project:null);return project.success?[{...project.data,status:"published" as const}]:[];});
  const navContent=content.find(c=>c.kind==='PAGE'&&c.slug==='navigation'),navBody=contentBodySchema.safeParse(navContent?.translations.find(t=>t.locale==='en')?.body);
  const navigation=navBody.success&&navBody.data.navigation?navBody.data.navigation.filter(n=>n.visible).map(({key,label})=>({key,label})):staticSnapshot.navigation;
  const reviews=content.filter(c=>c.kind==='REVIEW'&&c.verifiedAt&&c.consentAt).flatMap(c=>{const parsed=contentBodySchema.safeParse(c.translations.find(t=>t.locale==='en')?.body);return parsed.success&&parsed.data.review?[{id:c.id,...parsed.data.review}]:[];});
  const jobs=content.filter(c=>c.kind==='CAREER').flatMap(c=>{const body=contentBodySchema.safeParse(c.translations.find(t=>t.locale==='en')?.body);const job=jobPublicSchema.safeParse(body.success?body.data.job:null);return job.success?[{...job.data,status:'published' as const}]:[];});
  const pages:PublicSnapshot['pages']={};for(const c of content){if(c.kind!=="PAGE")continue;pages[c.slug]={};for(const t of c.translations)if(t.locale==='en'||t.locale==='bn')pages[c.slug][t.locale]={title:t.title,body:contentBodySchema.parse(t.body),seo:t.seo as {title?:string;description?:string}};}
  let company=staticSnapshot.company;
  if(settings){const contact=settings.contact as {address:{en:string;bn:string};phone:string;email:string;whatsapp:string};const logos=settings.logoVariants as {document?:string};const parsed=companyInput.parse({revision:0,name:settings.name,...contact,logo:logos.document||company.logos.header.light.src,socialLinks:settings.socialLinks});company={...company,name:parsed.name,contact:{...company.contact,address:parsed.address,phone:parsed.phone,email:parsed.email,whatsapp:parsed.whatsapp},logos:parsed.logo===staticSnapshot.company.logos.header.light.src?company.logos:{...company.logos,header:{light:{...company.logos.header.light,src:parsed.logo},dark:{...company.logos.header.dark,src:parsed.logo}},footer:{light:{...company.logos.footer.light,src:parsed.logo},dark:{...company.logos.footer.dark,src:parsed.logo}}},socialLinks:parsed.socialLinks};}
  return {...staticSnapshot,navigation,reviews,trustBadges,connected:true,portfolio,jobs,company,categories:roots,solutionPreviews:roots.map(c=>({id:c.id,icon:staticSnapshot.solutionPreviews.find(s=>s.id===c.id)?.icon||"layers",name:c.name,description:c.description})),products:products.flatMap(p=>{const r=productPublicSchema.safeParse({...p.publicData as object,category:p.category.slug});return r.success?[r.data]:[];}),services:services.flatMap(p=>{const r=servicePublicSchema.safeParse(p.publicData);return r.success?[r.data]:[];}),pages};
}
