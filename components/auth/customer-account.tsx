"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Brand} from '@/components/site/brand';
import {DocumentPreview,Button} from '@/components/admin/ui';
import {authClient} from '@/lib/auth-client';
import type {Locale} from '@/lib/i18n';
type Grant={id:string;quotationVersion:{id:string;status:string;total:string;quotation:{number:string|null}}};
export function CustomerAccount({locale}:{locale:Locale}){
 const [rows,setRows]=useState<Grant[]|null>(null),[error,setError]=useState(''),[html,setHtml]=useState('');
 useEffect(()=>{let active=true;fetch('/api/portal',{cache:'no-store'}).then(async response=>{const data=await response.json();if(!response.ok)throw Error(data.error);if(active)setRows(data);}).catch(e=>{if(active)setError(e.message);});return()=>{active=false};},[]);
 async function open(id:string){setError('');try{const response=await fetch('/api/portal?version='+encodeURIComponent(id)+'&lang='+locale,{cache:'no-store'}),data=await response.json();if(!response.ok)throw Error(data.error);setHtml(data.html);}catch(e){setHtml('');setError((e as Error).message);}}
 return <main className="shell section-space"><Brand locale={locale}/><h1>{locale==='bn'?'আপনার কোটেশন':'Your quotations'}</h1><p>{locale==='bn'?'কেবল আপনার জন্য অনুমোদিত ইস্যুকৃত কোটেশন এখানে দেখানো হয়।':'Only issued quotations explicitly shared with your account appear here.'}</p>{error&&<p role="alert">{error}</p>}{!rows&&!error&&<p role="status">Loading…</p>}{rows?.map(row=><section className="a-panel" key={row.id}><h2>{row.quotationVersion.quotation.number}</h2><p>{row.quotationVersion.status} · BDT {row.quotationVersion.total}</p><Button onClick={()=>void open(row.quotationVersion.id)}>Open quotation / print PDF</Button></section>)}{rows&&!rows.length&&<p>{locale==='bn'?'আপনার অ্যাকাউন্টে কোনো কোটেশন শেয়ার করা হয়নি।':'No quotations have been shared with your account.'}</p>}{html&&<DocumentPreview html={html} label="Your issued quotation" presentation="issued"/>}<Button secondary onClick={()=>void authClient.signOut().then(result=>{if(result.error)setError('Sign out failed.');else location.replace(`/${locale}/login`);}).catch(()=>setError('Sign out failed.'))}>Sign out</Button><Link href={`/${locale}`}>Website</Link></main>;
}
