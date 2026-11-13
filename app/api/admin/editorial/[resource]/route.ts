import {revalidateTag} from 'next/cache';
import {ZodError} from 'zod';
import {prisma} from '@/lib/prisma';
import {authorize,requireOrigin,jsonBody,HttpError} from '@/lib/server/security';
import {editorialAction} from '@/lib/server/editorial';
import {redactIdentities} from '@/lib/business/identity-redaction';
import {privateIdentityEmails} from '@/lib/server/identity-privacy';
const headers={'Cache-Control':'private, no-store'};
async function handle(request:Request,{params}:{params:Promise<{resource:string}>}){try{const {resource}=await params;if(!['reviews','navigation'].includes(resource))throw new HttpError(404,'UNKNOWN_EDITOR');const actor=await authorize('content.view',request.headers);let result:unknown;if(request.method==='GET')result=await prisma.contentEntry.findMany({where:resource==='reviews'?{kind:'REVIEW'}:{kind:'PAGE',slug:'navigation'},orderBy:{updatedAt:'desc'},take:100});else{requireOrigin(request);result=await editorialAction(actor,resource,await jsonBody(request));revalidateTag('public-cms',{expire:0});}const safe=JSON.parse(JSON.stringify(result));return Response.json(actor.root?safe:redactIdentities(safe,await privateIdentityEmails(prisma)),{headers});}catch(e){return Response.json({error:e instanceof HttpError?e.code:e instanceof ZodError?'INVALID_INPUT':'EDITOR_UNAVAILABLE'},{status:e instanceof HttpError?e.status:e instanceof ZodError?422:503,headers});}}
export const GET=handle;export const POST=handle;
