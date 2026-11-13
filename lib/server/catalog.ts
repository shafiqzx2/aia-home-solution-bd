import {publicMediaReferences} from './media-validation';
import "server-only";
import {assertPublicIdentitySafe} from "./identity-privacy";
import {Prisma} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {hasAccess,type AccessProfile} from "@/lib/business/access";
import {productInput,categoryInput,productPublicSchema} from "@/lib/business/validation";
import {HttpError,serializable,audit} from "./security";
export async function listProducts(user:AccessProfile,page:number,query:string,filters:{status?:string;categoryId?:string}={}) {
  const where:Prisma.ProductWhereInput={...(filters.status==='ARCHIVED'?{status:'ARCHIVED'}:{archivedAt:null,...(['DRAFT','PUBLISHED'].includes(filters.status||'')?{status:filters.status as 'DRAFT'|'PUBLISHED'}:{})}),...(filters.categoryId?{categoryId:filters.categoryId}:{}),...(query?{OR:[{sku:{contains:query,mode:"insensitive"}},{translations:{some:{name:{contains:query,mode:"insensitive"}}}}]}:{})};
  const canPrice=hasAccess(user,"pricing.view");
  const [rows,total]=await Promise.all([prisma.product.findMany({where,take:20,skip:(page-1)*20,orderBy:[{sortOrder:"asc"},{id:"asc"}],include:{translations:true,category:{include:{translations:true}},...(hasAccess(user,'inventory.view')?{inventory:true}:{}),...(canPrice?{privatePrice:true}:{})}}),prisma.product.count({where})]);
  return {rows,total,page,pageSize:20};
}
export async function saveProduct(user:AccessProfile,raw:unknown) {
  const input=productInput.parse(raw);
  if(input.unitPrice!==undefined&&!hasAccess(user,input.id?"pricing.update":"pricing.create"))throw new HttpError(403,"PRIVATE_PRICE_PERMISSION_REQUIRED");
  return serializable(async tx=>{
    await assertPublicIdentitySafe(tx,input.editorial);
    const category=await tx.category.findUnique({where:{id:input.categoryId}});if(!category||category.status==="ARCHIVED")throw new HttpError(422,"CATEGORY_REQUIRED");
    const old=input.id?await tx.product.findUnique({where:{id:input.id}}):null;
    if(input.id&&(!old||old.revision!==input.revision))throw new HttpError(409,"STALE_REVISION");
    if(old?.archivedAt)throw new HttpError(409,'PRODUCT_ARCHIVED');
    const data={slug:old?.slug||input.editorial.slug,sku:input.sku,categoryId:input.categoryId,unit:input.unit,draft:{...input.editorial,category:category.slug} as Prisma.InputJsonValue,sortOrder:input.sortOrder,revision:(old?.revision||0)+1,contentKind:input.editorial.contentKind};
    const product=old?await tx.product.update({where:{id:old.id},data}):await tx.product.create({data:{...data,status:"DRAFT",translations:{create:[{locale:"en",name:input.editorial.name.en,description:input.editorial.description.en,specifications:input.editorial.specifications as Prisma.InputJsonValue},{locale:"bn",name:input.editorial.name.bn,description:input.editorial.description.bn,specifications:input.editorial.specifications as Prisma.InputJsonValue}]},inventory:{create:{quantity:0,reorderPoint:0}}}});
    if(input.unitPrice!==undefined)await tx.privateProductPrice.upsert({where:{productId:product.id},create:{productId:product.id,unitPrice:input.unitPrice},update:{unitPrice:input.unitPrice}});
    await audit(tx,user.id,old?"product.update":"product.create","Product",product.id,{revision:product.revision});return {id:product.id,revision:product.revision};
  });
}
export async function productState(user:AccessProfile,id:string,revision:number,state:"PUBLISHED"|"DRAFT"|"ARCHIVED") {
  return serializable(async tx=>{
    const old=await tx.product.findUnique({where:{id},include:{category:true}});if(!old||old.revision!==revision)throw new HttpError(409,"STALE_REVISION");
    if(old.archivedAt)throw new HttpError(409,'PRODUCT_ARCHIVED');
    const editorial=state==="PUBLISHED"?productPublicSchema.parse(old.draft):null;
    if(state==="PUBLISHED"&&old.category.status!=="PUBLISHED")throw new HttpError(422,"PUBLISH_CATEGORY_FIRST");
    if(editorial){await assertPublicIdentitySafe(tx,editorial);await publicMediaReferences(tx,editorial);}
    if(editorial)for(const locale of ["en","bn"] as const)await tx.productTranslation.upsert({where:{productId_locale:{productId:id,locale}},create:{productId:id,locale,name:editorial.name[locale],description:editorial.description[locale],specifications:editorial.specifications},update:{name:editorial.name[locale],description:editorial.description[locale],specifications:editorial.specifications}});
    const product=await tx.product.update({where:{id},data:{status:state,archivedAt:state==="ARCHIVED"?new Date():null,revision:{increment:1},...(editorial?{slug:editorial.slug,publicData:{...editorial,category:old.category.slug,status:"published"}}:{})}});
    await audit(tx,user.id,`product.${state.toLowerCase()}`,"Product",id,{revision:product.revision});return product;
  });
}
export async function saveCategory(user:AccessProfile,raw:unknown) {
  const input=categoryInput.parse(raw);if(input.publish&&!hasAccess(user,"categories.publish"))throw new HttpError(403,"PUBLISH_PERMISSION_REQUIRED");
  return serializable(async tx=>{
    const old=input.id?await tx.category.findUnique({where:{id:input.id}}):null;
    if(input.id&&(!old||old.revision!==input.revision))throw new HttpError(409,"STALE_REVISION");
    if(old?.status==='ARCHIVED')throw new HttpError(409,'CATEGORY_ARCHIVED');
    if(old?.status==="PUBLISHED"&&!hasAccess(user,"categories.publish"))throw new HttpError(403,"PUBLISH_PERMISSION_REQUIRED");
    await assertPublicIdentitySafe(tx,input);
    let ancestor=input.parentId;const visited=new Set([input.id]);
    while(ancestor){if(visited.has(ancestor))throw new HttpError(422,"CATEGORY_CYCLE");visited.add(ancestor);const p=await tx.category.findUnique({where:{id:ancestor},select:{parentId:true}});if(!p)throw new HttpError(422,"PARENT_NOT_FOUND");ancestor=p.parentId;}
    const data={slug:input.slug,parentId:input.parentId,status:input.publish?"PUBLISHED" as const:"DRAFT" as const,sortOrder:input.sortOrder,revision:(old?.revision||0)+1};
    const row=old?await tx.category.update({where:{id:old.id},data}):await tx.category.create({data});
    for(const locale of ["en","bn"] as const)await tx.categoryTranslation.upsert({where:{categoryId_locale:{categoryId:row.id,locale}},create:{categoryId:row.id,locale,name:input.name[locale],description:input.description[locale]},update:{name:input.name[locale],description:input.description[locale]}});
    await audit(tx,user.id,"category.save","Category",row.id,{revision:row.revision});return row;
  });
}
export async function archiveCategory(actor:AccessProfile,id:string,revision:number){
 return serializable(async tx=>{
  const old=await tx.category.findUnique({where:{id}});if(!old||old.revision!==revision)throw new HttpError(409,'STALE_REVISION');
  const [children,products,services]=await Promise.all([tx.category.count({where:{parentId:id,status:{not:'ARCHIVED'}}}),tx.product.count({where:{categoryId:id,archivedAt:null}}),tx.service.count({where:{categoryId:id,status:{not:'ARCHIVED'}}})]);
  if(children||products||services)throw new HttpError(422,'ARCHIVE_OR_MOVE_CATEGORY_CONTENT_FIRST');
  const row=await tx.category.update({where:{id},data:{status:'ARCHIVED',revision:{increment:1}}});await audit(tx,actor.id,'category.archive','Category',id,{revision:row.revision});return row;
 });
}
export async function adjustStock(user:AccessProfile,raw:unknown) {
  const {z}=await import("zod");const input=z.object({productId:z.string(),delta:z.union([z.number().int().min(-1000000).max(1000000),z.string().regex(/^-?(?:0|[1-9]\d{0,5})(?:\.\d{1,4})?$/)]).refine(v=>Number(v)!==0),reason:z.string().trim().min(5).max(500),idempotencyKey:z.uuid()}).strict().parse(raw);
  return serializable(async tx=>{
    const existing=await tx.stockMovement.findUnique({where:{idempotencyKey:input.idempotencyKey}});if(existing){if(existing.productId!==input.productId||!existing.quantityDelta.equals(input.delta)||existing.reason!==input.reason)throw new HttpError(409,"IDEMPOTENCY_CONFLICT");return existing;}
    const inventory=await tx.inventory.findUnique({where:{productId:input.productId},include:{product:{select:{archivedAt:true}}}});if(!inventory||inventory.product.archivedAt||inventory.quantity.add(input.delta).isNegative())throw new HttpError(422,"INSUFFICIENT_STOCK");
    const movement=await tx.stockMovement.create({data:{productId:input.productId,quantityDelta:input.delta,reason:input.reason,idempotencyKey:input.idempotencyKey}});
    await tx.inventory.update({where:{productId:input.productId},data:{quantity:{increment:input.delta}}});
    await audit(tx,user.id,"stock.adjust","StockMovement",movement.id,{productId:input.productId,delta:input.delta,reason:input.reason});return movement;
  });
}
