import 'server-only';
import {prisma} from '@/lib/prisma';
import {hasAccess,type AccessProfile} from '@/lib/business/access';
export async function dashboardData(actor:AccessProfile,days:number){
 const financial=hasAccess(actor,'reports.view'),since=new Date();since.setUTCHours(0,0,0,0);since.setUTCDate(since.getUTCDate()-days+1);
 const operationalRequests={archivedAt:null,NOT:{guest:{is:{name:'LOCAL VERIFICATION ONLY',email:{endsWith:'@example.invalid'}}}}};
 const [requests,products,categories,projects,customers,quotations,services,sales,paid,revenue,collections,collection,activity,credits,refunds]=await Promise.all([
  hasAccess(actor,'requests.view')?prisma.customerRequest.count({where:operationalRequests}):null,
  hasAccess(actor,'products.view')?prisma.product.count({where:{archivedAt:null,NOT:{sku:{startsWith:'local-qa-'}}}}):null,
  hasAccess(actor,'categories.view')?prisma.category.count({where:{status:{not:'ARCHIVED'},NOT:{slug:{startsWith:'local-qa-'}}}}):null,
  hasAccess(actor,'projects.view')?prisma.contentEntry.count({where:{kind:'PROJECT',status:{not:'ARCHIVED'},NOT:{slug:{startsWith:'local-qa-'}}}}):null,
  hasAccess(actor,'customers.view')?prisma.customer.count({where:{archivedAt:null}}):null,
  hasAccess(actor,'quotations.view')?prisma.quotation.count({where:{archivedAt:null}}):null,
  hasAccess(actor,'services.view')?prisma.service.count({where:{status:{not:'ARCHIVED'}}}):null,
  financial?prisma.sale.aggregate({where:{state:'COMMITTED',demoScope:null},_sum:{total:true},_count:true}):null,
  financial?prisma.paymentAllocation.aggregate({where:{sale:{state:'COMMITTED',demoScope:null},payment:{state:'POSTED',demoScope:null}},_sum:{amount:true}}):null,
  financial?prisma.$queryRaw<{day:Date;total:string}[]>`SELECT "saleDate" AS day, SUM(total)::text AS total FROM "Sale" WHERE state='COMMITTED' AND "demoScope" IS NULL AND "saleDate">=${since}::date GROUP BY "saleDate" ORDER BY "saleDate"`:null,
  financial?prisma.$queryRaw<{day:Date;total:string}[]>`SELECT (p."receivedAt" AT TIME ZONE 'UTC')::date AS day, SUM(a.amount)::text AS total FROM "PaymentAllocation" a JOIN "PaymentRecord" p ON p.id=a."paymentId" JOIN "Sale" s ON s.id=a."saleId" WHERE p.state='POSTED' AND p."demoScope" IS NULL AND s.state='COMMITTED' AND s."demoScope" IS NULL AND p."receivedAt">=${since} GROUP BY 1 ORDER BY 1`:null,
  financial?prisma.$queryRaw<{paid:number;partial:number;unpaid:number}[]>`SELECT count(*) FILTER (WHERE received>=total)::int AS paid, count(*) FILTER (WHERE received>0 AND received<total)::int AS partial, count(*) FILTER (WHERE received=0 AND total>0)::int AS unpaid FROM (SELECT s.total-COALESCE((SELECT SUM(r.credit) FROM "SaleReturn" r WHERE r."saleId"=s.id AND r.state='POSTED'),0) AS total,COALESCE((SELECT SUM(a.amount) FROM "PaymentAllocation" a JOIN "PaymentRecord" p ON p.id=a."paymentId" WHERE a."saleId"=s.id AND p.state='POSTED' AND p."demoScope" IS NULL),0)-COALESCE((SELECT SUM(f.amount) FROM "RefundRecord" f JOIN "SaleReturn" r ON r.id=f."returnId" WHERE r."saleId"=s.id AND r.state='POSTED'),0) AS received FROM "Sale" s WHERE s.state='COMMITTED' AND s."demoScope" IS NULL) positions`:null,
  actor.root?prisma.auditLog.findMany({select:{id:true,action:true,entityType:true,createdAt:true},orderBy:{createdAt:'desc'},take:8}):prisma.auditLog.findMany({where:{actorId:actor.id},select:{id:true,action:true,entityType:true,createdAt:true},orderBy:{createdAt:'desc'},take:8}),
  financial?prisma.saleReturn.aggregate({where:{state:'POSTED',sale:{state:'COMMITTED',demoScope:null}},_sum:{credit:true}}):null,
  financial?prisma.refundRecord.aggregate({where:{saleReturn:{state:'POSTED',sale:{state:'COMMITTED',demoScope:null}},payment:{demoScope:null,state:'POSTED'}},_sum:{amount:true}}):null,
 ]);
 const series=financial?Array.from({length:days},(_,i)=>{const date=new Date(since);date.setUTCDate(date.getUTCDate()+i);const day=date.toISOString().slice(0,10);return {date:day,sales:revenue?.find(r=>new Date(r.day).toISOString().slice(0,10)===day)?.total||'0.00',payments:collections?.find(r=>new Date(r.day).toISOString().slice(0,10)===day)?.total||'0.00'};}):null;
 return {source:'POSTGRESQL' as const,financial,requests,products,categories,projects,customers,quotations,services,salesCount:sales?._count??null,salesTotal:sales?sales._sum.total?.toFixed(2)||'0.00':null,paid:paid?paid._sum.amount?.toFixed(2)||'0.00':null,returnCredits:credits?credits._sum.credit?.toFixed(2)||'0.00':null,refunds:refunds?refunds._sum.amount?.toFixed(2)||'0.00':null,balance:sales?(sales._sum.total?.sub(credits?._sum.credit||0).sub(paid?._sum.amount||0).add(refunds?._sum.amount||0).toFixed(2)||'0.00'):null,days,series,collection:collection?[collection[0].paid,collection[0].partial,collection[0].unpaid]:null,activity};
}
