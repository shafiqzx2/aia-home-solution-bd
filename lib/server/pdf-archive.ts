import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {prisma} from '@/lib/prisma';
import {HttpError} from './security';
import {getObject} from './object-storage';
let fontCache:Promise<string>|undefined;
function fonts(){return fontCache??= (async()=>{const chunks=path.join(process.cwd(),'.next','static','chunks'),rules=new Set<string>();for(const file of (await readdir(chunks)).filter(name=>name.endsWith('.css'))){const css=await readFile(path.join(chunks,file),'utf8');for(const rule of css.match(/@font-face\{font-family:(?:Geist|Hind Siliguri);[^}]*\}/g)||[]){const match=rule.match(/url\(\.\.\/media\/([a-zA-Z0-9_.-]+\.woff2)\)/);if(match){const bytes=await readFile(path.join(process.cwd(),'.next','static','media',match[1]));rules.add(rule.replace(match[0],`url(data:font/woff2;base64,${bytes.toString('base64')})`).replace('font-display:swap','font-display:block'));}}}return [...rules].join('\n');})();}
export async function pdfBytes(html:string){
 html=html.replace('</head>',`<style>${await fonts()}</style></head>`);
 const sources=[...new Set([...html.matchAll(/src="([^"]+)"/g)].map(match=>match[1]))];
 for(const src of sources){let bytes:Buffer,mime:string;
  if(/^\/api\/media\/[a-zA-Z0-9_-]+$/.test(src)){const asset=await prisma.mediaAsset.findUnique({where:{id:src.split('/').at(-1)}});if(!asset||asset.status!=='READY'||!asset.mimeType.startsWith('image/'))throw new HttpError(422,'DOCUMENT_IMAGE_UNAVAILABLE');bytes=await getObject(asset.objectKey,asset.bucket);mime=asset.mimeType;}
  else{if(!/^\/(branding|images)\/[a-zA-Z0-9/_.-]+\.(png|webp|jpe?g)$/.test(src)||src.includes('..'))throw new HttpError(422,'DOCUMENT_IMAGE_REJECTED');bytes=await readFile(path.join(process.cwd(),'public',src));mime=src.endsWith('.png')?'image/png':src.endsWith('.webp')?'image/webp':'image/jpeg';}
  html=html.replaceAll(`src="${src}"`,`src="data:${mime};base64,${bytes.toString('base64')}"`);
 }
 const remote=process.env.AIA_PDF_BROWSER_WS;
 if(remote&&new URL(remote).protocol!=='wss:')throw new HttpError(503,'PDF_BROWSER_HTTPS_REQUIRED');
 if(!remote&&(process.env.VERCEL||process.env.AIA_STORAGE_DRIVER!=='local'))throw new HttpError(503,'PDF_BROWSER_NOT_CONFIGURED');
 let browser;
 try{browser=remote?await chromium.connectOverCDP(remote,{timeout:20000}):await chromium.launch({executablePath:process.env.AIA_PDF_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const context=await browser.newContext({javaScriptEnabled:false});await context.route('**/*',route=>route.abort());const page=await context.newPage();await page.setContent(html,{waitUntil:'load',timeout:15000});await page.evaluate(async()=>{await document.fonts.ready;});await page.emulateMedia({media:'print'});const bytes=await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});if(bytes.length>10*1024*1024)throw new HttpError(413,'PDF_TOO_LARGE');return bytes;
 }catch(error){if(error instanceof HttpError)throw error;throw new HttpError(503,'PDF_RENDERER_UNAVAILABLE');}finally{await browser?.close();}
}
