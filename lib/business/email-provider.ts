import {createHmac,timingSafeEqual} from 'node:crypto';
export type DeliveryEmail={id:string;revision:number;subject:string;html:string;from:string|null;replyTo:string|null;to:string[];cc:string[];bcc:string[]};
export interface DeliveryProvider {send(email:DeliveryEmail,key:string):Promise<{providerId:string}>;}
export class DeliveryError extends Error {code:string;retryable:boolean;constructor(code:string,retryable:boolean){super(code);this.code=code;this.retryable=retryable;}}
export function emailSendingConfigured(env:Record<string,string|undefined>){return env.AIA_EMAIL_SENDING_ENABLED==='true'&&env.AIA_EMAIL_PROVIDER_VERIFIED==='true'&&env.AIA_EMAIL_PROVIDER==='resend'&&!!env.RESEND_API_KEY&&!!env.AIA_EMAIL_FROM&&!!env.RESEND_WEBHOOK_SECRET;}
export class ResendProvider implements DeliveryProvider {
 private key:string;private from:string;private transport:typeof fetch;
 constructor(key:string,from:string,transport:typeof fetch=fetch){this.key=key;this.from=from;this.transport=transport;}
 async send(email:DeliveryEmail,key:string){
  if(email.from!==this.from||!email.to.length||/[\r\n]/.test(email.subject))throw new DeliveryError('SENDER_OR_REVIEW_INVALID',false);
  let response:Response;try{response=await this.transport('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+this.key,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({from:this.from,to:email.to,...(email.cc.length?{cc:email.cc}:{}),...(email.bcc.length?{bcc:email.bcc}:{}),subject:email.subject,html:email.html,...(email.replyTo?{reply_to:email.replyTo}:{})}),signal:AbortSignal.timeout(15000)});}catch{throw new DeliveryError('PROVIDER_NETWORK_UNCERTAIN',true);}
  if(!response.ok)throw new DeliveryError('PROVIDER_HTTP_'+response.status,response.status===429||response.status>=500);
  let result:unknown;try{result=await response.json();}catch{throw new DeliveryError('PROVIDER_RESPONSE_UNCERTAIN',true);}if(!result||typeof result!=='object'||!('id' in result)||typeof result.id!=='string')throw new DeliveryError('PROVIDER_RESPONSE_UNCERTAIN',true);return {providerId:result.id};
 }
}
export function verifyEmailWebhook(raw:Uint8Array,headers:Headers,secret:string,now=Date.now()){
 const id=headers.get('svix-id')||'',timestamp=headers.get('svix-timestamp')||'',signatures=headers.get('svix-signature')||'';
 if(!id||id.length>200||!/^\d{10,13}$/.test(timestamp)||Math.abs(now/1000-Number(timestamp))>300||!secret.startsWith('whsec_'))throw Error('INVALID_SIGNATURE');
 const key=Buffer.from(secret.slice(6),'base64');if(key.length<16)throw Error('INVALID_SIGNATURE');const expected=createHmac('sha256',key).update(id+'.'+timestamp+'.').update(raw).digest();
 if(!signatures.split(' ').some(sig=>{const [version,value]=sig.split(',');if(version!=='v1'||!value)return false;const actual=Buffer.from(value,'base64');return actual.length===expected.length&&timingSafeEqual(actual,expected);}))throw Error('INVALID_SIGNATURE');
 const body=JSON.parse(Buffer.from(raw).toString('utf8')) as {type?:unknown;data?:{email_id?:unknown}};if(typeof body.type!=='string'||typeof body.data?.email_id!=='string'||body.data.email_id.length>200)throw Error('INVALID_EVENT');return {eventId:id,providerId:body.data.email_id,type:body.type};
}
