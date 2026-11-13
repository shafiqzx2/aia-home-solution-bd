import {hasAccess,type AccessProfile} from './access.ts';
export const reportDefinitions={
 products:{title:'Product performance',scopes:['products.view','sales.view'],description:'Committed sale quantities and line values before discounts and tax. Unlinked lines are excluded; units are kept separate.'},
 services:{title:'Service request activity',scopes:['services.view','requests.view'],description:'Distinct requests selecting each service. Request counts are not sales or service revenue.'},
 customers:{title:'Customer sales activity',scopes:['customers.view','sales.view'],description:'Committed sales linked to customers. Guest sales remain in overall revenue totals.'},
 quotations:{title:'Quotation pipeline',scopes:['quotations.view'],description:'Latest revision of each active quotation created within the period. Offered amounts are not recorded revenue.'},
 inventory:{title:'Inventory report',scopes:['inventory.view','products.view'],description:'Current stock and reorder points. No private product prices are included.'},
 staff:{title:'Staff activity',scopes:['audit.view'],description:'Recorded audit events by active or historical staff member. Counts do not measure staff productivity.'},
} as const;
export type ReportKind=keyof typeof reportDefinitions;
export type BusinessReport={kind:ReportKind;title:string;description:string;days:number;columns:string[];rows:string[][];limit:number};
export const reportModules:Record<string,ReportKind>={'product-performance':'products','service-performance':'services','customer-analytics':'customers','quotation-analytics':'quotations','staff-activity':'staff'};
export function isReportKind(value:string):value is ReportKind{return Object.hasOwn(reportDefinitions,value);}
export function canReadReport(actor:AccessProfile,kind:ReportKind){return isReportKind(kind)&&hasAccess(actor,'reports.view')&&(kind!=='staff'||actor.root)&&reportDefinitions[kind].scopes.every(scope=>hasAccess(actor,scope));}
export function reportCsv(report:BusinessReport){const cell=(value:string)=>'"'+(/^[\s]*[=+@-]|^[\t\r\n]/.test(value)?"'"+value:value).replaceAll('"','""')+'"';return [report.columns,...report.rows].map(row=>row.map(cell).join(',')).join('\r\n');}
