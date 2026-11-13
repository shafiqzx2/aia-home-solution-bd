import {amount,decimal} from './finance.ts';
// Largest remainders conserve the original total across discounted/taxed lines.
export function allocateReturnCredits(total:string,lines:{id:string;position:number;lineTotal:string}[]){
 const cents=amount(total),weights=lines.map(line=>({...line,weight:amount(line.lineTotal)})),subtotal=weights.reduce((n,l)=>n+l.weight,BigInt(0));
 if(cents<BigInt(0)||subtotal<=BigInt(0)||weights.some(l=>l.weight<BigInt(0))||new Set(lines.map(l=>l.id)).size!==lines.length)throw Error('Invalid return allocation');
 const parts=weights.map(l=>({...l,cents:cents*l.weight/subtotal,remainder:cents*l.weight%subtotal}));let remaining=cents-parts.reduce((n,l)=>n+l.cents,BigInt(0));
 const ranked=[...parts].sort((a,b)=>a.remainder===b.remainder?a.position-b.position:a.remainder>b.remainder?-1:1);for(const part of ranked){if(remaining===BigInt(0))break;part.cents++;remaining--;}
 return Object.fromEntries(parts.map(l=>[l.id,decimal(l.cents)]));
}
