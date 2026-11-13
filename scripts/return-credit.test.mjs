import test from 'node:test';
import assert from 'node:assert/strict';
import {allocateReturnCredits} from '../lib/business/return-credit.ts';
import {amount} from '../lib/business/finance.ts';
test('Discount/tax/charge return allocation conserves every cent, including free goods',()=>{
 const lines=[{id:'first',position:1,lineTotal:'1.00'},{id:'second',position:2,lineTotal:'1.00'},{id:'third',position:3,lineTotal:'1.00'},{id:'free',position:4,lineTotal:'0.00'}];
 assert.deepEqual(allocateReturnCredits('1.00',lines),{first:'0.34',second:'0.33',third:'0.33',free:'0.00'});
 assert.deepEqual(allocateReturnCredits('0.01',lines),{first:'0.01',second:'0.00',third:'0.00',free:'0.00'});
 const shares=allocateReturnCredits('53.70',[{id:'a',position:1,lineTotal:'25.00'},{id:'b',position:2,lineTotal:'25.00'}]);assert.equal(shares.a,'26.85');
});
test('Allocation is deterministic independent of input order and rejects invalid sources',()=>{
 for(let count=1;count<=100;count++){const lines=Array.from({length:count},(_,i)=>({id:String(i),position:i+1,lineTotal:'0.01'})),total=count%2?'999999999999.99':'0.01',shares=allocateReturnCredits(total,lines);assert.equal(Object.values(shares).reduce((n,v)=>n+amount(v),0n),amount(total));assert.deepEqual(allocateReturnCredits(total,[...lines].reverse()),shares);}
 assert.throws(()=>allocateReturnCredits('1.00',[{id:'a',position:1,lineTotal:'0.00'}]));
});
