import {hasAccess, type AccessProfile} from './access.ts';

// The same policy controls navigation and direct server-rendered module routes.
const scopes:Record<string,string>={
 notifications:'requests',activities:'audit',tasks:'requests',customers:'customers',requests:'requests',consultations:'requests',
 'quotation-register':'quotations','sales-memos':'documents',invoices:'documents',payments:'payments',orders:'sales',returns:'sales',bookings:'requests','site-visits':'requests',
 products:'products',categories:'categories',collections:'products',inventory:'inventory','private-pricing':'pricing',services:'services','service-categories':'services','product-service-mapping':'services',
 homepage:'content',about:'content',projects:'projects',media:'media',reviews:'content',careers:'content',navigation:'content',footer:'content',seo:'content',translations:'content',
 quotations:'quotations','memo-studio':'documents',documents:'documents',email:'documents',templates:'documents',dispatch:'documents',
 'sales-analytics':'reports','quotation-analytics':'reports','customer-analytics':'reports','product-performance':'reports','service-performance':'reports','staff-activity':'reports','financial-reports':'reports',operations:'reports',exports:'reports',
 users:'users',roles:'roles',permissions:'users',staff:'users','audit-logs':'audit',settings:'company','system-settings':'company',
};
export function canonicalModule(id:string){return ({home:'homepage',company:'settings',access:'users'} as Record<string,string>)[id]||id;}
export function canOpenModule(actor:AccessProfile,id:string){
 if(id==='dashboard')return actor.active&&!actor.customerOnly;
 if(id==='root-admin'||id==='audit-logs'||id==='activities')return actor.active&&actor.root&&!actor.customerOnly;
 return !!scopes[id]&&hasAccess(actor,`${scopes[id]}.view`);
}
export const connectedModules=['orders','payments','inventory','customers','media','services','quotations','quotation-register','memo-studio','sales-memos','invoices','documents','dashboard','products','categories','homepage','about','projects','settings','requests','consultations','root-admin','users','roles','permissions','staff','audit-logs'];
