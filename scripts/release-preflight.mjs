// Read-only: reports missing settings without printing secrets or changing targets.
import {existsSync,readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
const args=process.argv.slice(2);
if(args.length){
 if(args.length!==2||args[0]!=='--env-file')throw Error('Usage: node scripts/release-preflight.mjs [--env-file PRIVATE_ENV_FILE]');
 Object.assign(process.env,parseEnv(readFileSync(args[1],'utf8')));
}else for(const file of ['.env','.env.local'])if(existsSync(file))process.loadEnvFile(file);
const failures=[];
function requireValue(key){if(!process.env[key])failures.push(key+' missing');}
for(const key of ['DATABASE_URL','DIRECT_URL','BETTER_AUTH_URL','BETTER_AUTH_SECRET','AIA_S3_BUCKET','AIA_S3_ACCESS_KEY_ID','AIA_S3_SECRET_ACCESS_KEY','AIA_PDF_BROWSER_WS'])requireValue(key);
for(const key of ['DATABASE_URL','DIRECT_URL']){try{const url=new URL(process.env[key]);if(['localhost','127.0.0.1','[::1]'].includes(url.hostname))failures.push(key+' points to local development');if(!['require','verify-full','verify-ca'].includes(url.searchParams.get('sslmode')))failures.push(key+' requires reviewed TLS configuration');}catch{failures.push(key+' invalid');}}
try{if(new URL(process.env.BETTER_AUTH_URL).protocol!=='https:')failures.push('HTTPS authentication origin missing');}catch{failures.push('Authentication origin invalid');}
for(const key of ['AIA_BUSINESS_ENABLED','AIA_MFA_ENABLED','AIA_PRODUCTION_AUTH_VERIFIED','AIA_STORAGE_PRIVATE_VERIFIED'])if(process.env[key]!=='true')failures.push(key+' not verified/enabled');
try{if(new URL(process.env.AIA_PDF_BROWSER_WS).protocol!=='wss:')failures.push('PDF browser must use wss');}catch{failures.push('PDF browser endpoint invalid');}
if((process.env.BETTER_AUTH_SECRET||'').length<32)failures.push('Authentication secret too short');
if(process.env.AIA_STORAGE_DRIVER!=='s3')failures.push('Production storage must use s3');
if(!existsSync('.vercel/project.json'))failures.push('Vercel project not linked in this checkout');
console.log(JSON.stringify({ready:failures.length===0,blockers:failures,readOnly:true,ownerMfaRotationStillRequiresPersonalVerification:true},null,2));if(failures.length)process.exitCode=1;
