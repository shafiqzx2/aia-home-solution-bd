import {createHash} from 'node:crypto';
import {generateRandomString,symmetricEncrypt,symmetricDecrypt} from 'better-auth/crypto';
import {z} from 'zod';
import {getAuth} from '@/lib/server/auth';
import {authConfiguration} from '@/lib/server/config';
import {principal,requireOrigin,jsonBody,HttpError,serializable,audit} from '@/lib/server/security';
import {sensitiveSession} from '@/lib/server/sensitive-session';
import {mfaProof} from '@/lib/server/mfa-policy';
import {base32,verifyAuthenticator} from '@/lib/business/totp';
const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'};
const hash=(secret:string)=>createHash('sha256').update(secret).digest('hex');
export async function POST(request:Request){
 try{
  requireOrigin(request);const body=z.discriminatedUnion('phase',[z.object({phase:z.literal('begin'),confirm:z.literal(true)}).strict(),z.object({phase:z.literal('finish'),code:z.string().regex(/^\d{6}$/),savedRecoveryCodes:z.literal(true)}).strict()]).parse(await jsonBody(request));
  const actor=await principal(request.headers),session=await getAuth().api.getSession({headers:request.headers,query:{disableCookieCache:true}});
  if(!actor||!session||!await mfaProof(session.session.id,actor.id))throw new HttpError(403,'VERIFIED_MFA_SESSION_REQUIRED');
  if(body.phase==='begin'&&!await sensitiveSession(request.headers))throw new HttpError(403,'RECENT_PASSWORD_AND_MFA_REQUIRED');
  const key=authConfiguration().secret,identifier=`aia-mfa-rotation:${actor.id}`;
  await serializable(async tx=>{const limitKey=`mfa-rotation:${actor.id}`,now=BigInt(Date.now()),limit=await tx.rateLimit.findUnique({where:{key:limitKey}});if(limit&&now-limit.lastRequest<BigInt(900000)&&limit.count>=10)throw new HttpError(429,'TRY_AGAIN_LATER');await tx.rateLimit.upsert({where:{key:limitKey},create:{key:limitKey,count:1,lastRequest:now},update:!limit||now-limit.lastRequest>=BigInt(900000)?{count:1,lastRequest:now}:{count:{increment:1}}});});
  const result=await serializable(async tx=>{
   const factor=await tx.twoFactor.findUnique({where:{userId:actor.id}});if(!factor?.verified)throw new HttpError(403,'EXISTING_FACTOR_REQUIRED');
   if(body.phase==='begin'){
    const secret=generateRandomString(32),codes=Array.from({length:10},()=>generateRandomString(20,'a-z','A-Z','0-9'));
    const value=await symmetricEncrypt({key,data:JSON.stringify({sessionId:session.session.id,oldHash:hash(factor.secret),secret,codes})});
    await tx.verification.deleteMany({where:{identifier}});await tx.verification.create({data:{identifier,value,expiresAt:new Date(Date.now()+600000)}});
    await audit(tx,actor.id,'auth.mfa.rotation.prepared','Authentication',actor.id);
    return {totpURI:`otpauth://totp/AIA%20Home%20Solutions%20BD:Admin?secret=${base32(Buffer.from(secret))}&issuer=AIA%20Home%20Solutions%20BD&digits=6&period=30`,backupCodes:codes};
   }
   const pending=await tx.verification.findFirst({where:{identifier,expiresAt:{gt:new Date()}}});if(!pending)throw new HttpError(409,'ROTATION_EXPIRED');
   const staged=JSON.parse(await symmetricDecrypt({key,data:pending.value})) as {sessionId:string;oldHash:string;secret:string;codes:string[]};
   if(staged.sessionId!==session.session.id||staged.oldHash!==hash(factor.secret))throw new HttpError(409,'ROTATION_SESSION_CHANGED');
   if(!verifyAuthenticator(staged.secret,body.code))throw new HttpError(403,'VERIFICATION_FAILED');
   await tx.twoFactor.update({where:{userId:actor.id},data:{secret:await symmetricEncrypt({key,data:staged.secret}),backupCodes:await symmetricEncrypt({key,data:JSON.stringify(staged.codes)}),verified:true}});
   await tx.session.deleteMany({where:{userId:actor.id}});
   await tx.verification.deleteMany({where:{OR:[{identifier},{value:actor.id,identifier:{startsWith:'aia-mfa:'}},{value:actor.id,identifier:{startsWith:'aia-sensitive:'}}]}});
   await audit(tx,actor.id,'auth.mfa.rotation.completed','Authentication',actor.id,{sessionsRevoked:true});return {rotated:true,signedOut:true};
  });
  return Response.json(result,{headers});
 }catch(error){return Response.json({error:error instanceof HttpError?error.code:'ROTATION_FAILED'},{status:error instanceof HttpError?error.status:400,headers});}
}
