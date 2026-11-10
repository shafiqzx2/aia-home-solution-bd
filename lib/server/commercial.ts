import "server-only";
import {createHash} from "node:crypto";
import {Prisma} from "@prisma/client";
import {z} from "zod";

import {quotationSchema,moneyInput} from "@/lib/business/validation";
import {calculateQuote,lineTotal,amount,decimal} from "@/lib/business/finance";
import {currentCompanySnapshot,type CompanySnapshot} from "@/lib/business/company-settings";
import {prisma} from '@/lib/prisma';
import {renderQuotation,renderSalesDocument,type QuotationDraft} from '@/lib/business/documents';
import type {SalesDraft} from '@/lib/business/sales';
import {serializable,HttpError,audit} from "./security";
import type {AccessProfile} from "@/lib/business/access";
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const date=(value:string)=>{const d=new Date(value+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)throw new HttpError(422,'INVALID_DOCUMENT_DATE');return d;};
async function companySnapshot(tx:Prisma.TransactionClient){const row=await tx.companySettings.findUnique({where:{id:'company'}});if(!row)return currentCompanySnapshot('en');const contact=row.contact as {address:{en:string};email:string;phone:string},logos=row.logoVariants as {document?:string};return {...currentCompanySnapshot('en'),name:row.name,address:contact.address.en,email:contact.email,phone:contact.phone,logo:logos.document||currentCompanySnapshot('en').logo};}
async function reference(tx:Prisma.TransactionClient,scope:string){const year=String(new Date().getUTCFullYear());const [row]=await tx.$queryRaw<{value:bigint}[]>`SELECT aia_next_number(${scope},${year}) AS value`;return `${scope}-${year}-${String(row.value).padStart(6,'0')}`;}
export async function documentContext(){return companySnapshot(prisma);}
export async function issuedPreview(resource:string,id:string,locale:'en'|'bn'){
 if(resource==='quotations'){
  const row=await prisma.quotationVersion.findUnique({where:{id},include:{quotation:true}});
  if(!row?.issuedAt||!row.quotation.number)throw new HttpError(409,'ISSUED_VERSION_REQUIRED');
  return {html:renderQuotation((row.termsSnapshot as {draft:QuotationDraft}).draft,row.companySnapshot as unknown as CompanySnapshot,locale,'',{mode:'issued',number:row.quotation.number}),hash:row.contentHash};
 }
 const row=await prisma.documentVersion.findUnique({where:{id},include:{document:true}});
 if(!row?.issuedAt||!row.document.reference)throw new HttpError(409,'ISSUED_VERSION_REQUIRED');
 const {draft}=JSON.parse(row.body) as {draft:SalesDraft};
 // Issued output is immutable: use only payments captured in the persisted body.
 return {html:renderSalesDocument(draft,row.companySnapshot as unknown as CompanySnapshot,locale,'',{mode:'issued',number:row.document.reference}),hash:row.contentHash};
}
export async function saveQuotation(actor:AccessProfile,raw:unknown) {
  const input=z.object({id:z.string().optional(),expectedRevision:z.number().int().nonnegative(),requestId:z.string().optional(),draft:quotationSchema}).strict().parse(raw),totals=calculateQuote(input.draft);
  const documentDate=date(input.draft.date),validUntil=input.draft.validUntil?date(input.draft.validUntil):null;if(validUntil&&validUntil<documentDate)throw new HttpError(422,'INVALID_VALIDITY');
  return serializable(async tx=>{
    const old=input.id?await tx.quotation.findUnique({where:{id:input.id},include:{versions:{orderBy:{revision:'desc'},take:1}}}):null;
    if(input.id&&(!old||old.versions[0]?.revision!==input.expectedRevision))throw new HttpError(409,'STALE_REVISION');
    const request=input.requestId?await tx.customerRequest.findUnique({where:{id:input.requestId}}):null;
    if(input.requestId&&!request)throw new HttpError(422,'REQUEST_NOT_FOUND');
    const quote=old||await tx.quotation.create({data:{requestId:input.requestId}}),company=await companySnapshot(tx);
    const version=await tx.quotationVersion.create({data:{quotationId:quote.id,revision:(old?.versions[0]?.revision||0)+1,status:'DRAFT',authorId:actor.id,...totals,taxPercent:input.draft.taxPercent,clientSnapshot:{client:input.draft.client,attention:input.draft.attention,email:input.draft.email,address:input.draft.address},companySnapshot:company,termsSnapshot:{draft:input.draft},contentHash:hash({draft:input.draft,company,totals}),documentDate,validUntil,items:{create:input.draft.items.map((i,index)=>({position:index,code:i.code,description:i.description,unit:i.unit,quantity:i.quantity,unitPrice:i.unitPrice,lineTotal:lineTotal(i)}))}}});
    await audit(tx,actor.id,'quotation.draft.save','QuotationVersion',version.id,{quotationId:quote.id,revision:version.revision,sourceRequestId:input.requestId||null});return {id:quote.id,versionId:version.id,revision:version.revision};
  });
}
export async function quoteAction(actor:AccessProfile,id:string,action:'submit'|'approve'|'issue',raw:unknown) {
  z.object({confirm:z.literal(true)}).strict().parse(raw);
  return serializable(async tx=>{
    const version=await tx.quotationVersion.findUnique({where:{id},include:{quotation:true}});if(!version)throw new HttpError(404,'QUOTATION_NOT_FOUND');
    const next=action==='submit'?'PENDING_APPROVAL':action==='approve'?'APPROVED':'ISSUED';
    if(version.status!==(action==='submit'?'DRAFT':action==='approve'?'PENDING_APPROVAL':'APPROVED'))throw new HttpError(409,'INVALID_QUOTATION_TRANSITION');
    const latest=await tx.quotationVersion.findFirst({where:{quotationId:version.quotationId},orderBy:{revision:'desc'},select:{id:true}});if(latest?.id!==id)throw new HttpError(409,'STALE_REVISION');
    if(action==='approve')await tx.approvalRecord.create({data:{quotationVersionId:id,approverId:actor.id,contentHash:version.contentHash,decision:'APPROVED'}});
    let number=version.quotation.number;
    if(action==='issue'){
      number=number||await reference(tx,'QUO');
      await tx.quotation.update({where:{id:version.quotationId},data:{number,currentIssuedVersionId:id}});
    }
    const row=await tx.quotationVersion.update({where:{id},data:{status:next,...(action==='issue'?{issuedAt:new Date()}:{})}});
    const event=await audit(tx,actor.id,`quotation.${action}`,'QuotationVersion',id,{contentHash:version.contentHash,number});
    await tx.quotationStatusEvent.create({data:{versionId:id,status:next,auditId:event.id}});return row;
  });
}
const memoInput=z.object({id:z.string().optional(),expectedRevision:z.number().int().nonnegative(),kind:z.enum(['MEMO','INVOICE','CHALLAN']),sourceQuotationVersionId:z.string().nullable(),draft:quotationSchema,issuer:z.string().max(160)}).strict();
export async function saveCommercialDraft(actor:AccessProfile,raw:unknown) {
  const input=memoInput.parse(raw);calculateQuote(input.draft);date(input.draft.date);
  return serializable(async tx=>{
    if(input.sourceQuotationVersionId){const source=await tx.quotationVersion.findUnique({where:{id:input.sourceQuotationVersionId}});if(!source||!['APPROVED','ISSUED','SENT','VIEWED','ACCEPTED'].includes(source.status))throw new HttpError(422,'APPROVED_SOURCE_REQUIRED');}
    const old=input.id?await tx.businessDocument.findUnique({where:{id:input.id},include:{versions:{orderBy:{revision:'desc'},take:1}}}):null;
    if(input.id&&(!old||old.versions[0]?.revision!==input.expectedRevision))throw new HttpError(409,'STALE_REVISION');
    if(old&&await tx.commercialDocument.findFirst({where:{documentVersion:{documentId:old.id}}}))throw new HttpError(409,'RECORDED_DOCUMENT_IMMUTABLE');
    const doc=old||await tx.businessDocument.create({data:{kind:input.kind}});if(doc.kind!==input.kind)throw new HttpError(422,'DOCUMENT_KIND_IMMUTABLE');
    const company=await companySnapshot(tx),body=JSON.stringify({draft:{...input.draft,kind:input.kind,sourceQuotation:input.sourceQuotationVersionId,payments:[],issuer:input.issuer,demo:false}});
    const version=await tx.documentVersion.create({data:{documentId:doc.id,revision:(old?.versions[0]?.revision||0)+1,status:'DRAFT',authorId:actor.id,subject:`${input.kind} · ${input.draft.client}`,body,locale:'en',recipientSnapshot:{client:input.draft.client,address:input.draft.address,email:input.draft.email},companySnapshot:company,senderSnapshot:{name:input.issuer},contentHash:hash({body,company})}});
    await audit(tx,actor.id,'document.draft.save','DocumentVersion',version.id,{documentId:doc.id,revision:version.revision});return {id:doc.id,versionId:version.id,revision:version.revision};
  });
}
export async function documentAction(actor:AccessProfile,id:string,action:'submit'|'approve'|'issue',raw:unknown) {
  z.object({confirm:z.literal(true)}).strict().parse(raw);
  return serializable(async tx=>{
    const version=await tx.documentVersion.findUnique({where:{id},include:{document:true,commercial:true}});if(!version)throw new HttpError(404,'DOCUMENT_NOT_FOUND');
    const next=action==='submit'?'PENDING_APPROVAL':action==='approve'?'APPROVED':'ISSUED';
    if(version.status!==(action==='submit'?'DRAFT':action==='approve'?'PENDING_APPROVAL':'APPROVED'))throw new HttpError(409,'INVALID_DOCUMENT_TRANSITION');
    const latest=await tx.documentVersion.findFirst({where:{documentId:version.documentId},orderBy:{revision:'desc'},select:{id:true}});if(latest?.id!==id)throw new HttpError(409,'STALE_REVISION');
    if(action==='approve')await tx.approvalRecord.create({data:{documentVersionId:id,approverId:actor.id,contentHash:version.contentHash,decision:'APPROVED'}});
    if(action==='issue'){
      if(!await tx.approvalRecord.findFirst({where:{documentVersionId:id,contentHash:version.contentHash,decision:'APPROVED'}}))throw new HttpError(409,'APPROVAL_REQUIRED');
      if(['MEMO','INVOICE','RECEIPT','CHALLAN'].includes(version.document.kind)&&!version.commercial)throw new HttpError(422,'RECORDED_SALE_OR_EVENT_REQUIRED');
      const scope:Record<string,string>={MEMO:'MEM',INVOICE:'INV',RECEIPT:'RCT',CHALLAN:'CHL',LETTER:'LTR'};
      await tx.businessDocument.update({where:{id:version.documentId},data:{reference:version.document.reference||await reference(tx,scope[version.document.kind]||'LTR'),currentIssuedVersionId:id}});
    }
    const row=await tx.documentVersion.update({where:{id},data:{status:next,...(action==='issue'?{issuedAt:new Date()}:{})}});
    await audit(tx,actor.id,`document.${action}`,'DocumentVersion',id,{contentHash:version.contentHash});return row;
  });
}
export async function commitSale(actor:AccessProfile,raw:unknown) {
  const input=z.object({versionId:z.string(),idempotencyKey:z.uuid(),confirm:z.literal(true)}).strict().parse(raw);
  return serializable(async tx=>{
    const duplicate=await tx.sale.findUnique({where:{idempotencyKey:input.idempotencyKey}});if(duplicate){if(!await tx.commercialDocument.findFirst({where:{saleId:duplicate.id,documentVersionId:input.versionId}}))throw new HttpError(409,'IDEMPOTENCY_CONFLICT');return duplicate;}
    const version=await tx.documentVersion.findUnique({where:{id:input.versionId},include:{document:true,commercial:true}});if(!version||version.status!=='APPROVED'||!['MEMO','INVOICE'].includes(version.document.kind))throw new HttpError(422,'APPROVED_MEMO_REQUIRED');
    if(!await tx.approvalRecord.findFirst({where:{documentVersionId:version.id,contentHash:version.contentHash,decision:'APPROVED'}}))throw new HttpError(409,'APPROVAL_REQUIRED');
    if(version.commercial)throw new HttpError(409,'SALE_ALREADY_RECORDED');
    if(await tx.commercialDocument.findFirst({where:{documentVersion:{documentId:version.documentId}}}))throw new HttpError(409,'SALE_ALREADY_RECORDED');
    const {draft}=JSON.parse(version.body),parsed=quotationSchema.parse(Object.fromEntries(Object.keys(quotationSchema.shape).map(k=>[k,draft[k]]))),totals=calculateQuote(parsed);
    const sale=await tx.sale.create({data:{reference:await reference(tx,'SALE'),idempotencyKey:input.idempotencyKey,saleDate:date(parsed.date),state:'DRAFT',customerId:version.document.customerId,sourceQuotationVersionId:draft.sourceQuotation||null,customerSnapshot:version.recipientSnapshot as Prisma.InputJsonValue,companySnapshot:version.companySnapshot as Prisma.InputJsonValue,...totals,taxPercent:parsed.taxPercent,items:{create:parsed.items.map((i,index)=>({position:index+1,snapshot:i,quantity:i.quantity,unitPrice:i.unitPrice,lineTotal:lineTotal(i)}))}}});
    await tx.commercialDocument.create({data:{saleId:sale.id,documentVersionId:version.id,kind:version.document.kind as 'MEMO'|'INVOICE',financialSnapshot:{...totals,paid:'0.00',balance:totals.total}}});
    const committed=await tx.sale.update({where:{id:sale.id},data:{state:'COMMITTED',committedAt:new Date()}});
    await audit(tx,actor.id,'sale.commit','Sale',sale.id,{versionId:version.id,total:totals.total,inventoryChanged:false});return committed;
  });
}
export async function recordPayment(actor:AccessProfile,raw:unknown) {
  const input=z.object({saleId:z.string(),methodId:z.string(),amount:moneyInput,externalRef:z.string().trim().min(1).max(200),receivedAt:z.iso.datetime(),idempotencyKey:z.uuid(),confirm:z.literal(true)}).strict().parse(raw);
  if(amount(input.amount)<=BigInt(0))throw new HttpError(422,'POSITIVE_AMOUNT_REQUIRED');
  return serializable(async tx=>{
    const duplicate=await tx.paymentRecord.findUnique({where:{idempotencyKey:input.idempotencyKey},include:{allocations:true}});if(duplicate){if(!duplicate.amount.equals(input.amount)||duplicate.methodId!==input.methodId||duplicate.externalRef!==input.externalRef||!duplicate.allocations.some(a=>a.saleId===input.saleId))throw new HttpError(409,'IDEMPOTENCY_CONFLICT');return duplicate;}
    const sale=await tx.sale.findUnique({where:{id:input.saleId},include:{allocations:true}}),method=await tx.paymentMethod.findUnique({where:{id:input.methodId}});
    if(!sale||sale.state!=='COMMITTED'||sale.demoScope||!method?.active)throw new HttpError(422,'COMMITTED_SALE_AND_ACTIVE_METHOD_REQUIRED');
    const paid=sale.allocations.reduce((sum,a)=>sum+amount(a.amount.toFixed(2)),BigInt(0));if(paid+amount(input.amount)>amount(sale.total.toFixed(2)))throw new HttpError(422,'OVERPAYMENT_REJECTED');
    const payment=await tx.paymentRecord.create({data:{reference:await reference(tx,'PAY'),idempotencyKey:input.idempotencyKey,methodId:method.id,externalRef:input.externalRef,receivedAt:new Date(input.receivedAt),amount:input.amount,state:'POSTED',evidence:{recordedBy:actor.id,manualRecord:true,noGatewayTransaction:true},allocations:{create:{saleId:sale.id,amount:input.amount}}}});
    await audit(tx,actor.id,'payment.record','PaymentRecord',payment.id,{saleId:sale.id,amount:input.amount,balance:decimal(amount(sale.total.toFixed(2))-paid-amount(input.amount)),gatewayTriggered:false});return payment;
  });
}
export async function receiptDraft(actor:AccessProfile,raw:unknown) {
  const input=z.object({paymentId:z.string(),saleId:z.string()}).strict().parse(raw);
  return serializable(async tx=>{
    const payment=await tx.paymentRecord.findUnique({where:{id:input.paymentId},include:{method:true,allocations:{where:{saleId:input.saleId},include:{sale:{include:{items:true}}}}}});
    if(!payment||payment.state!=='POSTED'||payment.demoScope||!payment.allocations.length)throw new HttpError(422,'ALLOCATED_PAYMENT_REQUIRED');
    const sale=payment.allocations[0].sale,company=sale.companySnapshot as unknown as ReturnType<typeof currentCompanySnapshot>,client=sale.customerSnapshot as {client?:string;address?:string;email?:string};
    const body=JSON.stringify({draft:{client:client.client||'',attention:'',email:client.email||'',address:client.address||'',project:'',date:payment.receivedAt.toISOString().slice(0,10),validUntil:'',items:sale.items.map(i=>i.snapshot),discount:sale.discount.toFixed(2),taxPercent:sale.taxPercent.toString(),charges:sale.charges.toFixed(2),terms:'',paymentTerms:'',deliveryTerms:'',notes:'',kind:'RECEIPT',sourceQuotation:null,payments:[{id:payment.id,amount:payment.allocations[0].amount.toFixed(2),method:payment.method.code,state:'POSTED',date:payment.receivedAt.toISOString().slice(0,10),reference:payment.reference,demo:false}],issuer:'',demo:false}});
    const doc=await tx.businessDocument.create({data:{kind:'RECEIPT',versions:{create:{revision:1,status:'DRAFT',authorId:actor.id,subject:'Payment receipt',body,locale:'en',recipientSnapshot:sale.customerSnapshot as Prisma.InputJsonValue,companySnapshot:company,senderSnapshot:{},contentHash:hash({body,company})}}},include:{versions:true}});
    await tx.commercialDocument.create({data:{saleId:sale.id,paymentId:payment.id,documentVersionId:doc.versions[0].id,kind:'RECEIPT',financialSnapshot:{amount:payment.allocations[0].amount.toFixed(2),paymentReference:payment.reference}}});
    await audit(tx,actor.id,'receipt.draft.create','DocumentVersion',doc.versions[0].id,{paymentId:payment.id,saleId:sale.id});return doc;
  });
}
export async function documentFromSale(actor:AccessProfile,raw:unknown){
 const input=z.object({saleId:z.string(),kind:z.enum(['MEMO','INVOICE'])}).strict().parse(raw);
 return serializable(async tx=>{
  const sale=await tx.sale.findUnique({where:{id:input.saleId},include:{documents:{include:{documentVersion:true}},allocations:{include:{payment:{include:{method:true}}}}}});
  if(!sale||sale.state!=='COMMITTED'||sale.demoScope)throw new HttpError(422,'COMMITTED_SALE_REQUIRED');
  const source=sale.documents.find(doc=>['MEMO','INVOICE'].includes(doc.kind));if(!source)throw new HttpError(422,'SOURCE_DOCUMENT_REQUIRED');
  const payments=sale.allocations.filter(a=>a.payment.state==='POSTED').map(a=>({id:a.payment.id,amount:a.amount.toFixed(2),method:a.payment.method.code,state:'POSTED',date:a.payment.receivedAt.toISOString().slice(0,10),reference:a.payment.reference,demo:false}));
  const paid=payments.reduce((total,p)=>total+amount(p.amount),BigInt(0)),balance=amount(sale.total.toFixed(2))-paid;
  if(input.kind==='MEMO'&&(balance!==BigInt(0)||!payments.length||payments.some(p=>p.method!=='CASH')))throw new HttpError(422,'FULL_CASH_PAYMENT_REQUIRED');
  const draft={...JSON.parse(source.documentVersion.body).draft,kind:input.kind,payments,demo:false},body=JSON.stringify({draft}),company=sale.companySnapshot;
  const doc=await tx.businessDocument.create({data:{kind:input.kind,customerId:sale.customerId,versions:{create:{revision:1,status:'DRAFT',authorId:actor.id,subject:input.kind==='MEMO'?'Cash memo':'Invoice',body,locale:'en',recipientSnapshot:sale.customerSnapshot as Prisma.InputJsonValue,companySnapshot:company as Prisma.InputJsonValue,senderSnapshot:{},contentHash:hash({body,company})}}},include:{versions:true}});
  await tx.commercialDocument.create({data:{saleId:sale.id,documentVersionId:doc.versions[0].id,kind:input.kind,financialSnapshot:{total:sale.total.toFixed(2),paid:decimal(paid),balance:decimal(balance)}}});
  await audit(tx,actor.id,'document.from.sale','DocumentVersion',doc.versions[0].id,{saleId:sale.id,kind:input.kind,saleCreated:false});return doc;
 });
}
