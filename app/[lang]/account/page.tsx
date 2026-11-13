import {Suspense} from 'react';
import {connection} from 'next/server';
import {notFound,redirect} from 'next/navigation';
import {isLocale} from '@/lib/i18n';
import {principal} from '@/lib/server/security';
import {CustomerAccount} from '@/components/auth/customer-account';
import '../../admin.css';
export const metadata={title:'Your quotations',robots:{index:false,follow:false}};
async function Account({params}:{params:Promise<{lang:string}>}){await connection();const {lang}=await params;if(!isLocale(lang))notFound();const actor=await principal();if(!actor)redirect(`/${lang}/login`);if(!actor.customerOnly)redirect(`/${lang}/admin`);return <CustomerAccount locale={lang}/>;}
export default function Page(props:{params:Promise<{lang:string}>}){return <Suspense fallback={<p>Loading account…</p>}><Account {...props}/></Suspense>;}
