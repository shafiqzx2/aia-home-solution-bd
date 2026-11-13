import "server-only";
import {z} from "zod";
import {allScopes,type AccessProfile} from "@/lib/business/access";
import {serializable,HttpError,audit} from "./security";
const scope=z.string().refine(s=>allScopes.includes(s));
export async function updateAccess(actor:AccessProfile,raw:unknown) {
  if(!actor.root)throw new HttpError(403,"ROOT_REQUIRED");
  const input=z.object({userId:z.string(),roleIds:z.array(z.string()).min(1).max(10),overrides:z.array(z.object({scope,effect:z.enum(["ALLOW","DENY"])})).max(allScopes.length),active:z.boolean()}).strict().parse(raw);
  return serializable(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(32751, 1)`;
    if(!await tx.user.count({where:{id:actor.id,disabledAt:null,roles:{some:{role:{kind:"SUPER_ADMIN"}}}}}))throw new HttpError(403,"ROOT_REQUIRED");
    const user=await tx.user.findUnique({where:{id:input.userId},include:{roles:{include:{role:true}}}});if(!user)throw new HttpError(404,"USER_NOT_FOUND");
    const roles=await tx.role.findMany({where:{id:{in:input.roleIds}}});if(roles.length!==new Set(input.roleIds).size)throw new HttpError(422,"UNKNOWN_ROLE");
    const wasRoot=user.roles.some(r=>r.role.kind==="SUPER_ADMIN"),becomesRoot=roles.some(r=>r.kind==="SUPER_ADMIN");
    if(wasRoot&&user.id!==actor.id)throw new HttpError(403,"ROOT_SELF_SERVICE_REQUIRED");
    if(!wasRoot&&becomesRoot)throw new HttpError(403,"ROOT_PROVISIONING_REQUIRED");
    if(input.userId===actor.id&&(!input.active||!becomesRoot))throw new HttpError(403,"ROOT_SELF_REMOVAL_REJECTED");
    if(wasRoot&&(!input.active||!becomesRoot)){
      const others=await tx.user.count({where:{id:{not:input.userId},disabledAt:null,roles:{some:{role:{kind:"SUPER_ADMIN"}}}}});
      if(!others)throw new HttpError(409,"LAST_ROOT_REQUIRED");
    }
    const before={roles:user.roles.map(r=>r.roleId),active:!user.disabledAt};
    await tx.roleAssignment.deleteMany({where:{userId:user.id}});
    await tx.roleAssignment.createMany({data:input.roleIds.map(roleId=>({userId:user.id,roleId}))});
    await tx.userPermission.deleteMany({where:{userId:user.id}});
    if(input.overrides.length)await tx.userPermission.createMany({data:input.overrides.map(o=>({...o,userId:user.id}))});
    await tx.user.update({where:{id:user.id},data:{disabledAt:input.active?null:new Date()}});
    await tx.session.deleteMany({where:{userId:user.id}});
    await audit(tx,actor.id,"user.access.update","User",user.id,{before,after:{roles:input.roleIds,active:input.active,overrides:input.overrides},sessionsRevoked:true});
    return {id:user.id,sessionsRevoked:true};
  });
}
export async function saveRole(actor:AccessProfile,raw:unknown) {
  if(!actor.root)throw new HttpError(403,"ROOT_REQUIRED");
  const input=z.object({id:z.string().optional(),name:z.string().trim().min(2).max(80),kind:z.enum(["ADMIN","STAFF","CUSTOMER"]),scopes:z.array(scope).max(allScopes.length)}).strict().parse(raw);
  return serializable(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(32751, 1)`;
    if(!await tx.user.count({where:{id:actor.id,disabledAt:null,roles:{some:{role:{kind:"SUPER_ADMIN"}}}}}))throw new HttpError(403,"ROOT_REQUIRED");
    if(input.id){const old=await tx.role.findUnique({where:{id:input.id}});if(!old||old.kind==="SUPER_ADMIN")throw new HttpError(403,"ROOT_ROLE_IMMUTABLE");}
    if(input.kind==="CUSTOMER"&&input.scopes.length)throw new HttpError(422,"CUSTOMER_HAS_NO_INTERNAL_SCOPES");
    const role=input.id?await tx.role.update({where:{id:input.id},data:{name:input.name,kind:input.kind}}):await tx.role.create({data:{name:input.name,kind:input.kind}});
    for(const name of input.scopes)await tx.permission.upsert({where:{scope:name},create:{scope:name},update:{}});
    await tx.rolePermission.deleteMany({where:{roleId:role.id}});
    if(input.scopes.length)await tx.rolePermission.createMany({data:[...new Set(input.scopes)].map(scope=>({roleId:role.id,scope}))});
    await tx.session.deleteMany({where:{user:{roles:{some:{roleId:role.id}}}}});
    await audit(tx,actor.id,"role.save","Role",role.id,{name:role.name,scopes:input.scopes});return role;
  });
}
