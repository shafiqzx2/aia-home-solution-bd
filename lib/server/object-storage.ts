import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {S3Client,PutObjectCommand,GetObjectCommand} from '@aws-sdk/client-s3';
export const digest=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
export function storageConfiguration(){
 if(process.env.AIA_STORAGE_DRIVER==='local'){
  if(process.env.VERCEL||!['localhost','127.0.0.1'].includes(new URL(process.env.BETTER_AUTH_URL||'https://invalid').hostname)||!['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL||'https://invalid').hostname))throw Error('LOCAL_STORAGE_FORBIDDEN');
  return {driver:'local' as const,bucket:'local-private'};
 }
 if(process.env.AIA_STORAGE_DRIVER!=='s3'||!process.env.AIA_S3_BUCKET||!process.env.AIA_S3_ACCESS_KEY_ID||!process.env.AIA_S3_SECRET_ACCESS_KEY||process.env.AIA_STORAGE_PRIVATE_VERIFIED!=='true')throw Error('PRIVATE_STORAGE_NOT_CONFIGURED');
 if(process.env.AIA_S3_ENDPOINT&&new URL(process.env.AIA_S3_ENDPOINT).protocol!=='https:')throw Error('STORAGE_HTTPS_REQUIRED');
 return {driver:'s3' as const,bucket:process.env.AIA_S3_BUCKET};
}
function localPath(key:string){if(!/^(images|documents)\/[a-f0-9-]+\.(webp|pdf)$/.test(key))throw Error('INVALID_OBJECT_KEY');return path.join(process.cwd(),'.media','objects',key);}
function client(){return new S3Client({region:process.env.AIA_S3_REGION||'auto',...(process.env.AIA_S3_ENDPOINT?{endpoint:process.env.AIA_S3_ENDPOINT}:{}),forcePathStyle:process.env.AIA_S3_PATH_STYLE==='true',credentials:{accessKeyId:process.env.AIA_S3_ACCESS_KEY_ID!,secretAccessKey:process.env.AIA_S3_SECRET_ACCESS_KEY!}});}
export async function putObject(key:string,bytes:Buffer,mime:string){const config=storageConfiguration();localPath(key);if(config.driver==='local'){const file=localPath(key);await mkdir(path.dirname(file),{recursive:true,mode:0o700});await writeFile(file,bytes,{flag:'wx',mode:0o600});}else await client().send(new PutObjectCommand({Bucket:config.bucket,Key:key,Body:bytes,ContentType:mime,IfNoneMatch:'*'}));return 'aia-private-v1';}
export async function getObject(key:string,bucket:string){const config=storageConfiguration();localPath(key);if(config.bucket!==bucket&&bucket!=='aia-private-v1')throw Error('STORAGE_BUCKET_CHANGED');if(config.driver==='local')return readFile(localPath(key));const object=await client().send(new GetObjectCommand({Bucket:config.bucket,Key:key}));if(!object.Body)throw Error('OBJECT_UNAVAILABLE');return Buffer.from(await object.Body.transformToByteArray());}
