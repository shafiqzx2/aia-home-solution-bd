"use client";
import {companyInput,contentInput} from '@/lib/business/validation';
export function LiveContentPreview({value,company}:{value:string;company:boolean}){
 let raw;try{raw=JSON.parse(value);}catch{return <p>Correct the draft JSON to preview it.</p>;}
 if(company){const p=companyInput.safeParse(raw);return p.success?<article className="prose"><h2>{p.data.name}</h2><p>{p.data.address.en}</p><p>{p.data.phone} · {p.data.email}</p></article>:<p>Complete the required fields to preview.</p>;}
 const p=contentInput.safeParse(raw);if(!p.success)return <p>Complete the required fields to preview.</p>;
 return <div>{(['en','bn'] as const).map(locale=><article className="prose" key={locale} lang={locale}><h2>{p.data.title[locale]}</h2>{Object.entries(p.data.body[locale].copy).filter(([key])=>['heroTitle','heroAccent','heroDescription','aboutCopy','aboutApproach'].includes(key)).map(([key,text])=><p key={key}>{Array.isArray(text)?text.join(' · '):text}</p>)}{p.data.body[locale].leadership&&<><h3>{p.data.body[locale].leadership.name}</h3><p>{p.data.body[locale].leadership.designation}</p><p>{p.data.body[locale].leadership.biography}</p></>}</article>)}</div>;
}
