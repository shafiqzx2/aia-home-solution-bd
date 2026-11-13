"use client";
import {useState} from 'react';
import {hasAccess,type AccessProfile} from '@/lib/business/access';
import {canReadReport,reportDefinitions,reportModules,type ReportKind,type BusinessReport} from '@/lib/business/reporting';
import {useRemote} from './live-api';
import {Button,Field,download} from './ui';
export function LiveReports({actor,section}:{actor:AccessProfile;section:string}){
 const allowed=(Object.keys(reportDefinitions) as ReportKind[]).filter(kind=>canReadReport(actor,kind));
 const [kind,setKind]=useState<ReportKind>(reportModules[section]||allowed[0]||'products'),[days,setDays]=useState('30'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const path=`reports?kind=${kind}&days=${days}`,remote=useRemote<BusinessReport>(allowed.includes(kind)?path:null);
 async function exportRows(){setBusy(true);setError('');try{const response=await fetch('/api/admin/'+path+'&format=csv',{cache:'no-store'});if(!response.ok)throw Error('Report export unavailable.');download('aia-'+kind+'-report.csv',await response.text(),'text/csv;charset=utf-8');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 if(!allowed.length)return <section className="a-panel"><h2>No reports assigned</h2><p>Your effective permissions do not include a report data source.</p></section>;
 return <section className="a-panel"><header className="a-panel-header"><h2>{reportDefinitions[kind].title}</h2></header><div className="a-form-grid"><Field label="Report"><select value={kind} onChange={e=>setKind(e.target.value as ReportKind)}>{allowed.map(k=><option key={k} value={k}>{reportDefinitions[k].title}</option>)}</select></Field><Field label="Activity period · UTC"><select disabled={kind==='inventory'} value={days} onChange={e=>setDays(e.target.value)}>{['7','30','90'].map(d=><option key={d} value={d}>Last {d} days</option>)}</select></Field></div><p>{reportDefinitions[kind].description}</p><p className="a-support">Up to 100 grouped records. Inventory is a current snapshot.</p>{(remote.error||error)&&<p role="alert">{remote.error||error}</p>}{remote.loading&&<p role="status">Loading authorized records…</p>}{remote.data&&<div className="a-table-wrap"><table className="a-table"><thead><tr>{remote.data.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{remote.data.rows.map((row,i)=><tr key={i}>{row.map((value,j)=><td key={j}>{value}</td>)}</tr>)}</tbody></table></div>}{!remote.loading&&remote.data&&!remote.data.rows.length&&<p>No records in this report period.</p>}<Button secondary disabled={busy||!remote.data||!hasAccess(actor,'reports.export')} onClick={()=>void exportRows()}>Export report CSV</Button></section>;
}
