import type {Prisma,PrismaClient} from '@prisma/client';
import {DeliveryError,type DeliveryProvider} from './email-provider.ts';
type Tx=Prisma.TransactionClient;
async function atomic<T>(db:PrismaClient,fn:(tx:Tx)=>Promise<T>):Promise<T>{for(let n=0;;n++)try{return await db.$transaction(fn,{isolationLevel:'Serializable',timeout:15000});}catch(e){if(n<2&&e&&typeof e==='object'&&'code' in e&&e.code==='P2034')continue;throw e;}}
export async function reconcileDelivery(tx:Tx,providerId:string){
 const email=await tx.emailMessage.findUnique({where:{providerMessageId:providerId}});if(!email)return;
 const events=await tx.providerWebhookEvent.findMany({where:{provider:'resend',messageId:providerId,processedAt:null},orderBy:{verifiedAt:'asc'}});let state=email.state;
 for(const event of events){const type=(event.payload as {type:string}).type;if(type==='email.delivered')state='DELIVERED';else if(['email.bounced','email.failed'].includes(type)&&state!=='DELIVERED')state='FAILED';await tx.providerWebhookEvent.update({where:{id:event.id},data:{processedAt:new Date()}});await tx.auditLog.create({data:{actorId:null,action:'email.provider_event',entityType:'EmailMessage',entityId:email.id,metadata:{eventId:event.eventId,type}}});}
 if(state!==email.state)await tx.emailMessage.update({where:{id:email.id},data:{state}});
}
export async function processEmailJob(db:PrismaClient,provider:DeliveryProvider,clock:()=>Date=()=>new Date(),jobId?:string){
 const claimed=await atomic(db,async tx=>{
  const now=clock(),job=await tx.outboxJob.findFirst({where:{...(jobId?{id:jobId}:{}),kind:'EMAIL_DELIVERY',OR:[{state:'PENDING',nextAttemptAt:{lte:now}},{state:'RUNNING',lockedUntil:{lt:now}}]},orderBy:{createdAt:'asc'}});if(!job)return null;
  const payload=job.payload as {emailId:string;revision:number;firstAttemptAt?:string},email=await tx.emailMessage.findUnique({where:{id:payload.emailId},include:{recipients:true}});
  if(!email||email.revision!==payload.revision||email.approvedRevision!==email.revision||!email.approvedByAuditId||!['QUEUED','REVIEWED'].includes(email.state)){await tx.outboxJob.update({where:{id:job.id},data:{state:'FAILED',lockedUntil:null}});return null;}
  if(job.attempts>=6||(payload.firstAttemptAt&&now.getTime()-Date.parse(payload.firstAttemptAt)>23*3600000)){await tx.outboxJob.update({where:{id:job.id},data:{state:'FAILED',lockedUntil:null}});await tx.emailMessage.update({where:{id:email.id},data:{state:'FAILED'}});await tx.auditLog.create({data:{actorId:null,action:'email.reconciliation_required',entityType:'EmailMessage',entityId:email.id,metadata:{reason:'RETRY_OR_IDEMPOTENCY_WINDOW_EXHAUSTED'}}});return null;}
  if(job.state==='RUNNING')await tx.deliveryAttempt.updateMany({where:{emailId:email.id,attempt:job.attempts,state:'QUEUED'},data:{state:'FAILED',errorCode:'LEASE_EXPIRED_DELIVERY_UNCERTAIN'}});
  const attempt=job.attempts+1;await tx.outboxJob.update({where:{id:job.id},data:{state:'RUNNING',attempts:attempt,lockedUntil:new Date(now.getTime()+120000),payload:{...payload,firstAttemptAt:payload.firstAttemptAt||now.toISOString()}}});await tx.deliveryAttempt.create({data:{emailId:email.id,attempt,state:'QUEUED'}});return {job,email,attempt};
 });
 if(!claimed)return {processed:false};const {job,email,attempt}=claimed,sender=email.senderSnapshot as {from?:string;replyTo?:string};let providerId:string|undefined,failure:DeliveryError|undefined;
 try{providerId=(await provider.send({id:email.id,revision:email.revision,subject:email.subject,html:email.html,from:sender.from||null,replyTo:sender.replyTo||null,to:email.recipients.filter(r=>r.kind==='TO').map(r=>r.address),cc:email.recipients.filter(r=>r.kind==='CC').map(r=>r.address),bcc:email.recipients.filter(r=>r.kind==='BCC').map(r=>r.address)},job.idempotencyKey)).providerId;}catch(e){failure=e instanceof DeliveryError?e:new DeliveryError('PROVIDER_UNCERTAIN',true);}
 await atomic(db,async tx=>{const current=await tx.outboxJob.findUnique({where:{id:job.id}});if(!current||current.state!=='RUNNING'||current.attempts!==attempt)return;const retry=!!failure?.retryable&&attempt<6,next=new Date(clock().getTime()+[60,300,900,3600,10800,10800][attempt-1]*1000);
  await tx.outboxJob.update({where:{id:job.id},data:{state:providerId?'SUCCEEDED':retry?'PENDING':'FAILED',lockedUntil:null,nextAttemptAt:next}});await tx.deliveryAttempt.update({where:{emailId_attempt:{emailId:email.id,attempt}},data:{state:providerId?'ACCEPTED':'FAILED',providerId:providerId||null,errorCode:failure?.code||null}});await tx.emailMessage.update({where:{id:email.id},data:{state:providerId?'ACCEPTED':retry?'QUEUED':'FAILED',...(providerId?{providerMessageId:providerId}:{})}});await tx.auditLog.create({data:{actorId:null,action:providerId?'email.accepted':retry?'email.retry_scheduled':'email.failed',entityType:'EmailMessage',entityId:email.id,metadata:{attempt,errorCode:failure?.code||null}}});if(providerId)await reconcileDelivery(tx,providerId);
 });
 return {processed:true,accepted:!!providerId};
}
