import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {authorize,requireOrigin,jsonBody,HttpError,serializable,audit} from '@/lib/server/security';
import {issuedPreview} from '@/lib/server/commercial';
import {storageConfiguration,putObject,digest} from '@/lib/server/object-storage';
import {pdfBytes} from '@/lib/server/pdf-archive';
import {privateIdentityEmails} from '@/lib/server/identity-privacy';
export const maxDuration=60;
export async function POST(request:Request,{params}:{params:Promise<{resource:string;version:string}>}){
 const headers={'Cache-Control':'private, no-store'};
 try{requireOrigin(request);const {resource,version}=await params;if(!['quotations','documents'].includes(resource))throw new HttpError(404,'DOCUMENT_TYPE_REJECTED');const actor=await authorize(`${resource}.view`,request.headers);await authorize(`${resource}.export`,request.headers);const body=z.object({confirm:z.literal(true),locale:z.enum(['en','bn']).default('en')}).strict().parse(await jsonBody(request));storageConfiguration();
  const reference=resource==='quotations'?{quotationVersionId:version}:{documentVersionId:version},rendererVersion=`aia-a4-v2-${body.locale}`;
  const preview=await issuedPreview(resource,version,body.locale),rootOnly=(await privateIdentityEmails(prisma)).some(email=>preview.html.toLowerCase().includes(email.toLowerCase()));if(rootOnly&&!actor.root)throw new HttpError(403,'PROTECTED_DOCUMENT_REQUIRES_ROOT');
  const prior=await prisma.generatedDocument.findFirst({where:{...reference,rendererVersion,contentHash:preview.hash},include:{asset:true}});if(prior)return Response.json({id:prior.assetId,url:`/api/media/${prior.assetId}`},{headers});
  await serializable(async tx=>{const key=`archive:${actor.id}`,now=BigInt(Date.now()),row=await tx.rateLimit.findUnique({where:{key}});if(row&&now-row.lastRequest<BigInt(900000)&&row.count>=10)throw new HttpError(429,'ARCHIVE_LIMIT_REACHED');await tx.rateLimit.upsert({where:{key},create:{key,count:1,lastRequest:now},update:!row||now-row.lastRequest>=BigInt(900000)?{count:1,lastRequest:now}:{count:{increment:1}}});});
  const bytes=await pdfBytes(preview.html),objectKey=`documents/${randomUUID()}.pdf`,bucket=await putObject(objectKey,bytes,'application/pdf');
  const asset=await serializable(async tx=>{const row=await tx.mediaAsset.create({data:{objectKey,bucket,visibility:'PRIVATE',status:'READY',mimeType:'application/pdf',bytes:bytes.length,sha256:digest(bytes),alt:{en:'Issued document archive',bn:'',rootOnly}}});await tx.generatedDocument.create({data:{...reference,assetId:row.id,rendererVersion,contentHash:preview.hash}});await audit(tx,actor.id,'document.archive','MediaAsset',row.id,{version,resource,sha256:row.sha256});return row;});
  return Response.json({id:asset.id,url:`/api/media/${asset.id}`},{status:201,headers});
 }catch(error){return Response.json({error:error instanceof HttpError?error.code:'ARCHIVAL_UNAVAILABLE'},{status:error instanceof HttpError?error.status:503,headers});}
}
