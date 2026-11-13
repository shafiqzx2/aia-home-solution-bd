import test from 'node:test';
import assert from 'node:assert/strict';
import {canReadReport,reportCsv,isReportKind} from '../lib/business/reporting.ts';
import {canOpenModule} from '../lib/business/workspace-access.ts';
const actor={id:'unit-staff',active:true,root:false,customerOnly:false,roles:[],allowed:['reports.view','products.view','sales.view','reports.export'],denied:[]};
test('Report permissions require all source scopes and apply to navigation',()=>{assert(canReadReport(actor,'products'));assert(canOpenModule(actor,'product-performance'));assert(!canReadReport({...actor,denied:['sales.view']},'products'));assert(!canOpenModule({...actor,denied:['sales.view']},'product-performance'));assert(!canReadReport({...actor,customerOnly:true},'products'));assert(!canReadReport({...actor,active:false},'products'));assert(!canReadReport(actor,'staff'));assert(canReadReport({...actor,root:true},'staff'));assert(!isReportKind('__proto__'));assert(!isReportKind('unknown'));});
test('CSV exports escape spreadsheet formulas, quotes and line breaks',()=>{const csv=reportCsv({kind:'customers',title:'',description:'',days:30,limit:100,columns:['Name','Total'],rows:[['=1+1','10.00'],['A "quoted"\nname','2.50']]});assert(csv.includes('"\'=1+1"'));assert(csv.includes('"A ""quoted""\nname"'));assert(csv.includes('"10.00"'));});
