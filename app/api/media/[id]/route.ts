import {prisma} from '@/lib/prisma';
import {authorize,HttpError} from '@/lib/server/security';
import {getObject,digest} from '@/lib/server/object-storage';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
 try{const {id}=await params,asset=await prisma.mediaAsset.findUnique({where:{id},include:{documents:true,resumes:{select:{id:true}},creditNotes:{select:{id:true}}}});if(!asset||asset.status!=='READY'||asset.archivedAt)throw new HttpError(404,'FILE_NOT_FOUND');
  if(asset.resumes.length){await authorize('applications.view',request.headers);await authorize('applications.export',request.headers);}
  else if(asset.creditNotes.length){const actor=await authorize('returns.view',request.headers);await authorize('returns.export',request.headers);if((asset.alt as {rootOnly?:boolean}).rootOnly&&!actor.root)throw new HttpError(403,'ROOT_REQUIRED');}
  else if(asset.documents.length){const doc=asset.documents[0],scope=doc.quotationVersionId?'quotations':'documents',actor=await authorize(`${scope}.view`,request.headers);await authorize(`${scope}.export`,request.headers);if((asset.alt as {rootOnly?:boolean}).rootOnly&&!actor.root)throw new HttpError(403,'ROOT_REQUIRED');}
  else if(asset.visibility!=='PUBLIC')await authorize('media.view',request.headers);
  if(!['image/webp','image/png','image/jpeg','application/pdf','text/plain'].includes(asset.mimeType))throw new HttpError(404,'FILE_NOT_FOUND');
  const bytes=await getObject(asset.objectKey,asset.bucket);if(digest(bytes)!==asset.sha256)throw new HttpError(503,'FILE_INTEGRITY_FAILED');
  return new Response(new Uint8Array(bytes),{headers:{...headers,'Content-Type':asset.mimeType,'Content-Disposition':`${asset.mimeType==='application/pdf'||asset.mimeType==='text/plain'?'attachment':'inline'}; filename="${asset.id}.${asset.mimeType==='application/pdf'?'pdf':asset.mimeType==='text/plain'?'txt':'webp'}"`,'Content-Security-Policy':"default-src 'none'; sandbox"}});
 }catch(error){return Response.json({error:error instanceof HttpError?error.code:'FILE_UNAVAILABLE'},{status:error instanceof HttpError?error.status:503,headers});}
}
