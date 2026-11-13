"use client";
import {useState} from 'react';
import {api,useRemote} from './live-api';
import {Button} from './ui';
export function LiveNotifications(){const [error,setError]=useState('');const remote=useRemote<{id:string;kind:string;readAt:string|null;createdAt:string}[]>('notifications');return <section className="a-panel"><h2>Your notifications</h2>{(remote.error||error)&&<p role="alert">{remote.error||error}</p>}{remote.loading&&<p role="status">Loading notifications…</p>}{remote.data?.map(n=><article key={n.id}><h3>{n.kind}</h3><p>{new Date(n.createdAt).toLocaleString()} · {n.readAt?'Read':'Unread'}</p>{!n.readAt&&<Button secondary onClick={()=>void api('notifications/'+n.id,'PATCH',{read:true}).then(()=>{setError('');remote.reload();}).catch(()=>setError('Notification update failed. Retry.'))}>Mark as read</Button>}</article>)}{!remote.loading&&!remote.data?.length&&<p>No notifications recorded.</p>}</section>;}
