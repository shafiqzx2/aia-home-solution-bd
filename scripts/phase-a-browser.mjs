import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { browser, delay } from './lib/cdp.mjs';
import { renderQuotation, renderLetter, renderEmail } from '../lib/business/documents.ts';
import { quotationFixture, letterFixture } from './fixtures/phase-a.mjs';

const origin = 'http://localhost:3000';
const productionOrigin = process.env.AIA_REVIEW_PRODUCTION_URL || 'http://localhost:3002';
const output = path.resolve('docs/phase-a-review');
await mkdir(output, { recursive: true });
const b = await browser(), checks = [], pdfs = [];
function check(label, ok, detail) { checks.push({ label, passed: !!ok, ...(detail === undefined ? {} : { detail }) }); if (!ok) console.error('FAIL:', label, detail); }
async function screenshot(name) { await writeFile(path.join(output, name), await b.screenshot()); }
async function theme(mode) { await b.evaluate(`document.documentElement.dataset.theme=${JSON.stringify(mode)};localStorage.setItem('aia-theme',${JSON.stringify(mode)})`); await delay(80); }
async function overflow() { return b.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})'); }
try {
  await b.viewport(1440);
  await b.navigate(origin + '/en/admin-preview/settings', '!!document.querySelector(".a-workspace")');
  const company = await b.evaluate(`(()=>{const v=label=>[...document.querySelectorAll('label')].find(l=>l.querySelector('span')?.textContent===label)?.querySelector('input,textarea')?.value||'';return {name:v('Official company name'),address:v('Office address'),phone:v('Phone'),email:v('Contact email'),logo:v('Official letterhead logo'),documentFooter:''}})()`);
  company.logo = JSON.parse(await readFile('public/branding/asset-manifest.json', 'utf8')).light.src;
  check('Existing factual company identity is shared with previews', company.name === 'AIA Home Solutions BD' && company.email === 'info@aiagroupbd.com');
  const fontCss = await b.evaluate(`(()=>{let rules=[];for(const s of document.styleSheets){try{for(const r of s.cssRules){if(r instanceof CSSFontFaceRule)rules.push(r.cssText.replace(/url\\(["']?([^)'" ]+)["']?\\)/g,(_,u)=>'url("'+new URL(u,s.href||location.href).href+'")'))}}catch{}}return rules.join('\\n')})()`);
  check('Document fonts include the installed Bengali typeface', /Hind Siliguri/.test(fontCss));
  await b.fill('Official company name', 'LOCAL TEST IDENTITY');
  await b.evaluate(`document.querySelector('form').requestSubmit()`);
  await b.clickText('Quotation Studio');
  check('Local settings propagate to new quotation previews', await b.evaluate(`document.querySelector('iframe').contentDocument.body.textContent.includes('LOCAL TEST IDENTITY')`));
  await b.navigate(origin + '/en/admin-preview/quotations', '!!document.querySelector(".a-workspace")');
  await b.fill('Client / organization', 'TEST FIXTURE · Not a real customer');
  await b.fill('Recipient email', 'fixture@example.invalid');
  await b.fill('Document date', '2026-11-08');
  await b.fill('Valid until', '2026-11-22');
  await b.clickText('Add custom line');
  await b.fill('Description · item 1', 'TEST ONLY · Architectural lighting review\nবাংলা অক্ষর ও যুক্তাক্ষর পরীক্ষা');
  await b.fill('Quantity', '2'); await b.fill('Unit price · BDT', '100.25');
  await b.fill('Discount · fixed BDT', '10.50'); await b.fill('Tax percentage', '7.50'); await b.fill('Service / delivery charges · BDT', '25');
  check('Manual quotation without incoming request computes exact total', await b.evaluate(`document.querySelector('.a-editor-total').textContent.includes('229.25')`));
  check('Live preview uses exact calculated total and Bengali content', await b.evaluate(`document.querySelector('iframe').contentDocument.body.textContent.includes('229.25')&&document.querySelector('iframe').contentDocument.body.textContent.includes('বাংলা')`));
  await b.clickText('Save draft locally');
  check('Saving explicitly reports tab-local persistence', await b.evaluate(`document.querySelector('[role="status"]').textContent.includes('this tab only')`));
  await b.clickText('Duplicate'); await b.fill('Client / organization', 'TEST DUPLICATE'); await b.clickText('Save draft locally');
  check('Duplicated quotation can be saved as a distinct local draft', await b.evaluate(`document.querySelectorAll('.a-saved-drafts button').length===2`));
  await b.clickText('Catalog');
  await b.evaluate(`document.querySelector('.a-catalog-picker button').click()`);
  check('Existing catalog entries can be added without a public price', await b.evaluate(`document.querySelectorAll('.a-line').length===2`));
  await b.evaluate(`document.querySelector('[aria-label="Remove item 2"]').click()`);
  await b.fill('Tax percentage', '101');
  check('Invalid financial inputs block preview', await b.evaluate(`document.querySelector('[role="alert"]')?.textContent.includes('cannot exceed')`));
  await b.fill('Tax percentage', '7.50');
  for (const mode of ['light', 'dark']) { await theme(mode); await b.viewport(1440); await screenshot(`quotation-desktop-${mode}.png`); await b.viewport(390, 1000); await screenshot(`quotation-mobile-${mode}.png`); }
  await b.viewport(1440); await theme('light'); await b.evaluate(`document.querySelector('.a-lines').scrollIntoView({block:'start'})`); await delay(100); await screenshot('quotation-lines-desktop-light.png'); await b.evaluate('scrollTo(0,0)');
  await b.clickText('Document Studio');
  await b.fill('Subject', 'TEST ONLY · Letterhead review'); await b.fill('Body · English or বাংলা', 'TEST FIXTURE\n\nবাংলা অক্ষর, যুক্তাক্ষর ও লেটারহেড পরীক্ষা।');
  await b.clickText('Apply template');
  check('Template application rejects missing required variables', await b.evaluate(`document.querySelector('[role="status"]').textContent.includes('Missing template variable')`));
  await b.viewport(1440); await theme('light'); await screenshot('document-studio-desktop-light.png');
  await b.clickText('Email Center'); await b.fill('Subject', 'TEST ONLY · Preview, no dispatch'); await b.fill('Message', 'This is a local review fixture.\nNo email has been sent.'); await b.clickText('Save locally');
  check('Email drafts stay local with no dispatch claim', await b.evaluate(`document.querySelector('[role="status"]').textContent.includes('No provider call')`));
  await screenshot('email-center-desktop-light.png');
  await b.clickText('Customer CRM'); await screenshot('customer-crm-desktop-light.png');
  await b.clickText('Operations'); await b.clickText('Map');
  check('Operations map has honest provider/location fallback', await b.evaluate(`document.body.textContent.includes('No mapping provider or authorized coordinates')`));
  for (const section of ['dashboard', 'quotations', 'customers', 'documents', 'email', 'operations', 'settings']) {
    await b.navigate(origin + '/en/admin-preview/' + section, '!!document.querySelector(".a-workspace")');
    for (const mode of ['light', 'dark']) {
      await theme(mode);
      for (const width of [320, 390, 768, 1440]) {
        await b.viewport(width);
        const dimensions = await overflow();
        check(`${section} ${mode} ${width}px has no page overflow`, dimensions.scroll <= dimensions.width + 1, dimensions);
        if (section === 'dashboard' && (width === 390 || width === 1440)) await screenshot(`dashboard-${width}-${mode}.png`);
        if (['customers', 'documents', 'email'].includes(section) && (width === 390 || width === 1440)) await screenshot(`${section}-${width}-${mode}.png`);
      }
    }
  }
  await b.viewport(390); await b.evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`);
  check('Mobile navigation opens', await b.evaluate(`document.querySelector('.a-workspace').classList.contains('a-mobile-open')`));
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  check('Mobile Escape closes the drawer and restores trigger focus', await b.evaluate(`!document.querySelector('.a-workspace').classList.contains('a-mobile-open') && document.activeElement===document.querySelector('[aria-label="Open navigation"]')`));
  check('Hidden mobile navigation is removed from keyboard visibility', await b.evaluate(`getComputedStyle(document.querySelector('.a-sidebar')).visibility==='hidden'`));
  await b.evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`);
  await b.clickText('Quotation Studio');
  check('Mobile navigation closes after selection', await b.evaluate(`!document.querySelector('.a-workspace').classList.contains('a-mobile-open')`));
  await b.viewport(1440); await b.navigate(origin + '/en/admin-preview', '!!document.querySelector(".a-workspace")');
  await b.evaluate(`document.querySelector('[aria-label="Collapse sidebar"]').click()`);
  check('Desktop sidebar collapses', await b.evaluate(`document.querySelector('.a-workspace').classList.contains('a-collapsed')`));
  await b.evaluate(`document.querySelector('[aria-label="Expand sidebar"]').click()`);
  await b.fill('Date range', '7'); await b.clickText('Quotation value');
  check('Dashboard filters describe the selected empty period honestly', await b.evaluate(`document.querySelector('.a-chart-empty').textContent.includes('last 7 days')`));
  await b.evaluate(`const el=document.querySelector('[aria-label="Search workspace modules"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'quotation');el.dispatchEvent(new Event('input',{bubbles:true}))`);
  check('Workspace module search filters navigation', await b.evaluate(`document.querySelectorAll('.a-sidebar nav button').length===1`));
  for (const route of ['/en', '/bn', '/en/products', '/en/services', '/en/cart', '/en/request', '/en/login']) {
    const r = await fetch(origin + route); check(`Preserved public route ${route}`, r.ok);
  }
  const api = await fetch(origin + '/api/admin/quotations'); check('Admin API fails closed with no-store', api.status === 401 && api.headers.get('cache-control').includes('no-store'));
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const response = await fetch(origin + '/api/admin/quotations', { method });
    check(`Unauthenticated ${method} cannot mutate admin records`, response.status === 401 && response.headers.get('cache-control').includes('no-store'));
  }
  const auth = await fetch(origin + '/en/admin/quotations', { redirect: 'manual' }); check('Admin route redirects to unified login', [307, 308].includes(auth.status) && auth.headers.get('location') === '/en/login');
  // Real render fixtures: shared HTML master + existing licensed fonts + logo.
  async function embed(html) {
    html = html.replaceAll(company.logo, 'data:image/webp;base64,' + (await readFile(path.resolve('public' + company.logo))).toString('base64'));
    for (const url of [...new Set([...html.matchAll(/url\("(http[^"\n]+)"\)/g)].map(m => m[1]))]) {
      const response = await fetch(url); if (!response.ok) throw new Error('Document font could not be loaded');
      html = html.replaceAll(url, 'data:font/woff2;base64,' + Buffer.from(await response.arrayBuffer()).toString('base64'));
    }
    return html;
  }
  async function print(name, html) {
    const embedded = await embed(html), htmlFile = path.join(output, `${name}.html`);
    await writeFile(htmlFile, embedded);
    await b.navigate(pathToFileURL(htmlFile).href, '!!document.querySelector(".paper,.email-body")');
    const r = await b.send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
    const bytes = Buffer.from(r.data, 'base64'); await writeFile(path.join(output, `${name}.pdf`), bytes);
    const pages = (bytes.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
    const box = bytes.toString('latin1').match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
    return { name, pages, bytes: bytes.length, widthPt: box ? Number(box[1]) : null, heightPt: box ? Number(box[2]) : null, fontsEmbedded: /\/FontFile[23]?\b/.test(bytes.toString('latin1')) };
  }
  for (const [pages, initialCount] of [[1, 3], [2, 18], [5, 65]]) {
    let count = initialCount, result;
    for (let attempt = 0; attempt < 40; attempt++) { result = await print(`quotation-${pages}-page`, renderQuotation(quotationFixture(count), company, 'en', fontCss)); if (result.pages === pages) break; const next = Math.max(1, count + (result.pages < pages ? 1 : -1)); if (count === next) break; count = next; }
    check(`Real quotation PDF has exactly ${pages} A4 page(s)`, result.pages === pages, { ...result, lineCount: count }); pdfs.push({ ...result, lineCount: count });
  }
  for (const [name, draft, locale] of [
    ['quotation-bengali', quotationFixture(4, 'bn'), 'bn'],
    ['quotation-long-description', quotationFixture(3, 'en', { items: [{ ...quotationFixture(1).items[0], description: 'TEST ONLY · ' + 'Long product description with installation scope and layout requirements. '.repeat(18) }] }), 'en'],
    ['quotation-large-amount', quotationFixture(1, 'en', { discount: '0', taxPercent: '0', charges: '0', items: [{ ...quotationFixture(1).items[0], quantity: '1', unitPrice: '999999999999.99' }] }), 'en'],
    ['quotation-empty-optional', quotationFixture(1, 'en', { address: '', attention: '', email: '', project: '', validUntil: '', terms: '', paymentTerms: '', deliveryTerms: '', notes: '' }), 'en'],
  ]) pdfs.push(await print(name, renderQuotation(draft, company, locale, fontCss)));
  for (const locale of ['en', 'bn']) pdfs.push(await print(`letter-${locale}`, renderLetter(letterFixture(locale), company, locale, fontCss)));
  pdfs.push(await print('email-preview', renderEmail('TEST ONLY · Branded email review', 'This is a local fixture. No email has been sent.', company)));
  for (const pdf of pdfs) {
    check(`${pdf.name} has A4 portrait dimensions`, Math.abs(pdf.widthPt - 595.28) < 2 && Math.abs(pdf.heightPt - 841.89) < 2, { widthPt: pdf.widthPt, heightPt: pdf.heightPt });
    check(`${pdf.name} embeds document fonts`, pdf.fontsEmbedded);
  }
  await b.viewport(1000, 1350);
  for (const name of ['quotation-1-page', 'quotation-2-page', 'quotation-5-page', 'quotation-bengali', 'quotation-long-description', 'quotation-large-amount', 'letter-en', 'letter-bn']) {
    await b.send('Page.navigate', { url: pathToFileURL(path.join(output, name + '.pdf')).href }); await delay(1500); await screenshot(name + '-render.png');
  }
  for (const [name, page] of [['quotation-2-page', 2], ['quotation-5-page', 3], ['quotation-5-page', 5]]) {
    await b.send('Page.navigate', { url: 'about:blank' }); await delay(100);
    await b.send('Page.navigate', { url: pathToFileURL(path.join(output, name + '.pdf')).href + '#page=' + page }); await delay(2000); await screenshot(name + '-page-' + page + '-render.png');
  }
  // Production safety is checked against a separate `next start --port 3002`.
  for (const route of ['/en/admin-preview', '/bn/admin-preview/quotations']) {
    const r = await fetch(productionOrigin + route); const html = await r.text();
    check(`Production build hides local workspace ${route}`, !html.includes('a-workspace') && !html.includes('Find a workspace'));
    check(`Production workspace URL is private and excluded from indexing ${route}`, r.headers.get('x-robots-tag')?.includes('noindex') && r.headers.get('cache-control')?.includes('no-store'));
  }
  check('No business mutation HTTP calls during local editing', b.mutations.length === 0, b.mutations);
  check('No browser runtime or console errors', b.errors.length === 0, b.errors);
} finally {
  await writeFile(path.join(output, 'checks.json'), JSON.stringify({ timestamp: new Date().toISOString(), checks, pdfs, browserErrors: b.errors, mutations: b.mutations }, null, 2));
  await b.close();
}
const failed = checks.filter(c => !c.passed);
console.log(JSON.stringify({ checks: checks.length, passed: checks.length - failed.length, failed: failed.length, pdfs }, null, 2));
if (failed.length) process.exitCode = 1;
