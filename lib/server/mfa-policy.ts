import 'server-only';
import {prisma} from '@/lib/prisma';
export async function mfaProof(sessionId:string,userId:string,recent=false){
 if(process.env.AIA_MFA_ENABLED!=='true')return false;
 const enrolled=await prisma.$queryRaw<{verified:boolean}[]>`SELECT t.verified FROM "TwoFactor" t JOIN "User" u ON u.id=t."userId" WHERE u.id=${userId} AND u."twoFactorEnabled"=true AND t.verified=true`;
 if(!enrolled.length)return false;
 const proof=await prisma.verification.findFirst({where:{identifier:`aia-mfa:${sessionId}`,value:userId,expiresAt:{gt:new Date()}},orderBy:{updatedAt:'desc'}});
 return !!proof&&(!recent||Date.now()-proof.updatedAt.getTime()<5*60*1000);
}
