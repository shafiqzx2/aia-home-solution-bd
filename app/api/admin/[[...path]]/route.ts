import {revalidateTag} from "next/cache";
import {ZodError,z} from "zod";
import {prisma} from "@/lib/prisma";
import {hasAccess} from "@/lib/business/access";
import {authorize,principal,HttpError,requireOrigin,jsonBody,serializable,audit} from "@/lib/server/security";
import {listProducts,saveProduct,productState,saveCategory,adjustStock} from "@/lib/server/catalog";
import {saveContent,publishContent,saveCompany,saveService,publishService} from "@/lib/server/cms";
import {saveRole,updateAccess} from "@/lib/server/access-management";
import {saveQuotation,quoteAction,saveCommercialDraft,documentAction,commitSale,recordPayment,receiptDraft,documentContext,issuedPreview,documentFromSale} from "@/lib/server/commercial";
import {inviteStaff} from "@/lib/server/onboarding";
import {sensitiveSession} from "@/lib/server/sensitive-session";
import {privateIdentityEmails} from "@/lib/server/identity-privacy";
import {redactIdentities} from "@/lib/business/identity-redaction";
const operationalUsers={NOT:{displayName:'LOCAL VERIFICATION ONLY',email:{endsWith:'@example.invalid'}}};
const operationalRequests={archivedAt:null,NOT:{guest:{is:{name:'LOCAL VERIFICATION ONLY',email:{endsWith:'@example.invalid'}}}}};
const operationalCategory={NOT:{slug:{startsWith:'local-qa-'}}};
const operationalProjects={kind:'PROJECT' as const,NOT:{slug:{startsWith:'local-qa-'}}};
type Context={params:Promise<{path?:string[]}>};
const privateHeaders={"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"};
async function handle(request:Request,{params}:Context) {
  try {
    const [resource="me",id,action]=(await params).path||[],url=new URL(request.url);
    if(resource==="me"&&request.method==="GET"){const user=await principal(request.headers);if(!user)throw new HttpError(401,"AUTHENTICATION_REQUIRED");return Response.json(user,{headers:privateHeaders});}
    if(resource==='dashboard'){
      if(request.method!=='GET'||id)throw new HttpError(405,'READ_ONLY_DASHBOARD');
      const actor=await principal(request.headers);if(!actor)throw new HttpError(401,'AUTHENTICATION_REQUIRED');if(actor.customerOnly)throw new HttpError(403,'PERMISSION_DENIED');
      const [requests,products,categories,projects,sales,paid]=await Promise.all([
        hasAccess(actor,'requests.view')?prisma.customerRequest.count({where:operationalRequests}):null,
        hasAccess(actor,'products.view')?prisma.product.count({where:{archivedAt:null,NOT:{sku:{startsWith:'local-qa-'}}}}):null,
        hasAccess(actor,'categories.view')?prisma.category.count({where:{status:{not:'ARCHIVED'},...operationalCategory}}):null,
        hasAccess(actor,'projects.view')?prisma.contentEntry.count({where:{...operationalProjects,status:{not:'ARCHIVED'}}}):null,
        hasAccess(actor,'reports.view')?prisma.sale.aggregate({where:{state:'COMMITTED',demoScope:null},_sum:{total:true},_count:true}):null,
        hasAccess(actor,'reports.view')?prisma.paymentAllocation.aggregate({where:{sale:{state:'COMMITTED',demoScope:null},payment:{state:'POSTED',demoScope:null}},_sum:{amount:true}}):null,
      ]);
      return Response.json({source:'POSTGRESQL',financial:hasAccess(actor,'reports.view'),requests,products,categories,projects,salesCount:sales?._count??null,salesTotal:sales?sales._sum.total?.toFixed(2)||'0.00':null,paid:paid?paid._sum.amount?.toFixed(2)||'0.00':null,balance:sales?(sales._sum.total?.sub(paid?._sum.amount||0).toFixed(2)||'0.00'):null},{headers:privateHeaders});
    }
    const resourceScope=resource==="dashboard"?"reports":resource==="payment-methods"?"payments":["staff","invitations"].includes(resource)?"users":resource;
    const permittedActions:Record<string,string[]>={products:['publish','unpublish','archive'],services:['publish','unpublish'],content:['publish','unpublish'],projects:['publish','unpublish'],company:['publish'],customers:['archive'],quotations:['submit','approve','issue','preview'],documents:['submit','approve','issue','preview'],sales:['commit','document'],payments:['receipt']};
    if(action&&!permittedActions[resource]?.includes(action))throw new HttpError(404,'UNKNOWN_ACTION');
    if(action&&(request.method==='GET')!==(action==='preview'))throw new HttpError(405,'ACTION_METHOD_REJECTED');
    let permission=(resource==='payments'&&action==='receipt'||resource==='sales'&&action==='document')?'view':request.method==="GET"?"view":action==="approve"||action==="commit"?"approve":action==="issue"?"issue":action==="publish"||action==="unpublish"?"publish":action==="archive"?"archive":['users','roles','staff','invitations','payment-methods'].includes(resource)?"manage":request.method==="POST"&&!id?"create":"update";
    if(resource==="company"&&request.method!=="GET"&&!action)permission="update";
    if(resource==="inventory"&&request.method!=="GET")permission="update";
    const actor=await authorize(`${resourceScope}.${permission}`,request.headers);
    // Prepared modules outside the verified release MVP stay closed server-side.
    if(resource==='media'&&request.method!=='GET')throw new HttpError(501,'MODULE_NOT_ENABLED_FOR_RELEASE');
    if(request.method==='GET'&&['quotations','documents'].includes(resource)&&id==='context'){
      let result=JSON.parse(JSON.stringify(await documentContext()));if(!actor.root)result=redactIdentities(result,await privateIdentityEmails(prisma));return Response.json(result,{headers:privateHeaders});
    }
    if(request.method==='GET'&&['quotations','documents'].includes(resource)&&action==='preview'){
      await authorize(resource+'.export',request.headers);let result:unknown=await issuedPreview(resource,id,url.searchParams.get('lang')==='bn'?'bn':'en');if(!actor.root)result=redactIdentities(result,await privateIdentityEmails(prisma));return Response.json(result,{headers:privateHeaders});
    }
    if(id&&["content","projects"].includes(resource)){const entry=await prisma.contentEntry.findUnique({where:{id},select:{kind:true}});if(resource==="projects"&&entry?.kind!=="PROJECT")throw new HttpError(404,"PROJECT_NOT_FOUND");if(resource==="content"&&entry?.kind==="PROJECT")await authorize(`projects.${permission}`,request.headers);}
    if(request.method==='DELETE')throw new HttpError(405,'USE_REVIEWED_ARCHIVE_ACTION');
    const page=Math.max(1,Math.min(10000,Number(url.searchParams.get("page"))||1)),q=(url.searchParams.get("q")||"").slice(0,120),skip=(page-1)*20;
    let result:unknown;
    if(request.method==="GET") {
      switch(resource) {
        case "products":result=await listProducts(actor,page,q);break;
        case "categories":result=await prisma.category.findMany({where:operationalCategory,include:{translations:true},orderBy:[{sortOrder:"asc"},{id:"asc"}],take:200});break;
        case "services":result=await prisma.service.findMany({include:{translations:true,products:true},orderBy:{id:"asc"},skip,take:20});break;
        case "projects":case "content":result=id?await prisma.contentEntry.findUnique({where:{id},include:{translations:true,revisions:{orderBy:{revision:"desc"},take:10}}}):await prisma.contentEntry.findMany({where:{...(resource==="projects"?{kind:"PROJECT" as const}:{kind:"PAGE" as const}),...(url.searchParams.get("slug")?{slug:url.searchParams.get("slug")!}:{})},include:{translations:true},orderBy:{updatedAt:"desc"},skip,take:20});break;
        case "company":result=await prisma.companySettings.findUnique({where:{id:"company"}});break;
        case "roles":result=await prisma.role.findMany({where:{NOT:{OR:['local-qa-','browser-qa-','mfa-qa-'].map(prefix=>({name:{startsWith:prefix}}))}},include:{permissions:true},orderBy:{name:"asc"},take:100});break;
        case "users":case "staff":result=await prisma.user.findMany({where:{AND:[operationalUsers,actor.root?{OR:[{id:actor.id},{roles:{none:{role:{kind:"SUPER_ADMIN"}}}}]}:{roles:{none:{role:{kind:"SUPER_ADMIN"}}}}]},select:{id:true,email:true,displayName:true,disabledAt:true,roles:{include:{role:true}},overrides:true},orderBy:{createdAt:"desc"},skip,take:20});break;
        case "requests":result=await prisma.customerRequest.findMany({where:{...operationalRequests,...(url.searchParams.get('kind')==='CONSULTATION'?{kind:'CONSULTATION' as const}:{})},include:{guest:true,items:true},orderBy:[{createdAt:"desc"},{id:"asc"}],skip,take:20});break;
        case "customers":result=await prisma.customer.findMany({include:{organization:true},where:{archivedAt:null},orderBy:{createdAt:"desc"},skip,take:20});break;
        case "quotations":result=await prisma.quotation.findMany({where:{...(url.searchParams.get('id')?{id:url.searchParams.get('id')!}:{} )},include:{versions:{orderBy:{revision:"desc"},take:1}},orderBy:{createdAt:"desc"},skip,take:20});break;
        case "sales":result=await prisma.sale.findMany({where:{demoScope:null},orderBy:{saleDate:"desc"},include:{items:true,allocations:true},skip,take:20});break;
        case "payments":result=await prisma.paymentRecord.findMany({where:{demoScope:null},include:{method:true,allocations:true},orderBy:{receivedAt:"desc"},skip,take:20});break;
        case "payment-methods":result=await prisma.paymentMethod.findMany({select:{id:true,code:true,label:true,active:true},take:30});break;
        case "documents":result=await prisma.businessDocument.findMany({include:{versions:{orderBy:{revision:"desc"},take:1}},orderBy:{createdAt:"desc"},skip,take:20});break;
        case "inventory":result=await prisma.inventory.findMany({include:{product:{select:{id:true,sku:true,slug:true}}},orderBy:{productId:"asc"},skip,take:20});break;
        case "media":result=await prisma.mediaAsset.findMany({select:{id:true,status:true,visibility:true,mimeType:true,bytes:true,alt:true,createdAt:true},orderBy:{createdAt:"desc"},skip,take:20});break;
        case "audit":if(!actor.root)throw new HttpError(403,"ROOT_REQUIRED");result=await prisma.auditLog.findMany({select:{id:true,actorId:true,action:true,entityType:true,entityId:true,createdAt:true},orderBy:{createdAt:"desc"},skip,take:20});break;
        default:throw new HttpError(404,"MODULE_NOT_CONNECTED");
      }
    } else {
      requireOrigin(request);if(actor.root&&["users","roles","staff","invitations"].includes(resource)&&!await sensitiveSession(request.headers))throw new HttpError(403,"RECENT_PASSWORD_AND_MFA_REQUIRED");const body=await jsonBody(request);
      if(!action&&['products','categories','services','content','projects','quotations','documents','customers'].includes(resource)) {
        await authorize(`${resourceScope}.${body.id?'update':'create'}`,request.headers);
      }
      switch(resource) {
        case "products":result=id&&action?await productState(actor,id,z.number().int().nonnegative().parse(body.revision),action==="publish"?"PUBLISHED":action==="archive"?"ARCHIVED":"DRAFT"):await saveProduct(actor,body);break;
        case "categories":result=await saveCategory(actor,body);break;
        case "customers":{
          const input=z.object({id:z.string().optional(),name:z.string().trim().min(1).max(200).optional(),expectedUpdatedAt:z.iso.datetime().optional()}).strict().parse(body),customerId=id||input.id;
          result=await serializable(async tx=>{const old=customerId?await tx.customer.findUnique({where:{id:customerId}}):null;if(customerId&&(!old||old.updatedAt.toISOString()!==input.expectedUpdatedAt))throw new HttpError(409,'STALE_REVISION');if(old?.archivedAt)throw new HttpError(409,'CUSTOMER_ARCHIVED');if(action!=='archive'&&!input.name)throw new HttpError(422,'CUSTOMER_NAME_REQUIRED');const row=old?await tx.customer.update({where:{id:old.id},data:action==='archive'?{archivedAt:new Date()}:{name:input.name}}):await tx.customer.create({data:{name:input.name!}});await audit(tx,actor.id,action==='archive'?'customer.archive':old?'customer.update':'customer.create','Customer',row.id);return row;});break;
        }
        case "inventory":result=await adjustStock(actor,body);break;
        case "projects":case "content":if(resource==="projects"&&!action&&body.kind!=="PROJECT")throw new HttpError(422,"PROJECT_REQUIRED");if(resource==="content"&&!action&&body.kind==="PROJECT")await authorize(`projects.${body.id?"update":"create"}`,request.headers);result=id&&action?await publishContent(actor.id,id,z.number().int().nonnegative().parse(body.revision),action==="publish"):await saveContent(actor.id,body);break;
        case "services":result=id&&action?await publishService(actor.id,id,z.number().int().nonnegative().parse(body.revision),action==="publish"):await saveService(actor.id,body);break;
        case "company":await authorize("company.update",request.headers);if(action==="publish"&&!hasAccess(actor,"company.publish"))throw new HttpError(403,"PUBLISH_PERMISSION_REQUIRED");result=await saveCompany(actor.id,body,action==="publish");break;
        case "invitations":result=await inviteStaff(actor,body);break;
        case "users":case "staff":result=await updateAccess(actor,body);break;
        case "roles":result=await saveRole(actor,body);break;
        case "quotations":result=id&&action?await quoteAction(actor,id,action as 'submit'|'approve'|'issue',body):await saveQuotation(actor,body);break;
        case "documents":if(!action&&body.sourceQuotationVersionId)await authorize('quotations.view',request.headers);result=id&&action?await documentAction(actor,id,action as 'submit'|'approve'|'issue',body):await saveCommercialDraft(actor,body);break;
        case "sales":if(action==='document'){await authorize('documents.create',request.headers);await authorize('payments.view',request.headers);result=await documentFromSale(actor,body);break;}await authorize('documents.view',request.headers);if(action!=='commit')throw new HttpError(501,'SALE_ACTION_NOT_CONNECTED');result=await commitSale(actor,body);break;
        case "payments":if(action==='receipt'){await authorize('documents.create',request.headers);result=await receiptDraft(actor,body);}else result=await recordPayment(actor,body);break;
        case "payment-methods":{
          const input=z.object({id:z.string().optional(),code:z.enum(['CASH','BANK_TRANSFER','MOBILE_FINANCE']),label:z.string().min(2).max(80),active:z.boolean()}).strict().parse(body);
          result=await serializable(async tx=>{const row=input.id?await tx.paymentMethod.update({where:{id:input.id},data:{label:input.label,active:input.active}}):await tx.paymentMethod.create({data:{code:input.code,label:input.label,active:input.active,config:{}}});await audit(tx,actor.id,'payment_method.save','PaymentMethod',row.id,{code:row.code,active:row.active});return row;});break;
        }
        case "requests":{
          const input=z.object({id:z.string(),status:z.enum(["PENDING_REVIEW","IN_REVIEW","AWAITING_CUSTOMER","SCHEDULED","COMPLETED","CANCELLED"])}).strict().parse(body);
          result=await serializable(async tx=>{const row=await tx.customerRequest.update({where:{id:input.id},data:{status:input.status}});const event=await audit(tx,actor.id,"request.status.update","CustomerRequest",row.id,{status:row.status});await tx.requestStatusEvent.create({data:{requestId:row.id,status:row.status,auditId:event.id}});return row;});break;
        }
        default:throw new HttpError(501,"WRITE_WORKFLOW_NOT_CONNECTED");
      }
      if(["products","categories","services","company","content","projects"].includes(resource))revalidateTag("public-cms",{expire:0});
    }
    let serialized=JSON.parse(JSON.stringify(result,(_,value)=>typeof value==='bigint'?value.toString():value));
    if(!actor.root)serialized=redactIdentities(serialized,await privateIdentityEmails(prisma));
    return Response.json(serialized,{headers:privateHeaders});
  } catch(error) {
    const status=error instanceof HttpError?error.status:error instanceof ZodError?422:503;
    return Response.json({error:error instanceof HttpError?error.code:error instanceof ZodError?"INVALID_INPUT":"BUSINESS_SERVICE_UNAVAILABLE",...(error instanceof ZodError?{issues:error.issues.map(i=>({path:i.path,message:i.message}))}:{})},{status,headers:privateHeaders});
  }
}
export const GET=handle;export const POST=handle;export const PUT=handle;export const PATCH=handle;
export const DELETE=handle;
