import "server-only";
import {createHash,createHmac,randomUUID} from "node:crypto";
import {inquiryInput} from "@/lib/business/validation";
import {validPreferredDate} from "@/lib/request-validation";
import {serializable,HttpError,audit} from "./security";
import {authConfiguration} from "./config";
export async function submitInquiry(request:Request,raw:unknown) {
  const input=inquiryInput.parse(raw);
  if(input.preferredDate&&!validPreferredDate(input.preferredDate))throw new HttpError(422,"INVALID_PREFERRED_DATE");
  const secret=authConfiguration().secret;
  const client=process.env.AIA_TRUSTED_IP_HEADER?request.headers.get(process.env.AIA_TRUSTED_IP_HEADER)||"unknown":"direct-client";
  const key="inquiry:"+createHmac("sha256",secret).update(client).digest("hex");
  const hash=createHash("sha256").update(JSON.stringify(input)).digest("hex");
  return serializable(async tx=>{
    const previous=await tx.customerRequest.findUnique({where:{idempotencyKey:input.idempotencyKey}});
    if(previous){const snapshot=previous.contactSnapshot as {requestHash?:string};if(snapshot.requestHash!==hash)throw new HttpError(409,"IDEMPOTENCY_CONFLICT");return {reference:previous.reference,status:previous.status};}
    const now=BigInt(Date.now()),window=BigInt(15*60*1000),limit=await tx.rateLimit.findUnique({where:{key}});
    if(limit&&now-limit.lastRequest<window&&limit.count>=10)throw new HttpError(429,"REQUEST_LIMIT_REACHED");
    await tx.rateLimit.upsert({where:{key},create:{key,count:1,lastRequest:now},update:!limit||now-limit.lastRequest>=window?{count:1,lastRequest:now}:{count:{increment:1}}});
    const products=await tx.product.findMany({where:{slug:{in:input.items.map(i=>i.slug)},status:"PUBLISHED",category:{status:"PUBLISHED"}},select:{id:true,slug:true,publicData:true}});
    if(products.length!==new Set(input.items.map(i=>i.slug)).size)throw new HttpError(422,"SHORTLIST_PRODUCT_UNAVAILABLE");
    const serviceSlugs=[...new Set([...(input.serviceSlugs||[]),...(input.serviceSlug?[input.serviceSlug]:[])])];
    const services=await tx.service.findMany({where:{slug:{in:serviceSlugs},status:"PUBLISHED",category:{status:"PUBLISHED"}},select:{id:true,publicData:true}});
    if(services.length!==serviceSlugs.length)throw new HttpError(422,"SERVICE_UNAVAILABLE");
    const guest=await tx.guestIdentity.create({data:{name:input.name,email:input.email||null,phone:input.phone}});
    const row=await tx.customerRequest.create({data:{reference:`REQ-${new Date().getUTCFullYear()}-${randomUUID().replaceAll("-","").slice(0,12).toUpperCase()}`,idempotencyKey:input.idempotencyKey,kind:input.kind,status:"PENDING_REVIEW",guestId:guest.id,contactSnapshot:{name:input.name,email:input.email,phone:input.phone,address:input.address,preferredCommunication:input.preferredCommunication,requestHash:hash,consentAt:new Date().toISOString()},requirements:input.requirements,preferredAt:input.preferredDate?new Date(input.preferredDate+"T00:00:00Z"):null,items:{create:[...input.items.map(i=>{const p=products.find(p=>p.slug===i.slug)!;return {productId:p.id,quantity:i.quantity,descriptionSnapshot:p.publicData||{slug:p.slug}};}),...services.map(service=>({serviceId:service.id,quantity:1,descriptionSnapshot:service.publicData||{}}))]}}});
    const event=await audit(tx,null,"request.created","CustomerRequest",row.id,{reference:row.reference});
    await tx.requestStatusEvent.create({data:{requestId:row.id,status:"PENDING_REVIEW",auditId:event.id}});
    return {reference:row.reference,status:row.status};
  });
}
