import 'server-only';
import {createHash,randomUUID} from 'node:crypto';
import {Prisma} from '@prisma/client';
import {z} from 'zod';
import {hasAccess,type AccessProfile} from '@/lib/business/access';
import {allocateReturnCredits} from '@/lib/business/return-credit';
import {audit,HttpError,serializable} from './security';
const quantity=z.string().regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,4})?$/).refine(v=>new Prisma.Decimal(v).gt(0));
const money=z.string().regex(/^(?:0|[1-9]\d{0,13})(?:\.\d{1,2})?$/).refine(v=>new Prisma.Decimal(v).gt(0));
const sum=(values:Prisma.Decimal[])=>values.reduce((a,b)=>a.add(b),new Prisma.Decimal(0));
export async function saleAdjustments(tx:Prisma.TransactionClient,saleId:string){const rows=await tx.saleReturn.findMany({where:{saleId,state:'POSTED'},include:{refunds:true}});return {credit:sum(rows.map(r=>r.credit)),refunded:sum(rows.flatMap(r=>r.refunds.map(f=>f.amount)))};}
function scope(actor:AccessProfile,value:string){if(!hasAccess(actor,value))throw new HttpError(403,'PERMISSION_DENIED');}
export async function createReturn(actor:AccessProfile,raw:unknown){
 scope(actor,'returns.create');scope(actor,'sales.view');
 const input=z.object({saleId:z.string(),reason:z.string().trim().min(5).max(2000),evidenceRef:z.string().trim().min(3).max(200),idempotencyKey:z.uuid(),items:z.array(z.object({saleItemId:z.string(),quantity,restock:z.boolean()}).strict()).min(1).max(100)}).strict().parse(raw);
 if(new Set(input.items.map(i=>i.saleItemId)).size!==input.items.length)throw new HttpError(422,'DUPLICATE_ITEM');
 const hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
 return serializable(async tx=>{
  const previous=await tx.saleReturn.findUnique({where:{idempotencyKey:input.idempotencyKey}});if(previous){if(previous.requestHash!==hash)throw new HttpError(409,'IDEMPOTENCY_CONFLICT');return previous;}
  const sale=await tx.sale.findUnique({where:{id:input.saleId},include:{items:{include:{deliveries:true,returns:{include:{saleReturn:true}}}}}});if(!sale||sale.state!=='COMMITTED'||sale.demoScope||(sale.subtotal.isZero()&&!sale.total.isZero()))throw new HttpError(422,'RETURNABLE_SALE_REQUIRED');
  const credits=sale.subtotal.isZero()?Object.fromEntries(sale.items.map(i=>[i.id,'0.00'])):allocateReturnCredits(sale.total.toFixed(2),sale.items.map(i=>({id:i.id,position:i.position,lineTotal:i.lineTotal.toFixed(2)})));
  const items=input.items.map(row=>{
   const source=sale.items.find(i=>i.id===row.saleItemId);if(!source)throw new HttpError(422,'SALE_ITEM_MISMATCH');
   const used=source.returns.filter(r=>['DRAFT','APPROVED','POSTED'].includes(r.saleReturn.state)),qty=new Prisma.Decimal(row.quantity),returned=sum(used.map(r=>r.quantity)),delivered=sum(source.deliveries.map(d=>d.quantity));
   if(qty.add(returned).gt(delivered))throw new HttpError(422,'RETURN_EXCEEDS_DELIVERY');
   if(row.restock&&!source.productId)throw new HttpError(422,'TRACKED_PRODUCT_REQUIRED');
   const fullCredit=new Prisma.Decimal(credits[source.id]),remaining=fullCredit.sub(sum(used.map(r=>r.credit)));
   const credit=qty.add(returned).equals(source.quantity)?remaining:Prisma.Decimal.min(remaining,fullCredit.mul(qty).div(source.quantity).toDecimalPlaces(2,Prisma.Decimal.ROUND_HALF_UP));
   return {...row,credit};
  });
  const credit=sum(items.map(i=>i.credit)),usedCredit=await tx.saleReturn.aggregate({where:{saleId:sale.id,state:{in:['DRAFT','APPROVED','POSTED']}},_sum:{credit:true}});if(credit.lt(0)||credit.add(usedCredit._sum.credit||0).gt(sale.total))throw new HttpError(422,'RETURN_CREDIT_EXCEEDS_SALE');
  const row=await tx.saleReturn.create({data:{reference:'RET-'+randomUUID().slice(0,18).toUpperCase(),saleId:sale.id,idempotencyKey:input.idempotencyKey,requestHash:hash,reason:input.reason,evidenceRef:input.evidenceRef,credit,items:{create:items}}});await audit(tx,actor.id,'return.draft','SaleReturn',row.id,{saleId:sale.id,credit:credit.toFixed(2)});return row;
 });
}
export async function returnAction(actor:AccessProfile,id:string,action:string,raw:unknown){
 scope(actor,action==='approve'?'returns.approve':action==='post'?'returns.issue':'returns.update');scope(actor,'sales.view');
 if(action==='post')scope(actor,'inventory.update');
 const input=z.object({revision:z.number().int().positive(),confirm:z.literal(true)}).strict().parse(raw);
 return serializable(async tx=>{
  const old=await tx.saleReturn.findUnique({where:{id},include:{items:{include:{saleItem:true}}}});if(!old)throw new HttpError(404,'RETURN_NOT_FOUND');
  if(action==='post'&&old.state==='POSTED')return old;
  if(old.revision!==input.revision)throw new HttpError(409,'STALE_REVISION');
  const state=action==='approve'&&old.state==='DRAFT'?'APPROVED':action==='post'&&old.state==='APPROVED'?'POSTED':action==='cancel'&&['DRAFT','APPROVED'].includes(old.state)?'CANCELLED':null;if(!state)throw new HttpError(422,'INVALID_RETURN_TRANSITION');
  if(state==='POSTED')for(const item of old.items){if(!item.restock)continue;const product=await tx.product.findUnique({where:{id:item.saleItem.productId!}});if(!product||product.archivedAt||product.unit!==(item.saleItem.snapshot as {unit?:string}).unit)throw new HttpError(422,'RESTOCK_PRODUCT_UNAVAILABLE');await tx.inventory.upsert({where:{productId:product.id},create:{productId:product.id,quantity:item.quantity},update:{quantity:{increment:item.quantity}}});await tx.stockMovement.create({data:{idempotencyKey:'return:'+item.id,productId:product.id,quantityDelta:item.quantity,reason:old.reference+' '+old.reason}});}
  const row=await tx.saleReturn.update({where:{id},data:{state,revision:{increment:1},...(state==='POSTED'?{postedAt:new Date()}:{})}});await audit(tx,actor.id,'return.'+action,'SaleReturn',id,{from:old.state,to:state,credit:row.credit.toFixed(2)});return row;
 });
}
export async function recordRefund(actor:AccessProfile,returnId:string,raw:unknown){
 for(const s of ['returns.issue','payments.manage','payments.view','sales.view'])scope(actor,s);
 const input=z.object({paymentId:z.string(),amount:money,reason:z.string().trim().min(5).max(2000),evidenceRef:z.string().trim().min(3).max(200),recordedAt:z.iso.datetime(),idempotencyKey:z.uuid(),confirm:z.literal(true)}).strict().parse(raw);
 if(new Date(input.recordedAt).getTime()>Date.now()+60000)throw new HttpError(422,'FUTURE_REFUND_REJECTED');
 return serializable(async tx=>{
  const duplicate=await tx.refundRecord.findUnique({where:{idempotencyKey:input.idempotencyKey}});if(duplicate){if(duplicate.returnId!==returnId||duplicate.paymentId!==input.paymentId||!duplicate.amount.equals(input.amount)||duplicate.reason!==input.reason||(duplicate.evidence as {evidenceRef?:string}).evidenceRef!==input.evidenceRef)throw new HttpError(409,'IDEMPOTENCY_CONFLICT');return duplicate;}
  if(await tx.refundRecord.findFirst({where:{paymentId:input.paymentId,evidence:{path:['evidenceRef'],equals:input.evidenceRef}}}))throw new HttpError(409,'REFUND_EVIDENCE_ALREADY_RECORDED');
  const ret=await tx.saleReturn.findUnique({where:{id:returnId},include:{refunds:true}}),payment=await tx.paymentRecord.findUnique({where:{id:input.paymentId},include:{allocations:true,refunds:{include:{saleReturn:true}}}});
  if(!ret||ret.state!=='POSTED'||!payment||payment.state!=='POSTED'||payment.demoScope)throw new HttpError(422,'POSTED_RETURN_AND_PAYMENT_REQUIRED');
  const allocation=payment.allocations.find(a=>a.saleId===ret.saleId),amount=new Prisma.Decimal(input.amount);
  if(!allocation||payment.refunds.some(r=>!r.returnId)||amount.add(sum(ret.refunds.map(r=>r.amount))).gt(ret.credit)||amount.add(sum(payment.refunds.map(r=>r.amount))).gt(payment.amount)||amount.add(sum(payment.refunds.filter(r=>r.saleReturn?.saleId===ret.saleId).map(r=>r.amount))).gt(allocation.amount))throw new HttpError(422,'REFUND_EXCEEDS_CREDIT_OR_PAYMENT');
  const row=await tx.refundRecord.create({data:{reference:'RFD-'+randomUUID().slice(0,18).toUpperCase(),idempotencyKey:input.idempotencyKey,paymentId:payment.id,returnId:ret.id,amount,reason:input.reason,recordedAt:new Date(input.recordedAt),evidence:{evidenceRef:input.evidenceRef,recordedBy:actor.id,manualRecord:true,noGatewayTransaction:true}}});await audit(tx,actor.id,'refund.record','RefundRecord',row.id,{returnId:ret.id,saleId:ret.saleId,amount:row.amount.toFixed(2),gatewayTriggered:false});return row;
 });
}
