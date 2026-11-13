import 'server-only';
import {randomUUID,createHash} from 'node:crypto';
import {prisma} from '@/lib/prisma';
import {authConfiguration} from './config';
import {audit,HttpError,serializable} from './security';
import {sanitizeImage} from './media-validation';
import {putObject,digest,storageConfiguration} from './object-storage';
export async function uploadResume(request:Request){
 if(request.headers.get('origin')!==authConfiguration().baseURL)throw new HttpError(403,'ORIGIN_REJECTED');
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw new HttpError(403,'UPLOAD_CAPABILITY_REQUIRED');
 const hash=createHash('sha256').update(token).digest('hex'),app=await prisma.careerApplication.findUnique({where:{resumeUploadHash:hash}});if(!app||app.resumeAssetId||!app.resumeUploadExpiresAt||app.resumeUploadExpiresAt<new Date())throw new HttpError(403,'UPLOAD_CAPABILITY_EXPIRED_OR_USED');storageConfiguration();
 await serializable(async tx=>{const key='resume:'+hash,now=BigInt(Date.now()),row=await tx.rateLimit.findUnique({where:{key}});if(row&&now-row.lastRequest<BigInt(900000)&&row.count>=5)throw new HttpError(429,'UPLOAD_LIMIT_REACHED');await tx.rateLimit.upsert({where:{key},create:{key,count:1,lastRequest:now},update:!row||now-row.lastRequest>=BigInt(900000)?{count:1,lastRequest:now}:{count:{increment:1}}});});
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'FILE_REQUIRED');const chunks:Uint8Array[]=[];let length=0;try{for(;;){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>4*1024*1024){await reader.cancel();throw new HttpError(413,'UPLOAD_TOO_LARGE');}chunks.push(value);}}finally{reader.releaseLock();}
 const form=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('content-type')||''},body:Buffer.concat(chunks)}).formData(),file=form.get('file');if(!(file instanceof File)||!file.size||file.size>3*1024*1024)throw new HttpError(422,'RESUME_FILE_REQUIRED');
 let bytes=Buffer.from(await file.arrayBuffer()),mime=file.type,extension:string,status:'READY'|'QUARANTINED'='READY';
 if(['image/jpeg','image/png','image/webp'].includes(mime)){try{bytes=(await sanitizeImage(bytes,mime)).data;}catch{throw new HttpError(422,'IMAGE_REJECTED');}mime='image/webp';extension='webp';}
 else if(mime==='text/plain'){let text:string;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new HttpError(422,'UTF8_TEXT_REQUIRED');}if(/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text)||text.trim().length<30)throw new HttpError(422,'TEXT_RESUME_REJECTED');bytes=Buffer.from(text);extension='txt';}
 else if(mime==='application/pdf'&&bytes.subarray(0,5).toString()==='%PDF-'&&bytes.subarray(-1024).includes(Buffer.from('%%EOF'))){extension='pdf';status='QUARANTINED';}
 else throw new HttpError(422,'TXT_PDF_OR_SAFE_IMAGE_REQUIRED');
 const objectKey='resumes/'+randomUUID()+'.'+extension,bucket=await putObject(objectKey,bytes,mime);
 await serializable(async tx=>{const current=await tx.careerApplication.findUnique({where:{id:app.id}});if(!current||current.resumeAssetId||current.resumeUploadHash!==hash||!current.resumeUploadExpiresAt||current.resumeUploadExpiresAt<new Date())throw new HttpError(409,'UPLOAD_ALREADY_USED');const asset=await tx.mediaAsset.create({data:{objectKey,bucket,mimeType:mime,status,visibility:'PRIVATE',bytes:bytes.length,sha256:digest(bytes),alt:{en:'Private recruitment resume',scan:status==='QUARANTINED'?'PENDING':'SANITIZED_OR_PLAIN_TEXT'}}});await tx.careerApplication.update({where:{id:app.id},data:{resumeAssetId:asset.id,resumeUploadHash:null,resumeUploadExpiresAt:null,revision:{increment:1}}});await audit(tx,null,'application.resume.upload','CareerApplication',app.id,{assetId:asset.id,status});});
 return {saved:true,status};
}
