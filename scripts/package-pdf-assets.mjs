// Generated font assets may not exist when Next evaluates tracing include globs.
// Complete both PDF function traces after the build, before Vercel packages them.
import {readFileSync,readdirSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=process.cwd(),chunks=path.join(root,'.next/static/chunks');
const cssFiles=readdirSync(chunks).filter(name=>name.endsWith('.css')).map(name=>path.join(chunks,name));
const assets=new Set(cssFiles);
let fontFaces=0;
for(const file of cssFiles){
 const css=readFileSync(file,'utf8');
 for(const rule of css.match(/@font-face\{font-family:(?:Geist|Hind Siliguri);[^}]*\}/g)||[]){
  const match=rule.match(/url\(\.\.\/media\/([a-zA-Z0-9_.-]+\.woff2)\)/);
  assert(match,'PDF font URL format changed; update renderer and packaging together');
  const font=path.join(root,'.next/static/media',match[1]);
  assert(existsSync(font),'PDF font file missing');assets.add(font);fontFaces++;
 }
}
assert(fontFaces>0,'English/Bengali PDF fonts missing from generated CSS');
for(const route of ['archive/[resource]/[version]','workflows/[...path]']){
 const traceFile=path.join(root,'.next/server/app/api/admin',route,'route.js.nft.json');
 const trace=JSON.parse(readFileSync(traceFile,'utf8'));
 trace.files=[...new Set([...trace.files,...[...assets].map(file=>path.relative(path.dirname(traceFile),file).replaceAll('\\','/'))])];
 writeFileSync(traceFile,JSON.stringify(trace));
}
console.log(`PDF packaging verified: ${fontFaces} font faces, ${assets.size} assets in both function traces.`);
