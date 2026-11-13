import {ZodError} from 'zod';
import {businessEnabled} from '@/lib/server/config';
import {submitApplication} from '@/lib/server/career-applications';
import {requireOrigin,jsonBody,HttpError} from '@/lib/server/security';
export async function POST(request:Request){try{if(!businessEnabled())throw new HttpError(503,'APPLICATIONS_UNAVAILABLE');requireOrigin(request);return Response.json(await submitApplication(request,await jsonBody(request)),{headers:{'Cache-Control':'no-store'}});}catch(e){return Response.json({error:e instanceof HttpError?e.code:e instanceof ZodError?'INVALID_APPLICATION':'APPLICATIONS_UNAVAILABLE'},{status:e instanceof HttpError?e.status:e instanceof ZodError?422:503,headers:{'Cache-Control':'no-store'}});}}
