import "server-only";
import {twoFactor} from "better-auth/plugins";
import {createAuthMiddleware} from "better-auth/api";
import {betterAuth} from "better-auth";
import {prismaAdapter} from "@better-auth/prisma-adapter";
import {prisma} from "@/lib/prisma";
import {authConfiguration} from "./config";
function createAuth() {
  const config=authConfiguration();
  return betterAuth({
    ...config,
    appName:"AIA Home Solutions BD",
    logger:{disabled:true},
    plugins:process.env.AIA_MFA_ENABLED==="true"?[twoFactor({issuer:"AIA Home Solutions BD",skipVerificationOnEnable:false,trustDeviceMaxAge:0,accountLockout:{enabled:true,maxFailedAttempts:5,durationSeconds:900},backupCodeOptions:{storeBackupCodes:"encrypted"}})]:[],
    hooks:{after:createAuthMiddleware(async ctx=>{
      if(['/sign-in/email','/sign-out','/change-password','/two-factor/enable','/two-factor/generate-backup-codes'].includes(ctx.path)){
        const result=ctx.context.returned as {user?:{id:string};code?:string}|undefined;
        await prisma.auditLog.create({data:{actorId:result?.user?.id||ctx.context.session?.user.id||null,action:`auth.${ctx.path.slice(1).replaceAll('/','.')}`,entityType:'Authentication',entityId:'event',metadata:{failed:!!result?.code}}});
      }
      if(!["/two-factor/verify-totp","/two-factor/verify-backup-code"].includes(ctx.path))return;
      const result=ctx.context.returned as {token?:string;user?:{id:string}}|undefined;
      const token=ctx.context.newSession?.session.token||result?.token;
      const userId=ctx.context.newSession?.user.id||result?.user?.id;
      if(!token||!userId)return;
      const session=await prisma.session.findUnique({where:{token}});if(!session||session.userId!==userId)return;
      await prisma.verification.deleteMany({where:{identifier:`aia-mfa:${session.id}`}});
      await prisma.verification.create({data:{identifier:`aia-mfa:${session.id}`,value:session.userId,expiresAt:session.expiresAt}});
      await prisma.auditLog.create({data:{actorId:session.userId,action:"auth.mfa.verified",entityType:"Session",entityId:session.id,metadata:{method:ctx.path.endsWith("verify-totp")?"TOTP":"RECOVERY_CODE"}}});
    })},
    database:prismaAdapter(prisma,{provider:"postgresql",transaction:true}),
    trustedOrigins:[config.baseURL],
    user:{fields:{name:"displayName"}},
    emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:12,maxPasswordLength:128,revokeSessionsOnPasswordReset:true},
    session:{freshAge:300,expiresIn:60*60*12,updateAge:60*30,cookieCache:{enabled:false}},
    rateLimit:{enabled:true,storage:"database",window:60,max:30,customRules:{"/sign-in/email":{window:60,max:5}}},
    advanced:{useSecureCookies:config.baseURL.startsWith("https:"),ipAddress:{ipAddressHeaders:process.env.AIA_TRUSTED_IP_HEADER?[process.env.AIA_TRUSTED_IP_HEADER]:[]}},
    databaseHooks:{session:{create:{before:async session=>{
      const user=await prisma.user.findUnique({where:{id:session.userId},select:{disabledAt:true}});
      if(!user||user.disabledAt)return false;
      return {data:session};
    }}}},
  });
}

let instance:ReturnType<typeof createAuth>|undefined;
export function getAuth(){return instance??=createAuth();}
