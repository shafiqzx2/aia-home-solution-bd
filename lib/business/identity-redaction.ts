export function redactIdentities(value:unknown,emails:string[]):unknown {
 let serialized=JSON.stringify(value);
 for(const email of emails){const escaped=email.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');serialized=serialized.replace(new RegExp(escaped,'gi'),'[protected identity]');}
 return JSON.parse(serialized);
}
