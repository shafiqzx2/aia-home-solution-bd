// Small local Chromium harness. No npm install or browser download required.
import { spawn } from 'node:child_process';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
export const delay = ms => new Promise(r => setTimeout(r, ms));
export async function browser() {
  const profile = await mkdtemp(path.join(tmpdir(), 'aia-phase-a-'));
  const executable = process.env.AIA_REVIEW_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const child = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let browserLog = '';
  child.stderr.on('data', chunk => { browserLog = (browserLog + chunk).slice(-5000); });
  child.on('error', e => { console.error(e.message); });
  let address;
  for (let i = 0; i < 100; i++) {
    try { const ports = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n'); address = `ws://127.0.0.1:${ports[0]}${ports[1]}`; break; } catch { await delay(100); }
  }
  if (!address) { child.kill(); throw new Error('Could not start the configured headless browser'); }
  const socket = new WebSocket(address);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let sequence = 0, session;
  const pending = new Map(), errors = [], warnings = [], mutations = [];
  socket.onclose = () => { for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error("Headless browser connection closed: " + browserLog)); } pending.clear(); };
  function send(method, params = {}, root = false) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params, ...(!root && session ? { sessionId: session } : {}) }));
    });
  }
  socket.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) { const p = pending.get(m.id); if (!p) return; clearTimeout(p.timer); pending.delete(m.id); if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result); }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value || a.description || '').join(' '));
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'warning') warnings.push(m.params.args.map(a => a.value || a.description || '').join(' '));
    else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'warning') warnings.push(m.params.entry.text);
    else if (m.method === 'Network.requestWillBeSent') { const r = m.params.request; if (r.method !== 'GET' && /localhost/.test(r.url) && !/_next|__nextjs/.test(r.url)) mutations.push({ url: r.url, method: r.method }); }
  };
  const target = await send('Target.createTarget', { url: 'about:blank' }, true);
  ({ sessionId: session } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }, true));
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Log.enable');
  async function evaluate(expression) {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  }
  async function until(expression) {
    for (let i = 0; i < 200; i++) { if (await evaluate(expression)) return; await delay(100); }
    throw new Error(`Browser wait failed: ${expression}`);
  }
  async function navigate(url, ready = '!!document.querySelector("h1")') {
    await send('Page.navigate', { url });
    await until(`document.readyState === 'complete' && (${ready})`);
    await evaluate('document.fonts.ready.then(()=>true)'); await delay(100);
  }
  async function viewport(width, height = 1050) { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }); await delay(80); }
  async function screenshot() { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); return Buffer.from(r.data, 'base64'); }
  async function clickText(text) { await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Button missing: '+${JSON.stringify(text)});b.click()})()`); await delay(100); }
  async function fill(label, value) {
    await evaluate(`(()=>{const l=[...document.querySelectorAll('label')].find(l=>l.querySelector('span')?.textContent.trim()===${JSON.stringify(label)});const el=l?.querySelector('input,textarea,select');if(!el)throw Error('Field missing: '+${JSON.stringify(label)});const proto=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`);
    await delay(60);
  }
  return { send, evaluate, until, navigate, viewport, screenshot, clickText, fill, errors, warnings, mutations,
    close: async () => { try { await send('Browser.close', {}, true); } catch {} socket.close(); child.kill(); } };
}
