import 'server-only';
import {createHash,createHmac,randomUUID,randomBytes} from 'node:crypto';
import {z} from 'zod';
import {authConfiguration} from './config';
import {serializable,audit,HttpError} from './security';
import {jobPublicSchema} from '@/lib/business/validation';
export const applicationInput=z.object({jobSlug:z.string().min(1).max(160),name:z.string().trim().min(2).max(160),email:z.email().max(254),phone:z.string().trim().min(7).max(40),experience:z.string().trim().min(30).max(12000),consent:z.literal(true),website:z.literal('').optional(),resumeUpload:z.boolean().optional(),idempotencyKey:z.uuid()}).strict();
export async function submitApplication(request:Request,raw:unknown){
 const input=applicationInput.parse(raw),hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
 const client=process.env.AIA_TRUSTED_IP_HEADER?request.headers.get(process.env.AIA_TRUSTED_IP_HEADER)||'unknown':'direct-client';
 const key='career:'+createHmac('sha256',authConfiguration().secret).update(client).digest('hex');
 return serializable(async tx=>{
  const receipt=async (row:{id:string;reference:string;resumeAssetId:string|null})=>{if(!input.resumeUpload)return {reference:row.reference};if(row.resumeAssetId)return {reference:row.reference,resumeUploaded:true};const token=randomBytes(32).toString('base64url');await tx.careerApplication.update({where:{id:row.id},data:{resumeUploadHash:createHash('sha256').update(token).digest('hex'),resumeUploadExpiresAt:new Date(Date.now()+600000)}});return {reference:row.reference,uploadToken:token};};
  const previous=await tx.careerApplication.findUnique({where:{idempotencyKey:input.idempotencyKey}});if(previous){if(previous.requestHash!==hash)throw new HttpError(409,'IDEMPOTENCY_CONFLICT');return receipt(previous);}
  const now=BigInt(Date.now()),window=BigInt(15*60000),limit=await tx.rateLimit.findUnique({where:{key}});if(limit&&now-limit.lastRequest<window&&limit.count>=5)throw new HttpError(429,'APPLICATION_LIMIT_REACHED');
  const entry=await tx.contentEntry.findUnique({where:{kind_slug:{kind:'CAREER',slug:input.jobSlug}},include:{translations:{where:{locale:'en'}}}});
  const body=entry?.translations[0]?.body as {job?:unknown}|undefined,job=jobPublicSchema.safeParse(body?.job);
  if(!entry||entry.status!=='PUBLISHED'||!job.success||!job.data.applicationsOpen)throw new HttpError(422,'APPLICATIONS_CLOSED');
  await tx.rateLimit.upsert({where:{key},create:{key,count:1,lastRequest:now},update:!limit||now-limit.lastRequest>=window?{count:1,lastRequest:now}:{count:{increment:1}}});
  const row=await tx.careerApplication.create({data:{reference:'APP-'+randomUUID().slice(0,18).toUpperCase(),idempotencyKey:input.idempotencyKey,requestHash:hash,jobId:entry.id,jobSnapshot:{slug:job.data.slug,title:job.data.title},name:input.name,email:input.email,phone:input.phone,experience:input.experience,consentAt:new Date()}});
  await audit(tx,null,'application.submit','CareerApplication',row.id,{jobId:entry.id});return receipt(row);
 });
}
