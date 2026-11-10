import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {authorize,HttpError,serializable,audit} from '@/lib/server/security';
import {prisma} from '@/lib/prisma';
import {assertPublicIdentitySafe} from '@/lib/server/identity-privacy';
import {authConfiguration} from '@/lib/server/config';
import {sanitizeImage} from '@/lib/server/media-validation';
import {storageConfiguration,putObject,digest} from '@/lib/server/object-storage';
export async function POST(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 try{
  if(request.headers.get('origin')!==authConfiguration().baseURL)throw new HttpError(403,'ORIGIN_REJECTED');
  const actor=await authorize('media.create',request.headers);storageConfiguration();
  await serializable(async tx=>{const key=`upload:${actor.id}`,now=BigInt(Date.now()),row=await tx.rateLimit.findUnique({where:{key}});if(row&&now-row.lastRequest<BigInt(900000)&&row.count>=10)throw new HttpError(429,'UPLOAD_LIMIT_REACHED');await tx.rateLimit.upsert({where:{key},create:{key,count:1,lastRequest:now},update:!row||now-row.lastRequest>=BigInt(900000)?{count:1,lastRequest:now}:{count:{increment:1}}});});
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'FILE_REQUIRED');const chunks:Uint8Array[]=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>4*1024*1024){await reader.cancel();throw new HttpError(413,'UPLOAD_TOO_LARGE');}chunks.push(value);}}finally{reader.releaseLock();}
  const form=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('content-type')||''},body:Buffer.concat(chunks)}).formData(),file=form.get('file');if(!(file instanceof File))throw new HttpError(400,'FILE_REQUIRED');
  const alt=z.object({en:z.string().trim().min(1).max(500),bn:z.string().max(500)}).parse({en:form.get('altEn'),bn:form.get('altBn')||''});await assertPublicIdentitySafe(prisma,alt);
  const visibility=form.get('visibility')==='PUBLIC'?'PUBLIC':'PRIVATE';if(visibility==='PUBLIC')await authorize('media.publish',request.headers);
  let image;try{image=await sanitizeImage(Buffer.from(await file.arrayBuffer()),file.type);}catch{throw new HttpError(422,'SAFE_JPEG_PNG_OR_WEBP_REQUIRED');}
  const key=`images/${randomUUID()}.webp`,bucket=await putObject(key,image.data,'image/webp');
  const asset=await serializable(async tx=>{const row=await tx.mediaAsset.create({data:{objectKey:key,bucket,visibility,status:'READY',mimeType:'image/webp',bytes:image.data.length,sha256:digest(image.data),alt,width:image.info.width,height:image.info.height}});await audit(tx,actor.id,'media.upload','MediaAsset',row.id,{visibility,sanitized:true});return row;});
  return Response.json({id:asset.id,url:`/api/media/${asset.id}`,visibility},{status:201,headers});
 }catch(error){return Response.json({error:error instanceof HttpError?error.code:'STORAGE_UPLOAD_UNAVAILABLE'},{status:error instanceof HttpError?error.status:503,headers});}
}
