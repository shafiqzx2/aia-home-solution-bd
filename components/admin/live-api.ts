"use client";
import {useCallback,useEffect,useState} from "react";

export async function api<T>(path:string,method="GET",body?:unknown):Promise<T> {
  const response=await fetch(`/api/admin/${path}`,{method,cache:"no-store",headers:body===undefined?{}:{"Content-Type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const result=await response.json();
  if(!response.ok){if(response.status===401){const lang=location.pathname.startsWith('/bn/')?'bn':'en';location.replace(new URL(`/${lang}/login`,location.origin).href);}throw Error(result.error==='STALE_REVISION'?'This record changed. Reload before saving.':result.issues?.map((i:{path:string[];message:string})=>`${i.path.join('.')}: ${i.message}`).join('; ')||result.error||'Request failed.');}
  return result as T;
}
export function useRemote<T>(path:string|null) {
  const [data,setData]=useState<T|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0),[loadedPath,setLoadedPath]=useState<string|null>(null);
  useEffect(()=>{let active=true;if(!path)return;api<T>(path).then(result=>{if(active){setData(result);setError('');}}).catch(e=>{if(active){setData(null);setError(e.message);}}).finally(()=>{if(active){setLoading(false);setLoadedPath(path);}});return()=>{active=false;};},[path,revision]);
  const reload=useCallback(()=>{setLoading(true);setRevision(v=>v+1);},[]);
  return {data:loadedPath===path?data:null,error:loadedPath===path?error:'',loading:!!path&&(loading||loadedPath!==path),reload};
}
