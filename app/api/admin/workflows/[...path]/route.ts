import {queueEmail,cancelQueuedEmail} from '@/lib/server/email-queue';
import {issueCreditNote} from '@/lib/server/credit-notes';
import {ZodError} from 'zod';
import {prisma} from '@/lib/prisma';
import {authorize,requireOrigin,jsonBody,HttpError} from '@/lib/server/security';
import {privateIdentityEmails} from '@/lib/server/identity-privacy';
import {redactIdentities} from '@/lib/business/identity-redaction';
import {hasAccess} from '@/lib/business/access';
import {taskWhere,taskAssignees,saveTask,updateApplication} from '@/lib/server/workflow-management';
import {createReturn,returnAction,recordRefund} from '@/lib/server/returns';
import {saveEmailTemplate,composeEmail,reviewEmail,emailHistory} from '@/lib/server/email-management';
export const maxDuration=60;
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'};
async function handle(request:Request,{params}:{params:Promise<{path:string[]}>}){
 try{
  const [resource,id,action,...extra]=(await params).path,url=new URL(request.url),get=request.method==='GET';
  if(!['tasks','applications','returns','templates','email'].includes(resource)||extra.length)throw new HttpError(404,'UNKNOWN_WORKFLOW');
  const source=resource==='templates'?'email':resource,actor=await authorize(source+'.view',request.headers);
  if(!get){if(request.method!=='POST')throw new HttpError(405,'POST_REQUIRED');requireOrigin(request);}
  const page=Math.max(1,Math.min(10000,Number(url.searchParams.get('page'))||1)),skip=(Math.floor(page)-1)*20,q=(url.searchParams.get('q')||'').slice(0,160),state=(url.searchParams.get('state')||'').slice(0,40);let result:unknown;
  if(get){
   if(action&&action!=='history')throw new HttpError(404,'UNKNOWN_ACTION');
   if(resource==='tasks'){
    if(id==='assignees'){if(action)throw new HttpError(404,'UNKNOWN_ACTION');result=await taskAssignees(actor);}
    else if(id){const row=await prisma.internalTask.findFirst({where:{id,...taskWhere(actor)}});if(!row)throw new HttpError(404,'TASK_NOT_FOUND');result=action==='history'?await prisma.auditLog.findMany({where:{entityType:'InternalTask',entityId:id},select:{id:true,action:true,metadata:true,createdAt:true},orderBy:{createdAt:'desc'},take:50}):row;}
    else result=await prisma.internalTask.findMany({where:{AND:[taskWhere(actor),{archivedAt:null,...(state?{state}:{}),...(q?{title:{contains:q,mode:'insensitive'}}:{})}]},orderBy:[{createdAt:'desc'},{id:'asc'}],skip,take:20});
   }else if(resource==='applications'){
    if(id){const row=await prisma.careerApplication.findUnique({where:{id},include:{resumeAsset:{select:{status:true,mimeType:true}}}});if(!row)throw new HttpError(404,'APPLICATION_NOT_FOUND');result=action==='history'?await prisma.auditLog.findMany({where:{entityType:'CareerApplication',entityId:id},select:{id:true,action:true,metadata:true,createdAt:true},orderBy:{createdAt:'desc'},take:50}):row;}
    else result=await prisma.careerApplication.findMany({include:{resumeAsset:{select:{status:true,mimeType:true}}},where:{...(state?{state}:{}),...(q?{OR:[{name:{contains:q,mode:'insensitive'}},{reference:{contains:q,mode:'insensitive'}}]}:{})},orderBy:{createdAt:'desc'},skip,take:20});
   }else if(resource==='returns'){
    await authorize('sales.view',request.headers);if(id||action)throw new HttpError(404,'UNKNOWN_ACTION');
    result=await prisma.saleReturn.findMany({where:{...(state?{state}:{}),...(q?{OR:[{reference:{contains:q,mode:'insensitive'}},{saleId:q}]}:{})},include:{creditNotes:{select:{id:true,number:true,locale:true,assetId:true}},items:{include:{saleItem:{select:{snapshot:true}}}},...(hasAccess(actor,'payments.view')?{refunds:true}:{})},orderBy:{createdAt:'desc'},skip,take:20});
   }else if(resource==='templates'){if(id||action)throw new HttpError(404,'UNKNOWN_ACTION');result=await prisma.emailTemplate.findMany({where:{archivedAt:null},orderBy:[{key:'asc'},{revision:'desc'}],take:200});}
   else{if(id||action)throw new HttpError(404,'UNKNOWN_ACTION');result=await emailHistory();}
  }else{
   const body=await jsonBody(request);
   if(resource==='tasks'&&!action)result=await saveTask(actor,id,body);
   else if(resource==='applications'&&id&&!action)result=await updateApplication(actor,id,body);
   else if(resource==='returns'){if(!id&&!action)result=await createReturn(actor,body);else if(id&&['approve','post','cancel'].includes(action))result=await returnAction(actor,id,action,body);else if(id&&action==='credit-note')result=await issueCreditNote(actor,id,body);else if(id&&action==='refund')result=await recordRefund(actor,id,body);else throw new HttpError(404,'UNKNOWN_ACTION');}
   else if(resource==='templates'&&!id&&!action)result=await saveEmailTemplate(actor,body);
   else if(resource==='email'&&!id&&!action)result=await composeEmail(actor,body);
   else if(resource==='email'&&id&&action==='cancel'){if(body.confirm!==true||Object.keys(body).length!==1)throw new HttpError(422,'CONFIRMATION_REQUIRED');result=await cancelQueuedEmail(actor,id);}
   else if(resource==='email'&&id&&action==='review')result=await reviewEmail(actor,id,body);
   else if(resource==='email'&&id&&action==='dispatch'){if(body.confirm!==true||Object.keys(body).length!==1)throw new HttpError(422,'CONFIRMATION_REQUIRED');result=await queueEmail(actor,id);}
   else throw new HttpError(404,'UNKNOWN_ACTION');
  }
  if(resource==='applications'){const items=Array.isArray(result)?result:[result];for(const item of items)if(item&&typeof item==='object'){delete (item as Record<string,unknown>).resumeUploadHash;delete (item as Record<string,unknown>).resumeUploadExpiresAt;}}
  let safe=JSON.parse(JSON.stringify(result));if(!actor.root)safe=redactIdentities(safe,await privateIdentityEmails(prisma));return Response.json(safe,{headers});
 }catch(e){return Response.json({error:e instanceof HttpError?e.code:e instanceof ZodError?'INVALID_INPUT':'WORKFLOW_UNAVAILABLE'},{status:e instanceof HttpError?e.status:e instanceof ZodError?422:503,headers});}
}
export const GET=handle;export const POST=handle;
