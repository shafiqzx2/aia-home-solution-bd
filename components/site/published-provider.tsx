"use client";
import {createContext,useContext,type ReactNode} from "react";
import {usePathname} from "next/navigation";
import {staticSnapshot,type PublicSnapshot} from "@/lib/public-snapshot";
import {dictionaries,type Locale} from "@/lib/i18n";
const PublishedContext=createContext<PublicSnapshot>(staticSnapshot);
export function PublishedProvider({value,children}:{value:PublicSnapshot;children:ReactNode}){return <PublishedContext.Provider value={value}>{children}</PublishedContext.Provider>;}
export const usePublished=()=>useContext(PublishedContext);
export function useSiteCopy(locale:Locale){
  const data=usePublished(),path=usePathname().split('/').filter(Boolean)[1]||'home';
  return {...dictionaries[locale],...data.pages.global?.[locale]?.body.copy,...data.pages[path]?.[locale]?.body.copy} as typeof dictionaries[typeof locale];
}
