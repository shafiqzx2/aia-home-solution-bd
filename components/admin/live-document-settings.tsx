"use client";
import {useState} from 'react';
import type {z} from 'zod';
import type {documentSettingsInput} from '@/lib/server/document-settings';
import {hasAccess,type AccessProfile} from '@/lib/business/access';
import {api,useRemote} from './live-api';
import {Button,Field} from './ui';
type Draft=z.infer<typeof documentSettingsInput>;
export function LiveDocumentSettings({actor,notify}:{actor:AccessProfile;notify:(s:string)=>void}){
 const remote=useRemote<Draft&{numbering:{scope:string;period:string;nextValue:string}[]}>('document-settings'),[editing,setEditing]=useState<Draft|null>(null),[busy,setBusy]=useState(false),draft=editing||(remote.data?Object.fromEntries(Object.entries(remote.data).filter(([key])=>key!=='numbering')) as Draft:null);
 async function save(){setBusy(true);try{await api('document-settings','PUT',draft);setEditing(null);remote.reload();notify('Defaults saved. Existing and issued document snapshots are unchanged.');}catch(e){notify((e as Error).message);}finally{setBusy(false);}}
 return <section className="a-panel"><h2>Quotation and document defaults</h2>{remote.error&&<p role="alert">{remote.error}</p>}{draft&&<><div className="a-form-grid"><Field label="Default tax percent"><input inputMode="decimal" value={draft.taxPercent} onChange={e=>setEditing({...draft,taxPercent:e.target.value})}/></Field><Field label="Default quotation validity · days"><input type="number" min="0" max="365" value={draft.validDays} onChange={e=>setEditing({...draft,validDays:Number(e.target.value)})}/></Field>{(['en','bn'] as const).map(locale=><fieldset key={locale}><legend>{locale==='en'?'English':'বাংলা'}</legend>{(['terms','paymentTerms','deliveryTerms','documentFooter'] as const).map(key=><Field key={key} label={key}><textarea value={draft[key][locale]} onChange={e=>setEditing({...draft,[key]:{...draft[key],[locale]:e.target.value}})}/></Field>)}</fieldset>)}</div><Button disabled={busy||!hasAccess(actor,'company.update')} onClick={()=>void save()}>Save document defaults</Button></>}<h3>Issued numbering sequences</h3><p>Numbering is automatic and transactional. Sequences cannot be reset from the workspace.</p>{remote.data?.numbering.map(n=><p key={n.scope+n.period}>{n.scope} · {n.period} · sequence {n.nextValue}</p>)}</section>;
}
