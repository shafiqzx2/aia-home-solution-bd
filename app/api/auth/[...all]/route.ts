import {getAuth} from "@/lib/server/auth";
import {businessEnabled} from "@/lib/server/config";
import {sensitiveSession} from "@/lib/server/sensitive-session";
import {HttpError,jsonBody,requireOrigin} from "@/lib/server/security";
const allowed=new Set(['/sign-in/email','/sign-out','/get-session','/list-sessions','/revoke-session','/revoke-other-sessions','/revoke-sessions','/change-password','/two-factor/enable','/two-factor/verify-totp','/two-factor/verify-backup-code','/two-factor/generate-backup-codes']);
async function handle(request:Request) {
  if(!businessEnabled())return Response.json({error:"AUTHENTICATION_NOT_CONFIGURED"},{status:503,headers:{"Cache-Control":"private, no-store"}});
  try {
    const path=new URL(request.url).pathname.replace(/^\/api\/auth/,'');
    if(!allowed.has(path))return Response.json({error:'ACCOUNT_ACTION_UNAVAILABLE'},{status:404,headers:{'Cache-Control':'private, no-store'}});
    if(['/change-password','/two-factor/generate-backup-codes'].includes(path)&&!await sensitiveSession(request.headers))return Response.json({error:'RECENT_PASSWORD_AND_MFA_REQUIRED'},{status:403,headers:{'Cache-Control':'private, no-store'}});
    if(request.method==='POST'){
      requireOrigin(request);const body=await jsonBody(request);
      if(path.startsWith('/two-factor/')&&(body.trustDevice||body.method==='otp'))return Response.json({error:'AUTHENTICATOR_REQUIRED'},{status:403});
      const headers=new Headers(request.headers);headers.delete('content-length');request=new Request(request.url,{method:request.method,headers,body:JSON.stringify(body)});
    }
    const response=await getAuth().handler(request);response.headers.set("Cache-Control","private, no-store");
    if(response.headers.get('content-type')?.includes('application/json')){
      const data=await response.json();
      if(data&&typeof data==='object'){
        delete data.token;
        if(data.session)delete data.session.token;
        if(data.user){delete data.user.email;delete data.user.emailVerified;}
        if(Array.isArray(data))for(const session of data)delete session.token;
      }
      response.headers.delete('content-length');return new Response(JSON.stringify(data),{status:response.status,headers:response.headers});
    }
    return response;
  }
  catch(error){return Response.json({error:error instanceof HttpError?error.code:"AUTHENTICATION_UNAVAILABLE"},{status:error instanceof HttpError?error.status:503,headers:{"Cache-Control":"private, no-store"}});}
}
export const GET=handle;
export const POST=handle;
