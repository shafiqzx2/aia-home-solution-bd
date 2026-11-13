import 'server-only';
import {prisma} from '@/lib/prisma';
import type {AccessProfile} from '@/lib/business/access';
import {issuedPreview} from './commercial';
import {privateIdentityEmails} from './identity-privacy';
import {audit,HttpError,serializable} from './security';
export async function grantQuotation(actor:AccessProfile,versionId:string,revoke=false){
 return serializable(async tx=>{
  const version=await tx.quotationVersion.findUnique({where:{id:versionId}});if(!version?.issuedAt||!['ISSUED','SENT','VIEWED','ACCEPTED'].includes(version.status))throw new HttpError(422,'ISSUED_QUOTATION_REQUIRED');
  if(revoke){await tx.portalGrant.updateMany({where:{quotationVersionId:versionId,revokedAt:null},data:{revokedAt:new Date()}});await audit(tx,actor.id,'quotation.portal.revoke','QuotationVersion',versionId);return {revoked:true};}
  const email=(version.clientSnapshot as {email?:string}).email?.trim().toLowerCase();if(!email)throw new HttpError(422,'RECIPIENT_EMAIL_REQUIRED');
  const user=await tx.user.findUnique({where:{email},include:{roles:{include:{role:true}}}});
  if(!user||user.disabledAt||!user.emailVerified||!user.roles.length||user.roles.some(r=>r.role.kind!=='CUSTOMER'))throw new HttpError(422,'VERIFIED_CUSTOMER_ACCOUNT_REQUIRED');
  const existing=await tx.portalGrant.findFirst({where:{userId:user.id,quotationVersionId:versionId,revokedAt:null}});if(existing)return {granted:true};
  const event=await audit(tx,actor.id,'quotation.portal.grant','QuotationVersion',versionId,{recipientUserId:user.id});await tx.portalGrant.create({data:{userId:user.id,quotationVersionId:versionId,auditId:event.id}});return {granted:true};
 });
}
export async function portalQuotations(actor:AccessProfile){
 return prisma.portalGrant.findMany({where:{userId:actor.id,revokedAt:null,quotationVersion:{issuedAt:{not:null},status:{in:['ISSUED','SENT','VIEWED','ACCEPTED']}}},select:{id:true,grantedAt:true,quotationVersion:{select:{id:true,status:true,documentDate:true,total:true,quotation:{select:{number:true}}}}},orderBy:{grantedAt:'desc'},take:100});
}
export async function portalPreview(actor:AccessProfile,versionId:string,locale:'en'|'bn'){
 const grant=await prisma.portalGrant.findFirst({where:{userId:actor.id,quotationVersionId:versionId,revokedAt:null,quotationVersion:{issuedAt:{not:null},status:{in:['ISSUED','SENT','VIEWED','ACCEPTED']}}}});if(!grant)throw new HttpError(404,'QUOTATION_NOT_AVAILABLE');
 const preview=await issuedPreview('quotations',versionId,locale);const identities=await privateIdentityEmails(prisma);if(identities.some(email=>preview.html.toLowerCase().includes(email.toLowerCase())))throw new HttpError(403,'PRIVATE_IDENTITY_DOCUMENT_RESTRICTED');return preview;
}
