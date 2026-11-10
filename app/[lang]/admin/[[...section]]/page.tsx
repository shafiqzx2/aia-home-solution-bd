import {Suspense} from 'react';
import {connection} from 'next/server';
import {redirect,notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {HttpError,principal} from '@/lib/server/security';
import {Workspace as PremiumWorkspace} from '@/components/admin/workspace';
import {canonicalModule,canOpenModule} from '@/lib/business/workspace-access';
import {workspaceModules} from '@/lib/business/modules';
import {isLocale} from '@/lib/i18n';
import '@/app/admin.css';
export const metadata:Metadata={robots:{index:false,follow:false}};
type Props={params:Promise<{lang:string;section?:string[]}>};
async function Workspace({params}:Props){await connection();const {lang,section=[]}=await params;if(!isLocale(lang))notFound();let actor;try{actor=await principal();}catch(error){if(error instanceof HttpError&&error.code==="MFA_REQUIRED")redirect(`/${lang}/security`);throw error;}if(!actor||actor.customerOnly)redirect(`/${lang}/login`);const id=canonicalModule(section[0]||'dashboard');if(section.length>1||!workspaceModules.some(m=>m.id===id))notFound();if(!canOpenModule(actor,id))redirect(`/${lang}/admin/dashboard`);if(section[0]!==id)redirect(`/${lang}/admin/${id}`);return <PremiumWorkspace actor={actor} locale={lang} initialSection={id}/>;}
export default function Page(props:Props){return <Suspense fallback={<main>Opening secure workspace</main>}><Workspace {...props}/></Suspense>;}
