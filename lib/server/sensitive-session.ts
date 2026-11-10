import 'server-only';
import {getAuth} from './auth';
import {prisma} from '@/lib/prisma';
export async function sensitiveSession(headers:Headers){
 const session=await getAuth().api.getSession({headers,query:{disableCookieCache:true}});if(!session)return false;
 return !!await prisma.verification.findFirst({where:{identifier:`aia-sensitive:${session.session.id}`,value:session.user.id,expiresAt:{gt:new Date()}}});
}
