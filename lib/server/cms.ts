import {publicMediaReferences} from './media-validation';
import "server-only";
import {assertPublicIdentitySafe} from "./identity-privacy";
import {Prisma} from "@prisma/client";
import {contentInput,companyInput,serviceInput,servicePublicSchema} from "@/lib/business/validation";
import {dictionaries} from "@/lib/i18n";
import {serializable,HttpError,audit} from "./security";
export async function saveContent(actorId:string,raw:unknown) {
  const input=contentInput.parse(raw);
  for(const locale of ["en","bn"] as const)for(const key of Object.keys(input.body[locale].copy))if(!Object.hasOwn(dictionaries[locale],key) || Array.isArray(input.body[locale].copy[key])!==Array.isArray(dictionaries[locale][key as keyof typeof dictionaries.en]))throw new HttpError(422,"UNKNOWN_CONTENT_FIELD");
  return serializable(async tx=>{
    await assertPublicIdentitySafe(tx,input);
    const old=input.id?await tx.contentEntry.findUnique({where:{id:input.id}}):await tx.contentEntry.findUnique({where:{kind_slug:{kind:input.kind,slug:input.slug}}});
    if(old&&old.revision!==input.revision)throw new HttpError(409,"STALE_REVISION");
    if(old&&(old.slug!==input.slug||old.kind!==input.kind))throw new HttpError(422,"CONTENT_IDENTITY_IMMUTABLE");
    const row=old?await tx.contentEntry.update({where:{id:old.id},data:{draft:input as Prisma.InputJsonValue,revision:{increment:1}}}):await tx.contentEntry.create({data:{kind:input.kind,slug:input.slug,draft:input as Prisma.InputJsonValue,revision:1}});
    await audit(tx,actorId,"content.draft.save","ContentEntry",row.id,{revision:row.revision});return row;
  });
}
export async function publishContent(actorId:string,id:string,revision:number,publish:boolean) {
  return serializable(async tx=>{
    const old=await tx.contentEntry.findUnique({where:{id}});if(!old||old.revision!==revision)throw new HttpError(409,"STALE_REVISION");
    const draft=contentInput.parse(old.draft);
    if(publish){await assertPublicIdentitySafe(tx,draft);await publicMediaReferences(tx,draft);}
    if(draft.kind==="PROJECT"&&(!draft.body.en.project||draft.body.en.project.slug!==draft.slug))throw new HttpError(422,"PROJECT_DETAILS_REQUIRED");
    if(draft.kind==="REVIEW"&&(!old.consentAt||!old.verifiedAt))throw new HttpError(422,"GENUINE_REVIEW_VERIFICATION_REQUIRED");
    await tx.contentRevision.create({data:{entryId:id,revision:old.revision,snapshot:draft as Prisma.InputJsonValue,actorId}});
    if(publish)for(const locale of ["en","bn"] as const)await tx.contentTranslation.upsert({where:{entryId_locale:{entryId:id,locale}},create:{entryId:id,locale,title:draft.title[locale],body:draft.body[locale] as Prisma.InputJsonValue,seo:draft.seo[locale]},update:{title:draft.title[locale],body:draft.body[locale] as Prisma.InputJsonValue,seo:draft.seo[locale]}});
    const row=await tx.contentEntry.update({where:{id},data:{status:publish?"PUBLISHED":"DRAFT",revision:{increment:1}}});
    await audit(tx,actorId,publish?"content.publish":"content.unpublish","ContentEntry",id,{revision:row.revision});return row;
  });
}
export async function saveCompany(actorId:string,raw:unknown,publish:boolean) {
  const input=companyInput.parse(raw);
  return serializable(async tx=>{
    const old=await tx.companySettings.findUnique({where:{id:"company"}});
    if(old&&old.revision!==input.revision)throw new HttpError(409,"STALE_REVISION");
    await assertPublicIdentitySafe(tx,input);if(publish)await publicMediaReferences(tx,input);
    const fields={name:input.name,contact:{address:input.address,phone:input.phone,email:input.email,whatsapp:input.whatsapp},logoVariants:{document:input.logo},socialLinks:input.socialLinks};
    if(!old&&!publish)throw new HttpError(422,"FIRST_COMPANY_REVISION_REQUIRES_PUBLISH");
    const row=old?await tx.companySettings.update({where:{id:"company"},data:{draft:input as Prisma.InputJsonValue,revision:{increment:1},...(publish?fields:{})}}):await tx.companySettings.create({data:{id:"company",...fields,draft:input as Prisma.InputJsonValue,branches:[],businessHours:{},quotationTerms:{},documentFooter:{},emailFooter:{},numberingPreferences:{}}});
    await audit(tx,actorId,publish?"company.publish":"company.draft.save","CompanySettings","company",{revision:row.revision});return row;
  });
}
export async function saveService(actorId:string,raw:unknown) {
  const input=serviceInput.parse(raw);
  return serializable(async tx=>{
    await assertPublicIdentitySafe(tx,input.editorial);
    const old=input.id?await tx.service.findUnique({where:{id:input.id}}):null;
    if(input.id&&(!old||old.revision!==input.revision))throw new HttpError(409,"STALE_REVISION");
    const row=old?await tx.service.update({where:{id:old.id},data:{draft:input.editorial as Prisma.InputJsonValue,revision:{increment:1},categoryId:input.categoryId}}):await tx.service.create({data:{slug:input.editorial.slug,categoryId:input.categoryId,draft:input.editorial as Prisma.InputJsonValue,revision:1,bookingConfiguration:{},translations:{create:[{locale:"en",name:input.editorial.name.en,description:input.editorial.description.en,scope:input.editorial.scope},{locale:"bn",name:input.editorial.name.bn,description:input.editorial.description.bn,scope:input.editorial.scope}]}}});
    await tx.productService.deleteMany({where:{serviceId:row.id}}); // replace relation set, never delete products
    if(input.relatedProductIds.length)await tx.productService.createMany({data:input.relatedProductIds.map(productId=>({serviceId:row.id,productId})),skipDuplicates:true});
    await audit(tx,actorId,"service.draft.save","Service",row.id,{revision:row.revision});return row;
  });
}
export async function publishService(actorId:string,id:string,revision:number,publish:boolean) {
  return serializable(async tx=>{
    const old=await tx.service.findUnique({where:{id},include:{category:true}});if(!old||old.revision!==revision)throw new HttpError(409,"STALE_REVISION");
    const draft=servicePublicSchema.parse(old.draft);
    if(publish)await assertPublicIdentitySafe(tx,draft);
    if(publish&&old.category.status!=="PUBLISHED")throw new HttpError(422,"PUBLISH_CATEGORY_FIRST");
    const row=await tx.service.update({where:{id},data:{revision:{increment:1},status:publish?"PUBLISHED":"DRAFT",...(publish?{slug:draft.slug,publicData:{...draft,status:"published"}}:{})}});
    await audit(tx,actorId,publish?"service.publish":"service.unpublish","Service",id,{revision:row.revision});return row;
  });
}
