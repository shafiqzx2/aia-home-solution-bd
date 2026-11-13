import 'server-only';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {hasAccess,effectiveScopes,type AccessProfile} from '@/lib/business/access';
import {audit,HttpError,serializable} from './security';
export const taskStates=['OPEN','IN_PROGRESS','BLOCKED','DONE','CANCELLED'] as const;
export const applicationStates=['RECEIVED','REVIEWING','SHORTLISTED','INTERVIEW','HIRED','REJECTED','WITHDRAWN'] as const;
export function taskWhere(actor:AccessProfile){return hasAccess(actor,'tasks.manage')?{}:{OR:[{creatorId:actor.id},{assigneeId:actor.id}]};}
export async function taskAssignees(actor:AccessProfile){
 if(!hasAccess(actor,'tasks.view'))throw new HttpError(403,'PERMISSION_DENIED');
 const users=await prisma.user.findMany({where:{disabledAt:null,...(!actor.root?{roles:{none:{role:{kind:'SUPER_ADMIN'}}}}:{})},include:{roles:{include:{role:{include:{permissions:true}}}},overrides:true},take:500});
 return users.filter(u=>hasAccess({id:u.id,active:true,root:u.roles.some(r=>r.role.kind==='SUPER_ADMIN'),customerOnly:!u.roles.some(r=>r.role.kind!=='CUSTOMER'),roles:[],...effectiveScopes(u.roles.flatMap(r=>r.role.permissions.map(p=>p.scope)),u.overrides)},'tasks.view')).filter(u=>hasAccess(actor,'tasks.manage')||u.id===actor.id).map(u=>({id:u.id,displayName:u.displayName}));
}
export async function saveTask(actor:AccessProfile,id:string|undefined,raw:unknown){
 if(!hasAccess(actor,id?'tasks.update':'tasks.create'))throw new HttpError(403,'PERMISSION_DENIED');
 const input=z.object({revision:z.number().int().nonnegative(),title:z.string().trim().min(1).max(200),description:z.string().trim().max(6000),state:z.enum(taskStates),priority:z.enum(['LOW','NORMAL','HIGH','URGENT']),assigneeId:z.string().nullable(),dueAt:z.iso.datetime().nullable(),note:z.string().trim().max(2000).optional(),archive:z.boolean().optional()}).strict().parse(raw);
 if(input.archive&&!hasAccess(actor,'tasks.archive'))throw new HttpError(403,'PERMISSION_DENIED');
 const assignees=await taskAssignees(actor);
 return serializable(async tx=>{
  const old=id?await tx.internalTask.findFirst({where:{id,...taskWhere(actor)}}):null;
  if(id&&!old)throw new HttpError(404,'TASK_NOT_FOUND');
  if(old&&(old.archivedAt||old.revision!==input.revision))throw new HttpError(409,'STALE_REVISION');
  if(!old&&input.revision!==0)throw new HttpError(409,'STALE_REVISION');
  if(input.assigneeId!==old?.assigneeId&&input.assigneeId&&!assignees.some(u=>u.id===input.assigneeId))throw new HttpError(403,'ASSIGNMENT_NOT_ALLOWED');
  if(!hasAccess(actor,'tasks.manage')&&old&&old.assigneeId!==input.assigneeId&&old.creatorId!==actor.id)throw new HttpError(403,'ASSIGNMENT_NOT_ALLOWED');
  const data={title:input.title,description:input.description,state:input.state,priority:input.priority,assigneeId:input.assigneeId,dueAt:input.dueAt?new Date(input.dueAt):null};
  const row=old?await tx.internalTask.update({where:{id:old.id},data:{...data,revision:{increment:1},...(input.archive?{archivedAt:new Date()}:{})}}):await tx.internalTask.create({data:{...data,creatorId:actor.id}});
  await audit(tx,actor.id,input.archive?'task.archive':old?'task.update':'task.create','InternalTask',row.id,{before:old?{state:old.state,assigneeId:old.assigneeId}:null,after:{state:row.state,assigneeId:row.assigneeId},note:input.note||''});
  if(row.assigneeId&&row.assigneeId!==actor.id&&(old?.assigneeId!==row.assigneeId||old?.state!==row.state))await tx.notification.create({data:{userId:row.assigneeId,kind:'Task assigned or updated: '+row.title,entityId:row.id}});
  return row;
 });
}
export async function updateApplication(actor:AccessProfile,id:string,raw:unknown){
 if(!hasAccess(actor,'applications.update'))throw new HttpError(403,'PERMISSION_DENIED');
 const input=z.object({revision:z.number().int().positive(),state:z.enum(applicationStates),note:z.string().trim().min(1).max(4000)}).strict().parse(raw);
 return serializable(async tx=>{const old=await tx.careerApplication.findUnique({where:{id}});if(!old)throw new HttpError(404,'APPLICATION_NOT_FOUND');if(old.revision!==input.revision)throw new HttpError(409,'STALE_REVISION');const row=await tx.careerApplication.update({where:{id},data:{state:input.state,revision:{increment:1}}});await audit(tx,actor.id,'application.review','CareerApplication',id,{from:old.state,to:row.state,note:input.note});return row;});
}
