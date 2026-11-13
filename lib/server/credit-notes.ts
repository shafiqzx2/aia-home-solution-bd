import 'server-only';
import {randomUUID} from 'node:crypto';
import {Prisma} from '@prisma/client';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {hasAccess,type AccessProfile} from '@/lib/business/access';
import {renderCreditNote,type CreditNoteSnapshot} from '@/lib/business/credit-note';
import type {CompanySnapshot} from '@/lib/business/company-settings';
import {HttpError,serializable,audit} from './security';
import {pdfBytes} from './pdf-archive';
import {putObject,digest,storageConfiguration} from './object-storage';
import {privateIdentityEmails} from './identity-privacy';
export async function issueCreditNote(actor:AccessProfile,returnId:string,raw:unknown){
 for(const scope of ['returns.view','returns.issue','returns.export','sales.view'])if(!hasAccess(actor,scope))throw new HttpError(403,'PERMISSION_DENIED');
 const {locale}=z.object({locale:z.enum(['en','bn']),confirm:z.literal(true)}).strict().parse(raw),old=await prisma.creditNote.findUnique({where:{returnId}});if(old)return {id:old.id,number:old.number,url:'/api/media/'+old.assetId,locale:old.locale};
 storageConfiguration();const source=await prisma.saleReturn.findUnique({where:{id:returnId},include:{sale:true,items:{include:{saleItem:true}}}});if(!source||source.state!=='POSTED')throw new HttpError(422,'POSTED_RETURN_REQUIRED');
 const number=await serializable(async tx=>{const [row]=await tx.$queryRaw<{value:bigint}[]>`SELECT aia_next_number('CN',${String(new Date().getUTCFullYear())}) AS value`;return 'CN-'+new Date().getUTCFullYear()+'-'+String(row.value).padStart(6,'0');});
 const snapshot:CreditNoteSnapshot={number,date:new Date().toISOString().slice(0,10),company:source.sale.companySnapshot as unknown as CompanySnapshot,customer:source.sale.customerSnapshot as {client?:string;address?:string},saleReference:source.sale.reference,returnReference:source.reference,credit:source.credit.toFixed(2),reason:source.reason,items:source.items.map(i=>{const line=i.saleItem.snapshot as {description:string;unit:string};return {description:line.description,unit:line.unit,quantity:i.quantity.toString(),credit:i.credit.toFixed(2)};})};
 const html=renderCreditNote(snapshot,locale),rootOnly=(await privateIdentityEmails(prisma)).some(email=>html.toLowerCase().includes(email.toLowerCase()));if(rootOnly&&!actor.root)throw new HttpError(403,'PROTECTED_DOCUMENT_REQUIRES_ROOT');
 const bytes=await pdfBytes(html),objectKey='documents/'+randomUUID()+'.pdf',bucket=await putObject(objectKey,bytes,'application/pdf');
 const saved=await serializable(async tx=>{const prior=await tx.creditNote.findUnique({where:{returnId}});if(prior)return prior;const asset=await tx.mediaAsset.create({data:{objectKey,bucket,mimeType:'application/pdf',visibility:'PRIVATE',status:'READY',bytes:bytes.length,sha256:digest(bytes),alt:{en:'Issued credit note',rootOnly}}});const note=await tx.creditNote.create({data:{returnId,locale,number,snapshot:snapshot as unknown as Prisma.InputJsonValue,html,contentHash:digest(Buffer.from(html)),assetId:asset.id}});await audit(tx,actor.id,'credit_note.issue','CreditNote',note.id,{returnId,number,sha256:asset.sha256});return note;});
 return {id:saved.id,number:saved.number,url:'/api/media/'+saved.assetId,locale:saved.locale};
}
