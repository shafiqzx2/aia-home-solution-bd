import {Suspense} from "react";
import {notFound} from "next/navigation";
import {isLocale} from "@/lib/i18n";
import {OnboardingPanel} from "@/components/auth/onboarding-panel";
export const metadata={title:'Account onboarding',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{lang:string}>}){const {lang}=await params;if(!isLocale(lang))notFound();return <Suspense fallback={null}><OnboardingPanel locale={lang}/></Suspense>;}
