import { browser, delay } from './lib/cdp.mjs';
const b = await browser();
try {
  await b.viewport(1440);
  for (const route of ['dashboard','documents','quotations']) {
    await b.navigate('http://localhost:3000/en/admin-preview/'+route, '!!document.querySelector(".a-workspace")');
    await delay(1500);
    console.log(JSON.stringify({route, diagnostic: await b.evaluate(`(()=>({visible:!!document.querySelector('.a-workspace')?.getClientRects().length,body:document.body.innerText.slice(0,180),badge:[...document.querySelectorAll('nextjs-portal')].map(p=>[...p.shadowRoot.querySelectorAll('button,[role=menuitem]')].map(e=>({label:e.getAttribute('aria-label'),text:e.textContent})))}))()`)}));
  }
  console.log(JSON.stringify({errors:b.errors}));
} finally { await b.close(); }
