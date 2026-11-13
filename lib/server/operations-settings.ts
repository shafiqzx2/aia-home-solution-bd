import 'server-only';
import {Prisma} from '@prisma/client';
import {z} from 'zod';
import type {AccessProfile} from '@/lib/business/access';
import {audit,HttpError,serializable} from './security';
const quantity=z.string().regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,4})?$/);
export async function saveReorderPoint(actor:AccessProfile,productId:string,raw:unknown){
 const input=z.object({reorderPoint:quantity,expectedReorderPoint:quantity}).strict().parse(raw);
 return serializable(async tx=>{const old=await tx.inventory.findUnique({where:{productId},include:{product:{select:{archivedAt:true}}}});if(!old||old.product.archivedAt)throw new HttpError(404,'INVENTORY_NOT_FOUND');if(!old.reorderPoint.equals(new Prisma.Decimal(input.expectedReorderPoint)))throw new HttpError(409,'STALE_REVISION');const row=await tx.inventory.update({where:{productId},data:{reorderPoint:input.reorderPoint}});await audit(tx,actor.id,'inventory.reorder_point.update','Product',productId,{before:old.reorderPoint.toString(),after:row.reorderPoint.toString()});return {productId,reorderPoint:row.reorderPoint.toString()};});
}
export async function savePaymentMethod(actor:AccessProfile,raw:unknown){
 const input=z.object({id:z.string().optional(),code:z.enum(['CASH','BANK_TRANSFER','MOBILE_FINANCE']),label:z.string().trim().min(2).max(80),active:z.boolean(),expected:z.object({label:z.string(),active:z.boolean()}).strict().optional()}).strict().parse(raw);
 return serializable(async tx=>{
  const old=input.id?await tx.paymentMethod.findUnique({where:{id:input.id}}):null;
  if(input.id&&!old)throw new HttpError(404,'PAYMENT_METHOD_NOT_FOUND');
  if(old&&old.code!==input.code)throw new HttpError(422,'PAYMENT_METHOD_CODE_IMMUTABLE');
  if(old&&(!input.expected||input.expected.label!==old.label||input.expected.active!==old.active))throw new HttpError(409,'STALE_REVISION');
  if(!old&&await tx.paymentMethod.findUnique({where:{code:input.code}}))throw new HttpError(409,'PAYMENT_METHOD_ALREADY_EXISTS');
  const row=old?await tx.paymentMethod.update({where:{id:old.id},data:{label:input.label,active:input.active}}):await tx.paymentMethod.create({data:{code:input.code,label:input.label,active:input.active,config:{}}});await audit(tx,actor.id,'payment_method.save','PaymentMethod',row.id,{code:row.code,active:row.active});return {id:row.id,code:row.code,label:row.label,active:row.active};
 });
}
