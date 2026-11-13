import {createHash,timingSafeEqual} from 'node:crypto';
import {runEmailWorker} from '@/lib/server/email-queue';
import {HttpError} from '@/lib/server/security';
export async function POST(request:Request){try{const expected=process.env.AIA_EMAIL_WORKER_SECRET,actual=request.headers.get('authorization')||'';if(!expected||expected.length<32||!timingSafeEqual(createHash('sha256').update(actual).digest(),createHash('sha256').update('Bearer '+expected).digest()))throw new HttpError(401,'WORKER_AUTHENTICATION_REQUIRED');return Response.json(await runEmailWorker(),{headers:{'Cache-Control':'no-store'}});}catch(e){return Response.json({error:e instanceof HttpError?e.code:'WORKER_UNAVAILABLE'},{status:e instanceof HttpError?e.status:503,headers:{'Cache-Control':'no-store'}});}}
