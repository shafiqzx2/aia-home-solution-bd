import {createHmac,timingSafeEqual} from 'node:crypto';
export function base32(value:Uint8Array){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits=0,buffer=0,result='';for(const byte of value){buffer=(buffer<<8)|byte;bits+=8;while(bits>=5){bits-=5;result+=alphabet[(buffer>>>bits)&31];}}if(bits)result+=alphabet[(buffer<<(5-bits))&31];return result;}
export function authenticatorCode(secret:string,time=Date.now()){
 const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(time/30000)));
 const hash=createHmac('sha1',Buffer.from(secret)).update(counter).digest(),offset=hash[hash.length-1]&15;
 return ((hash.readUInt32BE(offset)&0x7fffffff)%1000000).toString().padStart(6,'0');
}
export function verifyAuthenticator(secret:string,code:string){if(!/^\d{6}$/.test(code))return false;return [-30000,0,30000].some(offset=>timingSafeEqual(Buffer.from(authenticatorCode(secret,Date.now()+offset)),Buffer.from(code)));}
