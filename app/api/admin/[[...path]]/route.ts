import {saleAdjustments} from '@/lib/server/returns';
import {revalidateTag} from "next/cache";
import {ZodError,z} from "zod";
import {prisma} from "@/lib/prisma";
import {hasAccess} from "@/lib/business/access";
import {authorize,principal,HttpError,requireOrigin,jsonBody} from "@/lib/server/security";
import {listProducts,saveProduct,productState,saveCategory,adjustStock,archiveCategory} from "@/lib/server/catalog";
import {saveContent,publishContent,saveCompany,saveService,publishService,archiveService} from "@/lib/server/cms";
import {saveRole,updateAccess} from "@/lib/server/access-management";
import {saveQuotation,quoteAction,saveCommercialDraft,documentAction,commitSale,recordPayment,receiptDraft,documentContext,issuedPreview,documentFromSale,recordDelivery,recordQuotationDispatch} from "@/lib/server/commercial";
import {inviteStaff} from "@/lib/server/onboarding";
import {sensitiveSession} from "@/lib/server/sensitive-session";
import {privateIdentityEmails} from "@/lib/server/identity-privacy";
import {redactIdentities} from "@/lib/business/identity-redaction";
import {customerProfile,customerAction,requestAction} from '@/lib/server/relationships';
import {dashboardData} from '@/lib/server/dashboard';
import {grantQuotation} from '@/lib/server/portal';
import {documentSettings,saveDocumentSettings} from '@/lib/server/document-settings';
import {businessReport} from '@/lib/server/reports';
import {isReportKind,reportCsv,type BusinessReport} from '@/lib/business/reporting';
import {saveReorderPoint,savePaymentMethod} from '@/lib/server/operations-settings';
const operationalUsers={NOT:{displayName:'LOCAL VERIFICATION ONLY',email:{endsWith:'@example.invalid'}}};
const operationalRequests={archivedAt:null,NOT:{guest:{is:{name:'LOCAL VERIFICATION ONLY',email:{endsWith:'@example.invalid'}}}}};
const operationalCategory={NOT:{slug:{startsWith:'local-qa-'}}};
type Context={params:Promise<{path?:string[]}>};
const privateHeaders={"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"};
async function handle(request:Request,{params}:Context) {
  try {
    const [resource="me",id,action]=(await params).path||[],url=new URL(request.url);
    if(resource==="me"&&request.method==="GET"){const user=await principal(request.headers);if(!user)throw new HttpError(401,"AUTHENTICATION_REQUIRED");return Response.json(user,{headers:privateHeaders});}
    if(resource==='dashboard'){
      if(request.method!=='GET'||id)throw new HttpError(405,'READ_ONLY_DASHBOARD');
      const actor=await principal(request.headers);if(!actor)throw new HttpError(401,'AUTHENTICATION_REQUIRED');if(actor.customerOnly)throw new HttpError(403,'PERMISSION_DENIED');
      const days=[7,30,90].includes(Number(url.searchParams.get('days')))?Number(url.searchParams.get('days')):30;
      return Response.json(await dashboardData(actor,days),{headers:privateHeaders});
    }
    if(resource==='notifications'){
      if(action||!['GET','PATCH'].includes(request.method))throw new HttpError(405,'METHOD_REJECTED');
      const actor=await principal(request.headers);if(!actor)throw new HttpError(401,'AUTHENTICATION_REQUIRED');const notificationKinds=[...(hasAccess(actor,'tasks.view')?[{kind:{startsWith:'Task assigned or updated:'}}]:[]),...(hasAccess(actor,'requests.view')?[{NOT:{kind:{startsWith:'Task assigned or updated:'}}}]:[])];if(!notificationKinds.length)throw new HttpError(403,'PERMISSION_DENIED');
      if(request.method==='GET'){if(id)throw new HttpError(404,'UNKNOWN_NOTIFICATION_ROUTE');const notifications=await prisma.notification.findMany({where:{userId:actor.id,OR:notificationKinds},select:{id:true,kind:true,readAt:true,createdAt:true},orderBy:{createdAt:'desc'},take:100});return Response.json(actor.root?notifications:redactIdentities(notifications,await privateIdentityEmails(prisma)),{headers:privateHeaders});}
      requireOrigin(request);z.object({read:z.literal(true)}).strict().parse(await jsonBody(request));if(!id)throw new HttpError(422,'NOTIFICATION_ID_REQUIRED');const changed=await prisma.notification.updateMany({where:{id,userId:actor.id,OR:notificationKinds},data:{readAt:new Date()}});if(!changed.count)throw new HttpError(404,'NOTIFICATION_NOT_FOUND');return Response.json({saved:true},{headers:privateHeaders});
    }
    const resourceScope=resource==="document-settings"||resource==="system-status"?"company":resource==="dashboard"?"reports":resource==="payment-methods"?"payments":["staff","invitations"].includes(resource)?"users":resource;
    const permittedActions:Record<string,string[]>={products:['publish','unpublish','archive'],categories:['archive'],services:['publish','unpublish','archive'],content:['publish','unpublish'],projects:['publish','unpublish'],company:['publish'],customers:['archive','followup'],requests:['note','visit'],quotations:['submit','approve','issue','preview','portal-grant','portal-revoke','mark-sent'],documents:['submit','approve','issue','preview'],inventory:['threshold'],sales:['commit','document','deliver'],payments:['receipt']};
    if(action&&!permittedActions[resource]?.includes(action))throw new HttpError(404,'UNKNOWN_ACTION');
    if(action&&(request.method==='GET')!==(action==='preview'))throw new HttpError(405,'ACTION_METHOD_REJECTED');
    let permission=action?.startsWith('portal-')?'manage':(resource==='payments'&&action==='receipt'||resource==='sales'&&action==='document')?'view':request.method==="GET"?"view":action==="approve"||action==="commit"?"approve":action==="issue"?"issue":action==="publish"||action==="unpublish"?"publish":action==="archive"?"archive":['users','roles','staff','invitations','payment-methods'].includes(resource)?"manage":request.method==="POST"&&!id?"create":"update";
    if(resource==="company"&&request.method!=="GET"&&!action)permission="update";
    if(resource==="inventory"&&request.method!=="GET")permission="update";
    const actor=await authorize(`${resourceScope}.${permission}`,request.headers);
    // Prepared modules outside the verified release MVP stay closed server-side.
    if(resource==='media'&&request.method!=='GET')throw new HttpError(501,'MODULE_NOT_ENABLED_FOR_RELEASE');
    if(request.method==='GET'&&resource==='customers'&&id){let result:unknown=await customerProfile(actor,id);if(!actor.root)result=redactIdentities(result,await privateIdentityEmails(prisma));return Response.json(result,{headers:privateHeaders});}
    if(request.method==='GET'&&['quotations','documents'].includes(resource)&&id==='defaults'){return Response.json(await documentSettings(),{headers:privateHeaders});}
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
        case 'reports':{if(id)throw new HttpError(404,'UNKNOWN_REPORT');const days=[7,30,90].includes(Number(url.searchParams.get('days')))?Number(url.searchParams.get('days')):30;const kind=url.searchParams.get('kind');if(kind){if(!isReportKind(kind))throw new HttpError(404,'UNKNOWN_REPORT');const report=await businessReport(actor,kind,days);if(url.searchParams.get('format')==='csv'){await authorize('reports.export',request.headers);const safe=actor.root?report:redactIdentities(report,await privateIdentityEmails(prisma));return new Response(reportCsv(safe as BusinessReport),{headers:{...privateHeaders,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="aia-'+kind+'-report.csv"'}});}result=report;break;}const data=await dashboardData(actor,days);if(url.searchParams.get('format')==='csv'){await authorize('reports.export',request.headers);return new Response(['Date UTC,Committed sales BDT,Allocated payments BDT',...data.series!.map(p=>[p.date,p.sales,p.payments].join(','))].join('\r\n'),{headers:{...privateHeaders,'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="aia-recorded-revenue.csv"'}});}result=data;break;}
        case 'document-settings':result=await documentSettings();break;
        case 'system-status':{await prisma.databaseHealthCheck.count();result={database:true,storageDriver:process.env.AIA_STORAGE_DRIVER||'unconfigured',storageVerification:process.env.AIA_STORAGE_PRIVATE_VERIFIED==='true',remotePdfConfigured:!!process.env.AIA_PDF_BROWSER_WS,localPdfOnly:process.env.AIA_STORAGE_DRIVER==='local',mfaEnabled:process.env.AIA_MFA_ENABLED==='true',productionAuthVerified:process.env.AIA_PRODUCTION_AUTH_VERIFIED==='true',automaticMigrations:false,backups:'Operator-managed private backups; no database reset or automatic restore.'};break;}
        case "products":result=await listProducts(actor,page,q,{status:url.searchParams.get('status')||undefined,categoryId:(url.searchParams.get('category')||'').slice(0,200)||undefined});break;
        case "categories":result=await prisma.category.findMany({where:operationalCategory,include:{translations:true},orderBy:[{sortOrder:"asc"},{id:"asc"}],take:200});break;
        case "services":result=await prisma.service.findMany({where:q?{OR:[{slug:{contains:q,mode:'insensitive'}},{translations:{some:{name:{contains:q,mode:'insensitive'}}}}]}:{},include:{translations:true,products:true},orderBy:{id:"asc"},skip,take:20});break;
        case "projects":case "content":result=id?await prisma.contentEntry.findUnique({where:{id},include:{translations:true,revisions:{orderBy:{revision:"desc"},take:10}}}):await prisma.contentEntry.findMany({where:{...(resource==="projects"?{kind:"PROJECT" as const}:{kind:url.searchParams.get("kind")==="CAREER"?"CAREER" as const:"PAGE" as const}),...(url.searchParams.get("slug")?{slug:url.searchParams.get("slug")!}:{})},include:{translations:true},orderBy:{updatedAt:"desc"},skip,take:20});break;
        case "company":result=await prisma.companySettings.findUnique({where:{id:"company"}});break;
        case "roles":result=await prisma.role.findMany({where:{NOT:{OR:['local-qa-','browser-qa-','mfa-qa-'].map(prefix=>({name:{startsWith:prefix}}))}},include:{permissions:true},orderBy:{name:"asc"},take:100});break;
        case "users":case "staff":result=await prisma.user.findMany({where:{AND:[operationalUsers,actor.root?{OR:[{id:actor.id},{roles:{none:{role:{kind:"SUPER_ADMIN"}}}}]}:{roles:{none:{role:{kind:"SUPER_ADMIN"}}}}]},select:{id:true,email:true,displayName:true,disabledAt:true,roles:{include:{role:true}},overrides:true},orderBy:{createdAt:"desc"},skip,take:20});break;
        case "requests":result=await prisma.customerRequest.findMany({where:{...operationalRequests,...(url.searchParams.get('kind')==='CONSULTATION'?{kind:'CONSULTATION' as const}:url.searchParams.get('kind')==='BOOKING'?{kind:{in:['SERVICE_BOOKING' as const,'INSTALLATION' as const]}}:url.searchParams.get('kind')==='VISIT'?{AND:[{OR:[{kind:{in:['SITE_VISIT' as const,'OFFICE_VISIT' as const]}},{visits:{some:{}}}]}]}:{}),...(q?{OR:[{reference:{contains:q,mode:'insensitive'}},{guest:{name:{contains:q,mode:'insensitive'}}}]}:{})},include:{guest:true,items:true,notes:{orderBy:{createdAt:'desc'},take:20},history:{orderBy:{createdAt:'desc'},take:20},visits:true},orderBy:[{createdAt:"desc"},{id:"asc"}],skip,take:20});break;
        case "customers":result=await prisma.customer.findMany({include:{organization:true},where:{archivedAt:null,...(q?{OR:[{name:{contains:q,mode:"insensitive"}},{email:{contains:q,mode:"insensitive"}},{phone:{contains:q}}]}:{})},orderBy:{createdAt:"desc"},skip,take:20});break;
        case "quotations":result=await prisma.quotation.findMany({where:{...(url.searchParams.get('id')?{id:url.searchParams.get('id')!}:{} )},include:{versions:{orderBy:{revision:"desc"},take:1}},orderBy:{createdAt:"desc"},skip,take:20});break;
        case "sales":result=await prisma.sale.findMany({where:{demoScope:null,...(q?{reference:{contains:q,mode:"insensitive"}}:{}),...(url.searchParams.get("id")?{id:url.searchParams.get("id")!}:{})},orderBy:{saleDate:"desc"},include:{items:{include:{deliveries:true}},...(hasAccess(actor,'payments.view')?{allocations:{include:{payment:{select:{state:true,reference:true}}}}}:{})},skip,take:20});break;
        case "payments":result=await prisma.paymentRecord.findMany({where:{demoScope:null,...(q?{OR:[{reference:{contains:q,mode:"insensitive"}},{externalRef:{contains:q,mode:"insensitive"}}]}:{})},include:{method:true,allocations:true},orderBy:{receivedAt:"desc"},skip,take:20});break;
        case "payment-methods":result=await prisma.paymentMethod.findMany({select:{id:true,code:true,label:true,active:true},take:30});break;
        case "documents":result=await prisma.businessDocument.findMany({where:url.searchParams.get('id')?{id:url.searchParams.get('id')!}:{},include:{versions:{orderBy:{revision:"desc"},take:1}},orderBy:{createdAt:"desc"},skip,take:20});break;
        case "inventory":result=await prisma.inventory.findMany({where:q?{product:{OR:[{sku:{contains:q,mode:"insensitive"}},{slug:{contains:q,mode:"insensitive"}}]}}:{},include:{product:{select:{id:true,sku:true,slug:true,stockMovements:{where:{demoScope:null},orderBy:{recordedAt:'desc'},take:20}}}},orderBy:{productId:"asc"},skip,take:20});break;
        case "media":result=await prisma.mediaAsset.findMany({where:{resumes:{none:{}},creditNotes:{none:{}}},select:{id:true,status:true,visibility:true,mimeType:true,bytes:true,alt:true,createdAt:true},orderBy:{createdAt:"desc"},skip,take:20});break;
        case "audit":if(!actor.root)throw new HttpError(403,"ROOT_REQUIRED");result=await prisma.auditLog.findMany({select:{id:true,actorId:true,action:true,entityType:true,entityId:true,createdAt:true},orderBy:{createdAt:"desc"},skip,take:20});break;
        default:throw new HttpError(404,"MODULE_NOT_CONNECTED");
      }
    } else {
      requireOrigin(request);if(actor.root&&["users","roles","staff","invitations"].includes(resource)&&!await sensitiveSession(request.headers))throw new HttpError(403,"RECENT_PASSWORD_AND_MFA_REQUIRED");const body=await jsonBody(request);
      if(!action&&['products','categories','services','content','projects','quotations','documents','customers'].includes(resource)) {
        await authorize(`${resourceScope}.${body.id?'update':'create'}`,request.headers);
      }
      switch(resource) {
        case 'document-settings':result=await saveDocumentSettings(actor.id,body);break;
        case "products":result=id&&action?await productState(actor,id,z.number().int().nonnegative().parse(body.revision),action==="publish"?"PUBLISHED":action==="archive"?"ARCHIVED":"DRAFT"):await saveProduct(actor,body);break;
        case "categories":result=id&&action?await archiveCategory(actor,id,z.number().int().nonnegative().parse(body.revision)):await saveCategory(actor,body);break;
        case "customers":result=await customerAction(actor,id,action,body);break;
        case "inventory":result=action==='threshold'?await saveReorderPoint(actor,id,body):await adjustStock(actor,body);break;
        case "projects":case "content":if(resource==="projects"&&!action&&body.kind!=="PROJECT")throw new HttpError(422,"PROJECT_REQUIRED");if(resource==="content"&&!action&&body.kind==="PROJECT")await authorize(`projects.${body.id?"update":"create"}`,request.headers);result=id&&action?await publishContent(actor.id,id,z.number().int().nonnegative().parse(body.revision),action==="publish"):await saveContent(actor.id,body);break;
        case "services":result=action==='archive'?await archiveService(actor.id,id,z.number().int().nonnegative().parse(body.revision)):id&&action?await publishService(actor.id,id,z.number().int().nonnegative().parse(body.revision),action==="publish"):await saveService(actor.id,body);break;
        case "company":await authorize("company.update",request.headers);if(action==="publish"&&!hasAccess(actor,"company.publish"))throw new HttpError(403,"PUBLISH_PERMISSION_REQUIRED");result=await saveCompany(actor.id,body,action==="publish");break;
        case "invitations":result=await inviteStaff(actor,body);break;
        case "users":case "staff":result=await updateAccess(actor,body);break;
        case "roles":result=await saveRole(actor,body);break;
        case "quotations":if(action==='mark-sent'){await authorize('quotations.issue',request.headers);result=await recordQuotationDispatch(actor,id,body);break;}if(action?.startsWith('portal-')){if(actor.root&&!await sensitiveSession(request.headers))throw new HttpError(403,'RECENT_PASSWORD_AND_MFA_REQUIRED');z.object({confirm:z.literal(true)}).strict().parse(body);result=await grantQuotation(actor,id,action==='portal-revoke');break;}if(!action&&body.requestId)await authorize('requests.view',request.headers);if(!action&&body.customerId)await authorize('customers.view',request.headers);result=id&&action?await quoteAction(actor,id,action as 'submit'|'approve'|'issue',body):await saveQuotation(actor,body);break;
        case "documents":if(!action&&body.sourceQuotationVersionId)await authorize('quotations.view',request.headers);result=id&&action?await documentAction(actor,id,action as 'submit'|'approve'|'issue',body):await saveCommercialDraft(actor,body);break;
        case "sales":if(action==='deliver'){await authorize('sales.view',request.headers);await authorize('inventory.update',request.headers);await authorize('documents.create',request.headers);if(body.saleId!==id)throw new HttpError(422,'SALE_ID_MISMATCH');result=await recordDelivery(actor,body);break;}if(action==='document'){await authorize('documents.create',request.headers);await authorize('payments.view',request.headers);result=await documentFromSale(actor,body);break;}await authorize('documents.view',request.headers);if(action!=='commit')throw new HttpError(501,'SALE_ACTION_NOT_CONNECTED');result=await commitSale(actor,body);break;
        case "payments":if(action==='receipt'){await authorize('documents.create',request.headers);result=await receiptDraft(actor,body);}else result=await recordPayment(actor,body);break;
        case "payment-methods":result=await savePaymentMethod(actor,body);break;
        case "requests":result=await requestAction(actor,id,action,body);break;
        default:throw new HttpError(501,"WRITE_WORKFLOW_NOT_CONNECTED");
      }
      if(["products","categories","services","company","content","projects"].includes(resource))revalidateTag("public-cms",{expire:0});
    }
    if(resource==='sales'&&request.method==='GET'&&hasAccess(actor,'payments.view')&&Array.isArray(result))result=await Promise.all(result.map(async sale=>({...sale,adjustments:await saleAdjustments(prisma,sale.id)})));
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
