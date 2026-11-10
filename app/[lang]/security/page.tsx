import {Suspense} from 'react';
import {connection} from 'next/server';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {getAuth} from '@/lib/server/auth';
import {businessEnabled} from '@/lib/server/config';
import {isLocale} from '@/lib/i18n';
import {SecurityPanel} from '@/components/auth/security-panel';
export const metadata={title:'Account security',robots:{index:false,follow:false}};
async function Security({params}:{params:Promise<{lang:string}>}){await connection();const {lang}=await params;if(!isLocale(lang))notFound();const session=businessEnabled()?await getAuth().api.getSession({headers:await headers(),query:{disableCookieCache:true}}):null;return <SecurityPanel locale={lang} signedIn={!!session} enabled={process.env.AIA_MFA_ENABLED==='true'}/>;}
export default function Page(props:{params:Promise<{lang:string}>}){return <Suspense fallback={<main>Opening account security…</main>}><Security {...props}/></Suspense>;}
