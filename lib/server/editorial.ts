import 'server-only';
import {z} from 'zod';
import {hasAccess,type AccessProfile} from '@/lib/business/access';
import {reviewSchema,navigationSchema} from '@/lib/business/editorial';
import {prisma} from '@/lib/prisma';
import {saveContent,publishContent} from './cms';
import {audit,HttpError,serializable} from './security';
function need(actor:AccessProfile,scope:string){if(!hasAccess(actor,scope))throw new HttpError(403,'PERMISSION_DENIED');}
export async function editorialAction(actor:AccessProfile,resource:string,raw:unknown){
 const input=z.object({action:z.enum(['save','verify','publish','unpublish']),id:z.string().optional(),revision:z.number().int().nonnegative(),slug:z.string().regex(/^[a-z0-9][a-z0-9-]{0,159}$/).optional(),review:reviewSchema.optional(),navigation:navigationSchema.optional(),consent:z.literal(true).optional(),genuine:z.literal(true).optional(),evidence:z.string().trim().min(5).max(1000).optional()}).strict().parse(raw);
 if(!['reviews','navigation'].includes(resource))throw new HttpError(404,'UNKNOWN_EDITOR');
 const kind=resource==='reviews'?'REVIEW':'PAGE',existing=input.id?await prisma.contentEntry.findUnique({where:{id:input.id}}):resource==='navigation'?await prisma.contentEntry.findUnique({where:{kind_slug:{kind:'PAGE',slug:'navigation'}}}):null;
 if(input.id&&(!existing||existing.kind!==kind||(resource==='navigation'&&existing.slug!=='navigation')))throw new HttpError(404,'CONTENT_NOT_FOUND');
 if(input.action==='verify'){
  need(actor,'content.approve');if(resource!=='reviews'||!existing||!input.consent||!input.genuine||!input.evidence)throw new HttpError(422,'GENUINE_CONSENT_EVIDENCE_REQUIRED');
  return serializable(async tx=>{const row=await tx.contentEntry.findUnique({where:{id:existing.id}});if(!row||row.revision!==input.revision)throw new HttpError(409,'STALE_REVISION');const saved=await tx.contentEntry.update({where:{id:row.id},data:{consentAt:new Date(),verifiedAt:new Date(),revision:{increment:1}}});await audit(tx,actor.id,'review.verify','ContentEntry',row.id,{revision:saved.revision,evidence:input.evidence!,genuine:true,consent:true});return saved;});
 }
 if(input.action!=='save'){need(actor,'content.publish');if(!existing)throw new HttpError(404,'CONTENT_NOT_FOUND');return publishContent(actor.id,existing.id,input.revision,input.action==='publish');}
 need(actor,existing?'content.update':'content.create');
 const data=resource==='reviews'?{review:reviewSchema.parse(input.review)}:{navigation:navigationSchema.parse(input.navigation)},title=resource==='reviews'?input.review!.name:'Navigation';
 return saveContent(actor.id,{...(existing?{id:existing.id}:{}),revision:input.revision,slug:existing?.slug||(resource==='navigation'?'navigation':input.slug),kind,title:{en:title,bn:title},body:{en:{copy:{},hiddenSections:[],...data},bn:{copy:{},hiddenSections:[],...data}},seo:{en:{title:'',description:''},bn:{title:'',description:''}}});
}
