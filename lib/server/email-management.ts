import 'server-only';
import {emailSendingConfigured} from '@/lib/business/email-provider';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {hasAccess,type AccessProfile} from '@/lib/business/access';
import {renderVariables} from '@/lib/business/contracts';
import {audit,serializable,HttpError} from './security';
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export async function saveEmailTemplate(actor:AccessProfile,raw:unknown){
 if(!hasAccess(actor,'email.manage'))throw new HttpError(403,'PERMISSION_DENIED');
 const input=z.object({key:z.string().regex(/^[a-z0-9-]{1,80}$/),revision:z.number().int().nonnegative(),locale:z.enum(['en','bn']),subject:z.string().trim().min(1).max(200).refine(v=>!/[\r\n]/.test(v)),body:z.string().trim().min(1).max(16000)}).strict().parse(raw);
 return serializable(async tx=>{const latest=await tx.emailTemplate.findFirst({where:{key:input.key,locale:input.locale},orderBy:{revision:'desc'}});if((latest?.revision||0)!==input.revision)throw new HttpError(409,'STALE_REVISION');const row=await tx.emailTemplate.create({data:{key:input.key,locale:input.locale,revision:input.revision+1,subject:input.subject,body:input.body}});await audit(tx,actor.id,'email.template.revise','EmailTemplate',row.id,{key:row.key,revision:row.revision});return row;});
}
export async function composeEmail(actor:AccessProfile,raw:unknown){
 if(!hasAccess(actor,'email.create'))throw new HttpError(403,'PERMISSION_DENIED');
 const input=z.object({templateId:z.string(),to:z.email().max(254),values:z.record(z.string().max(80),z.string().max(4000)),idempotencyKey:z.uuid()}).strict().parse(raw);
 return serializable(async tx=>{const template=await tx.emailTemplate.findUnique({where:{id:input.templateId}});if(!template||template.archivedAt)throw new HttpError(422,'TEMPLATE_UNAVAILABLE');
  let subject:string,body:string;try{subject=renderVariables(template.subject,input.values);body=renderVariables(template.body,input.values);}catch{throw new HttpError(422,'TEMPLATE_VARIABLES_REQUIRED');}if(!subject.trim()||subject.length>200||/[\r\n]/.test(subject)||body.length>32000)throw new HttpError(422,'INVALID_EMAIL_CONTENT');
  const html='<div style="white-space:pre-wrap">'+esc(body)+'</div>',company=await tx.companySettings.findUnique({where:{id:'company'}}),sender={from:company?.senderEmail||process.env.AIA_EMAIL_FROM||null,replyTo:company?.replyToEmail||null,templateId:template.id,templateRevision:template.revision};
  const duplicate=await tx.emailMessage.findUnique({where:{idempotencyKey:input.idempotencyKey},include:{recipients:true}});if(duplicate){if(duplicate.authorId!==actor.id||duplicate.subject!==subject||duplicate.html!==html||duplicate.recipients[0]?.address!==input.to)throw new HttpError(409,'IDEMPOTENCY_CONFLICT');return duplicate;}
  const row=await tx.emailMessage.create({data:{authorId:actor.id,subject,html,senderSnapshot:sender,idempotencyKey:input.idempotencyKey,recipients:{create:{kind:'TO',address:input.to}}}});await audit(tx,actor.id,'email.draft','EmailMessage',row.id,{templateId:template.id});return row;
 });
}
export async function reviewEmail(actor:AccessProfile,id:string,raw:unknown){
 if(!hasAccess(actor,'email.approve'))throw new HttpError(403,'PERMISSION_DENIED');const input=z.object({revision:z.number().int().positive(),confirm:z.literal(true)}).strict().parse(raw);
 return serializable(async tx=>{const old=await tx.emailMessage.findUnique({where:{id}});if(!old)throw new HttpError(404,'EMAIL_NOT_FOUND');if(old.revision!==input.revision||old.state!=='DRAFT')throw new HttpError(409,'STALE_REVISION');const event=await audit(tx,actor.id,'email.review','EmailMessage',id,{revision:old.revision});return tx.emailMessage.update({where:{id},data:{state:'REVIEWED',approvedRevision:old.revision,approvedByAuditId:event.id}});});
}
export async function emailHistory(){const rows=await prisma.emailMessage.findMany({include:{recipients:true,attempts:{orderBy:{attempt:'desc'},take:10}},orderBy:{createdAt:'desc'},take:50});const jobs=await prisma.outboxJob.findMany({where:{kind:'EMAIL_DELIVERY',idempotencyKey:{in:rows.map(r=>'email/'+r.id+'/r'+r.revision)}},select:{idempotencyKey:true,state:true,attempts:true,nextAttemptAt:true,lockedUntil:true}});const events=await prisma.providerWebhookEvent.findMany({where:{provider:'resend',messageId:{in:rows.flatMap(r=>r.providerMessageId?[r.providerMessageId]:[])}},select:{eventId:true,messageId:true,verifiedAt:true,processedAt:true,payload:true},orderBy:{verifiedAt:'desc'},take:200});return rows.map(row=>({...row,providerEvents:events.filter(e=>e.messageId===row.providerMessageId).map(e=>({eventId:e.eventId,type:(e.payload as {type:string}).type,verifiedAt:e.verifiedAt,processedAt:e.processedAt})),queue:jobs.find(job=>job.idempotencyKey==='email/'+row.id+'/r'+row.revision)||null,sendingEnabled:emailSendingConfigured(process.env)}));}
