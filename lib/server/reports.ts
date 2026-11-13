import 'server-only';
import {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import type {AccessProfile} from '@/lib/business/access';
import {canReadReport,reportDefinitions,type ReportKind,type BusinessReport} from '@/lib/business/reporting';
import {HttpError} from './security';
export async function businessReport(actor:AccessProfile,kind:ReportKind,days:number):Promise<BusinessReport>{
 if(!canReadReport(actor,kind))throw new HttpError(403,'REPORT_PERMISSION_REQUIRED');
 const since=new Date();since.setUTCHours(0,0,0,0);since.setUTCDate(since.getUTCDate()-days+1);
 const until=new Date();until.setUTCHours(0,0,0,0);until.setUTCDate(until.getUTCDate()+1);
 let columns:string[],query:Prisma.Sql;
 switch(kind){
  case 'products':columns=['SKU','Product','Unit','Quantity sold','Line value BDT'];query=Prisma.sql`SELECT COALESCE(p.sku,'') AS sku,p.slug AS product,COALESCE(i.snapshot->>'unit','') AS unit,SUM(i.quantity)::text AS quantity,SUM(i."lineTotal")::text AS value FROM "SaleItem" i JOIN "Sale" s ON s.id=i."saleId" JOIN "Product" p ON p.id=i."productId" WHERE s.state='COMMITTED' AND s."demoScope" IS NULL AND s."saleDate">=${since}::date AND s."saleDate"<${until}::date GROUP BY p.id,i.snapshot->>'unit' ORDER BY SUM(i."lineTotal") DESC,p.id LIMIT 100`;break;
  case 'services':columns=['Service','Requests','Completed','Cancelled'];query=Prisma.sql`SELECT s.slug AS service,COUNT(DISTINCT r.id)::text AS requests,COUNT(DISTINCT r.id) FILTER(WHERE r.status='COMPLETED')::text AS completed,COUNT(DISTINCT r.id) FILTER(WHERE r.status='CANCELLED')::text AS cancelled FROM "Service" s JOIN "RequestItem" i ON i."serviceId"=s.id JOIN "CustomerRequest" r ON r.id=i."requestId" WHERE r."archivedAt" IS NULL AND r."createdAt">=${since} AND r."createdAt"<${until} GROUP BY s.id ORDER BY COUNT(DISTINCT r.id) DESC,s.id LIMIT 100`;break;
  case 'customers':columns=['Customer','Committed sales','Sales total BDT'];query=Prisma.sql`SELECT c.name AS customer,COUNT(s.id)::text AS sales,SUM(s.total)::text AS total FROM "Customer" c JOIN "Sale" s ON s."customerId"=c.id WHERE s.state='COMMITTED' AND s."demoScope" IS NULL AND s."saleDate">=${since}::date AND s."saleDate"<${until}::date GROUP BY c.id ORDER BY SUM(s.total) DESC,c.id LIMIT 100`;break;
  case 'quotations':columns=['Latest status','Quotations','Offered total BDT'];query=Prisma.sql`WITH latest AS(SELECT DISTINCT ON(v."quotationId") v.status,v.total FROM "QuotationVersion" v JOIN "Quotation" q ON q.id=v."quotationId" WHERE q."archivedAt" IS NULL AND q."createdAt">=${since} AND q."createdAt"<${until} ORDER BY v."quotationId",v.revision DESC) SELECT status::text AS status,COUNT(*)::text AS quotations,SUM(total)::text AS total FROM latest GROUP BY status ORDER BY status`;break;
  case 'inventory':columns=['SKU','Product','Unit','On hand','Reorder point','Availability'];query=Prisma.sql`SELECT COALESCE(p.sku,'') AS sku,p.slug AS product,p.unit AS unit,i.quantity::text AS quantity,i."reorderPoint"::text AS reorder,CASE WHEN i.quantity<=i."reorderPoint" THEN 'At or below reorder point' ELSE 'Stock available' END AS availability FROM "Inventory" i JOIN "Product" p ON p.id=i."productId" WHERE p."archivedAt" IS NULL ORDER BY (i.quantity<=i."reorderPoint") DESC,p.id LIMIT 100`;break;
  case 'staff':columns=['Staff name','Audit events','Latest event UTC'];query=Prisma.sql`SELECT u."displayName" AS name,COUNT(a.id)::text AS events,MAX(a."createdAt")::text AS latest FROM "User" u JOIN "AuditLog" a ON a."actorId"=u.id WHERE a."createdAt">=${since} AND a."createdAt"<${until} AND EXISTS(SELECT 1 FROM "RoleAssignment" ra JOIN "Role" r ON r.id=ra."roleId" WHERE ra."userId"=u.id AND r.kind!='CUSTOMER') AND NOT(u."displayName"='LOCAL VERIFICATION ONLY' AND u.email LIKE '%@example.invalid') GROUP BY u.id ORDER BY COUNT(a.id) DESC,u.id LIMIT 100`;break;
 }
 const records=await prisma.$queryRaw<Record<string,string>[]>(query);
 return {kind,title:reportDefinitions[kind].title,description:reportDefinitions[kind].description,days,columns,rows:records.map(row=>Object.values(row).map(String)),limit:100};
}
