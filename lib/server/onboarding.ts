import "server-only";
import {createHash,randomBytes} from "node:crypto";
import {hashPassword} from "better-auth/crypto";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {serializable,audit,HttpError} from "./security";
import type {AccessProfile} from "@/lib/business/access";
export async function inviteStaff(actor:AccessProfile,raw:unknown) {
  if(!actor.root)throw new HttpError(403,'ROOT_REQUIRED');
  const input=z.object({email:z.email(),roleIds:z.array(z.string()).min(1).max(10),purpose:z.enum(['INVITE','RESET'])}).strict().parse(raw);
  const token=randomBytes(32).toString('base64url');
  const invitation=await serializable(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(32751, 1)`;
    if(!await tx.user.count({where:{id:actor.id,disabledAt:null,roles:{some:{role:{kind:'SUPER_ADMIN'}}}}}))throw new HttpError(403,'ROOT_REQUIRED');
    const roles=await tx.role.findMany({where:{id:{in:input.roleIds}}});if(roles.length!==new Set(input.roleIds).size||roles.some(r=>r.kind==='SUPER_ADMIN'))throw new HttpError(403,'ROOT_PROVISIONING_REQUIRED');
    const target=await tx.user.findUnique({where:{email:input.email.toLowerCase()},include:{roles:{include:{role:true}}}});
    if(target?.roles.some(r=>r.role.kind==='SUPER_ADMIN'))throw new HttpError(403,'ROOT_SELF_SERVICE_REQUIRED');
    const row=await tx.staffInvitation.create({data:{email:input.email.toLowerCase(),tokenHash:createHash('sha256').update(token).digest('hex'),purpose:input.purpose,expiresAt:new Date(Date.now()+60*60*1000),createdById:actor.id,roles:{create:input.roleIds.map(roleId=>({roleId}))}}});
    await audit(tx,actor.id,'staff.invite.create','StaffInvitation',row.id,{email:row.email,purpose:input.purpose});return row;
  });
  return {token,expiresAt:invitation.expiresAt,email:invitation.email};
}
export async function acceptInvitation(raw:unknown) {
  const input=z.object({token:z.string().min(40).max(100),name:z.string().trim().min(2).max(120),password:z.string().min(12).max(128)}).strict().parse(raw);
  const candidate=await prisma.staffInvitation.findUnique({where:{tokenHash:createHash("sha256").update(input.token).digest("hex")}});
  if(!candidate||candidate.consumedAt||candidate.expiresAt<new Date())throw new HttpError(410,"INVITATION_EXPIRED_OR_USED");
  if(candidate.rootBootstrap&&input.password.length<16)throw new HttpError(422,'STRONGER_PASSWORD_REQUIRED');
  const password=await hashPassword(input.password);
  return serializable(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(32751, 1)`;
    const invitation=await tx.staffInvitation.findUnique({where:{tokenHash:createHash('sha256').update(input.token).digest('hex')},include:{roles:{include:{role:true}}}});
    if(!invitation||invitation.consumedAt||invitation.expiresAt<new Date())throw new HttpError(410,'INVITATION_EXPIRED_OR_USED');
    if(invitation.rootBootstrap&&await tx.user.count({where:{disabledAt:null,roles:{some:{role:{kind:'SUPER_ADMIN'}}}}}))throw new HttpError(409,'ROOT_ALREADY_PROVISIONED');
    const old=await tx.user.findUnique({where:{email:invitation.email}});
    if(invitation.purpose==='INVITE'&&old)throw new HttpError(409,'ACCOUNT_ALREADY_EXISTS');
    if(invitation.purpose==='RESET'&&!old)throw new HttpError(404,'ACCOUNT_NOT_FOUND');
    const user=old||await tx.user.create({data:{email:invitation.email,displayName:input.name,emailVerified:false}});
    if(user.disabledAt)throw new HttpError(403,'ACCOUNT_SUSPENDED');
    await tx.account.upsert({where:{providerId_accountId:{providerId:'credential',accountId:user.id}},create:{providerId:'credential',accountId:user.id,userId:user.id,password},update:{password}});
    if(!old)await tx.roleAssignment.createMany({data:invitation.roles.map(r=>({userId:user.id,roleId:r.roleId}))});
    await tx.session.deleteMany({where:{userId:user.id}});
    await tx.staffInvitation.update({where:{id:invitation.id},data:{consumedAt:new Date()}});
    await audit(tx,invitation.createdById,'staff.onboarding.complete','User',user.id,{invitationId:invitation.id,purpose:invitation.purpose,rootBootstrap:invitation.rootBootstrap});
    return {completed:true};
  });
}
