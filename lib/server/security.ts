import "server-only";
import {headers} from "next/headers";
import {Prisma} from "@prisma/client";
import {prisma} from "@/lib/prisma";
import {effectiveScopes,hasAccess,type AccessProfile} from "@/lib/business/access";
import {businessEnabled,authConfiguration} from "./config";
import {mfaProof} from "./mfa-policy";
import {getAuth} from "./auth";
export class HttpError extends Error {constructor(public status:number,public code:string){super(code);}}
export async function principal(requestHeaders?:Headers):Promise<AccessProfile|null> {
  if(!businessEnabled())return null;
  const session=await getAuth().api.getSession({headers:requestHeaders||await headers(),query:{disableCookieCache:true}});
  if(!session)return null;
  const user=await prisma.user.findUnique({where:{id:session.user.id},include:{roles:{include:{role:{include:{permissions:true}}}},overrides:true}});
  if(!user||user.disabledAt)return null;
  const roles=user.roles.map(a=>a.role);
  if(roles.some(r=>r.kind==="SUPER_ADMIN")&&(process.env.AIA_MFA_ENABLED!=="true"||!await mfaProof(session.session.id,user.id)))throw new HttpError(403,"MFA_REQUIRED");
  return {id:user.id,active:true,root:roles.some(r=>r.kind==="SUPER_ADMIN"),customerOnly:!roles.some(r=>r.kind!=="CUSTOMER"),roles:roles.map(r=>r.name),...effectiveScopes(roles.flatMap(r=>r.permissions.map(p=>p.scope)),user.overrides)};
}
export async function authorize(scope:string,requestHeaders?:Headers) {
  const user=await principal(requestHeaders);
  if(!user)throw new HttpError(401,"AUTHENTICATION_REQUIRED");
  if(!hasAccess(user,scope))throw new HttpError(403,"PERMISSION_DENIED");
  return user;
}
export function requireOrigin(request:Request) {
  if(request.headers.get("origin")!==authConfiguration().baseURL)throw new HttpError(403,"ORIGIN_REJECTED");
  if(!request.headers.get("content-type")?.startsWith("application/json"))throw new HttpError(415,"JSON_REQUIRED");
}
export async function jsonBody(request:Request) {
  if(Number(request.headers.get("content-length"))>128*1024)throw new HttpError(413,"BODY_TOO_LARGE");
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,"INVALID_JSON");
  const chunks:Uint8Array[]=[];let bytes=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>128*1024){await reader.cancel();throw new HttpError(413,"BODY_TOO_LARGE");}chunks.push(value);}}finally{reader.releaseLock();}
  const text=Buffer.concat(chunks).toString("utf8");
  try{return JSON.parse(text);}catch{throw new HttpError(400,"INVALID_JSON");}
}
export async function serializable<T>(work:(tx:Prisma.TransactionClient)=>Promise<T>) {
  for(let attempt=0;;attempt++)try{return await prisma.$transaction(work,{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:15000});}catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2034"&&attempt<2)continue;throw error;}
}
export async function audit(tx:Prisma.TransactionClient,actorId:string|null,action:string,entityType:string,entityId:string,metadata:Prisma.InputJsonValue={}) {
  return tx.auditLog.create({data:{actorId,action,entityType,entityId,metadata}});
}
