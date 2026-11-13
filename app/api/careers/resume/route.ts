import {uploadResume} from '@/lib/server/resume-upload';
import {HttpError} from '@/lib/server/security';
export async function POST(request:Request){try{return Response.json(await uploadResume(request),{status:201,headers:{'Cache-Control':'no-store'}});}catch(e){return Response.json({error:e instanceof HttpError?e.code:'UPLOAD_UNAVAILABLE'},{status:e instanceof HttpError?e.status:503,headers:{'Cache-Control':'no-store'}});}}
