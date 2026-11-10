import sharp from 'sharp';
import type {Prisma} from '@prisma/client';
import {HttpError} from './security';
export const MAX_IMAGE_BYTES=3*1024*1024;
export async function sanitizeImage(bytes:Buffer,mime:string){
 if(!bytes.length||bytes.length>MAX_IMAGE_BYTES)throw Error('IMAGE_SIZE_REJECTED');
 const actual=bytes.subarray(0,3).equals(Buffer.from([255,216,255]))?'image/jpeg':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'?'image/webp':null;
 if(actual!==mime||!actual)throw Error('IMAGE_FORMAT_REJECTED');
 const image=sharp(bytes,{limitInputPixels:20000000,failOn:'warning'}),metadata=await image.metadata();
 if(!metadata.width||!metadata.height||(metadata.pages||1)>1||metadata.width>8000||metadata.height>8000)throw Error('IMAGE_DIMENSIONS_REJECTED');
 const result=await image.rotate().resize({width:4096,height:4096,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer({resolveWithObject:true});if(result.data.length>MAX_IMAGE_BYTES)throw Error('IMAGE_SIZE_REJECTED');return result;
}
export async function publicMediaReferences(tx:Pick<Prisma.TransactionClient,'mediaAsset'>,value:unknown){
 const ids=[...new Set((JSON.stringify(value).match(/\/api\/media\/[a-zA-Z0-9_-]+/g)||[]).map(url=>url.split('/').at(-1)!))];
 if(ids.length&&await tx.mediaAsset.count({where:{id:{in:ids},visibility:'PUBLIC',status:'READY',mimeType:{in:['image/webp','image/png','image/jpeg']}}})!==ids.length)throw new HttpError(422,'PUBLIC_MEDIA_REQUIRED');
}
