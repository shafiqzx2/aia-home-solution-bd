import 'server-only';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {hasAccess,type AccessProfile} from '@/lib/business/access';
import {audit,HttpError,serializable} from './security';
export async function customerProfile(actor:AccessProfile,id:string){
 const customer=await prisma.customer.findUnique({where:{id},include:{addresses:true,organization:{include:{contacts:true}}}});
 if(!customer||customer.archivedAt)throw new HttpError(404,'CUSTOMER_NOT_FOUND');
 const [requests,quotations,sales,documents,activity]=await Promise.all([
  hasAccess(actor,'requests.view')?prisma.customerRequest.findMany({where:{customerId:id,archivedAt:null},select:{id:true,reference:true,status:true,kind:true,contactSnapshot:true,preferredAt:true},orderBy:{createdAt:'desc'},take:50}):null,
  hasAccess(actor,'quotations.view')?prisma.quotation.findMany({where:{customerId:id},select:{id:true,number:true,versions:{orderBy:{revision:'desc'},take:1,select:{status:true,total:true}}},orderBy:{createdAt:'desc'},take:50}):null,
  hasAccess(actor,'sales.view')?prisma.sale.findMany({where:{customerId:id,demoScope:null,state:'COMMITTED'},select:{id:true,reference:true,total:true,saleDate:true,...(hasAccess(actor,'payments.view')?{allocations:{select:{amount:true,payment:{select:{state:true,reference:true}}}}}:{})},orderBy:{saleDate:'desc'},take:50}):null,
  hasAccess(actor,'documents.view')?prisma.businessDocument.findMany({where:{customerId:id},select:{id:true,reference:true,kind:true},orderBy:{createdAt:'desc'},take:50}):null,
  prisma.auditLog.findMany({where:{entityType:'Customer',entityId:id,action:{in:['customer.followup','customer.create','customer.update','customer.archive']}},select:{id:true,action:true,metadata:true,createdAt:true},orderBy:{createdAt:'desc'},take:50}),
 ]);return {...customer,requests,quotations,sales,documents,activity};
}
export async function customerAction(actor:AccessProfile,id:string|undefined,action:string|undefined,raw:unknown){
 const input=z.object({id:z.string().optional(),name:z.string().trim().min(1).max(200).optional(),email:z.union([z.email(),z.literal('')]).optional(),phone:z.string().trim().max(40).optional(),expectedUpdatedAt:z.iso.datetime().optional(),note:z.string().trim().min(1).max(4000).optional(),dueAt:z.iso.datetime().optional(),address:z.object({id:z.string().optional(),label:z.string().trim().min(1).max(80),address:z.string().trim().min(1).max(2000)}).strict().optional()}).strict().parse(raw);
 return serializable(async tx=>{
  const customerId=id||input.id,old=customerId?await tx.customer.findUnique({where:{id:customerId}}):null;
  if(customerId&&(!old||old.updatedAt.toISOString()!==input.expectedUpdatedAt))throw new HttpError(409,'STALE_REVISION');
  if(old?.archivedAt)throw new HttpError(409,'CUSTOMER_ARCHIVED');
  if(action==='followup'&&!input.note)throw new HttpError(422,'NOTE_REQUIRED');
  if(action!=='archive'&&action!=='followup'&&!input.name)throw new HttpError(422,'CUSTOMER_NAME_REQUIRED');
  const row=old?await tx.customer.update({where:{id:old.id},data:action==='archive'?{archivedAt:new Date()}:action==='followup'?{updatedAt:new Date()}:{name:input.name,...(input.email!==undefined?{email:input.email||null}:{}),...(input.phone!==undefined?{phone:input.phone||null}:{})}}):await tx.customer.create({data:{name:input.name!,email:input.email||null,phone:input.phone||null}});
  if(input.address){if(action)throw new HttpError(422,'ADDRESS_ACTION_REJECTED');if(input.address.id){const address=await tx.customerAddress.findUnique({where:{id:input.address.id}});if(!address||address.customerId!==row.id)throw new HttpError(422,'ADDRESS_OWNER_MISMATCH');await tx.customerAddress.update({where:{id:address.id},data:{label:input.address.label,address:input.address.address}});}else await tx.customerAddress.create({data:{customerId:row.id,label:input.address.label,address:input.address.address}});}
  await audit(tx,actor.id,action==='followup'?'customer.followup':action==='archive'?'customer.archive':old?'customer.update':'customer.create','Customer',row.id,action==='followup'?{note:input.note!,dueAt:input.dueAt||null}:{});return row;
 });
}
export async function requestAction(actor:AccessProfile,id:string|undefined,action:string|undefined,raw:unknown){
 const input=z.object({id:z.string().optional(),expectedUpdatedAt:z.iso.datetime().optional(),status:z.enum(['PENDING_REVIEW','IN_REVIEW','AWAITING_CUSTOMER','SCHEDULED','COMPLETED','CANCELLED']).optional(),note:z.string().trim().min(1).max(4000).optional(),customerId:z.string().nullable().optional(),visit:z.object({id:z.string().optional(),kind:z.enum(['SITE_VISIT','OFFICE_VISIT']),status:z.enum(['PROPOSED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED']),scheduledAt:z.iso.datetime(),address:z.string().max(2000),latitude:z.number().min(-90).max(90).nullable().optional(),longitude:z.number().min(-180).max(180).nullable().optional(),locationConsent:z.boolean().optional()}).strict().refine(v=>(v.latitude===undefined&&v.longitude===undefined)||(v.latitude===null&&v.longitude===null)||(typeof v.latitude==='number'&&typeof v.longitude==='number'&&v.locationConsent===true),{message:'Both coordinates and location consent are required.'}).optional()}).strict().parse(raw);
 if(input.customerId&&!hasAccess(actor,'customers.view'))throw new HttpError(403,'CUSTOMER_ACCESS_REQUIRED');
 return serializable(async tx=>{
  const old=await tx.customerRequest.findUnique({where:{id:id||input.id||''}});if(!old||old.archivedAt)throw new HttpError(404,'REQUEST_NOT_FOUND');
  if(!input.expectedUpdatedAt||old.updatedAt.toISOString()!==input.expectedUpdatedAt)throw new HttpError(409,'STALE_REVISION');
  if(action==='note'&&!input.note)throw new HttpError(422,'NOTE_REQUIRED');
  if(action==='visit'&&!input.visit)throw new HttpError(422,'VISIT_REQUIRED');
  if(input.customerId){const customer=await tx.customer.findUnique({where:{id:input.customerId}});if(!customer||customer.archivedAt)throw new HttpError(422,'ACTIVE_CUSTOMER_REQUIRED');}
  if(input.note)await tx.requestNote.create({data:{requestId:old.id,authorId:actor.id,body:input.note}});
  if(input.visit){const visit=input.visit.id?await tx.visit.findUnique({where:{id:input.visit.id}}):null;if(input.visit.id&&visit?.requestId!==old.id)throw new HttpError(422,'VISIT_OWNER_MISMATCH');const data={kind:input.visit.kind,status:input.visit.status,scheduledAt:new Date(input.visit.scheduledAt),address:input.visit.address,...(input.visit.latitude!==undefined?{latitude:input.visit.latitude,longitude:input.visit.longitude,locationConsentAt:input.visit.latitude!==null?new Date():null}:{})};if(visit)await tx.visit.update({where:{id:visit.id},data});else await tx.visit.create({data:{...data,requestId:old.id}});}
  const row=await tx.customerRequest.update({where:{id:old.id},data:{updatedAt:new Date(),...(input.status?{status:input.status}:{}),...(input.customerId!==undefined?{customerId:input.customerId}:{})}});
  const event=await audit(tx,actor.id,action==='note'?'request.note.add':action==='visit'?'request.visit.save':'request.status.update','CustomerRequest',row.id,{status:row.status,customerId:row.customerId});
  if(input.status&&old.status!==input.status)await tx.requestStatusEvent.create({data:{requestId:row.id,status:row.status,auditId:event.id}});return row;
 });
}
