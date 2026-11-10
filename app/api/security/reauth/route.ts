import {verifyPassword} from 'better-auth/crypto';
import {z} from 'zod';
import {getAuth} from '@/lib/server/auth';
import {prisma} from '@/lib/prisma';
import {jsonBody,requireOrigin,HttpError,serializable} from '@/lib/server/security';
export async function POST(request:Request){
 const headers={'Cache-Control':'private, no-store'};
 try{
  requireOrigin(request);const input=z.object({password:z.string().min(12).max(128),code:z.string().regex(/^\d{6}$/)}).strict().parse(await jsonBody(request));
  const session=await getAuth().api.getSession({headers:request.headers,query:{disableCookieCache:true}});if(!session)throw new HttpError(401,'AUTHENTICATION_REQUIRED');
  await serializable(async tx=>{const key=`reauth:${session.user.id}`,now=BigInt(Date.now()),limit=await tx.rateLimit.findUnique({where:{key}});if(limit&&now-limit.lastRequest<BigInt(900000)&&limit.count>=5)throw new HttpError(429,'TRY_AGAIN_LATER');await tx.rateLimit.upsert({where:{key},create:{key,count:1,lastRequest:now},update:!limit||now-limit.lastRequest>=BigInt(900000)?{count:1,lastRequest:now}:{count:{increment:1}}});});
  const account=await prisma.account.findUnique({where:{providerId_accountId:{providerId:'credential',accountId:session.user.id}}});
  if(!account?.password||!await verifyPassword({hash:account.password,password:input.password}))throw new HttpError(403,'VERIFICATION_FAILED');
  const forwarded=new Headers(request.headers);forwarded.delete('content-length');
  const result=await getAuth().handler(new Request(new URL('/api/auth/two-factor/verify-totp',request.url),{method:'POST',headers:forwarded,body:JSON.stringify({code:input.code,trustDevice:false})}));
  if(!result.ok)throw new HttpError(403,'VERIFICATION_FAILED');
  await prisma.verification.deleteMany({where:{identifier:`aia-sensitive:${session.session.id}`}});
  await prisma.verification.create({data:{identifier:`aia-sensitive:${session.session.id}`,value:session.user.id,expiresAt:new Date(Date.now()+300000)}});
  await prisma.auditLog.create({data:{actorId:session.user.id,action:'auth.sensitive.reauthenticated',entityType:'Session',entityId:session.session.id,metadata:{}}});
  return Response.json({verified:true},{headers});
 }catch(error){return Response.json({error:error instanceof HttpError?error.code:'VERIFICATION_FAILED'},{status:error instanceof HttpError?error.status:403,headers});}
}
