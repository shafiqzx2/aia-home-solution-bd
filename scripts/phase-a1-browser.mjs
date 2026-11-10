// Local-only functional and visual QA. No DB access, external dispatch or payment.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { browser, delay } from "./lib/cdp.mjs";
import {
  createDemoDataset,
  demoSaleDraft,
} from "../lib/business/demo-fixtures.ts";
import { quotationToMemo } from "../lib/business/sales.ts";
import {
  renderQuotation,
  renderSalesDocument,
  renderLetter,
} from "../lib/business/documents.ts";
import { letterFixture } from "./fixtures/phase-a.mjs";
const origin = "http://localhost:3000",
  production = "http://localhost:3002";
const output = path.resolve("docs/phase-a1-review");
await mkdir(output, { recursive: true });
const b = await browser(),
  checks = [],
  pdfs = [],
  diagnostics = [];
const check = (label, passed, detail) => {
  checks.push({
    label,
    passed: !!passed,
    ...(detail === undefined ? {} : { detail }),
  });
  if (!passed) console.error("FAIL " + label, detail || "");
};
const shot = async (name) =>
  writeFile(path.join(output, name + ".png"), await b.screenshot());
const goto = async (section) =>
  b.navigate(
    origin + "/en/admin-preview/" + section,
    '!!document.querySelector(".a-workspace[data-workspace-ready]")',
  );
const theme = async (mode) => {
  await b.evaluate(
    `document.documentElement.dataset.theme=${JSON.stringify(mode)};document.documentElement.style.colorScheme=${JSON.stringify(mode)}`,
  );
  await delay(80);
};
const set = async (selector, value) => {
  await b.evaluate(
    `(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing selector');const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`,
  );
  await delay(100);
};
try {
  await b.viewport(1440);
  await goto("settings");
  await theme("light");
  const company = await b.evaluate(
    `(()=>{const v=s=>[...document.querySelectorAll('label')].find(l=>l.querySelector('span')?.textContent===s)?.querySelector('input,textarea')?.value||'';return {name:v('Official company name'),address:v('Office address'),phone:v('Phone'),email:v('Contact email'),logo:v('Official letterhead logo'),documentFooter:''}})()`,
  );
  company.logo = JSON.parse(
    await readFile("public/branding/asset-manifest.json", "utf8"),
  ).light.src;
  const fontCss = await b.evaluate(
    `(()=>{const rules=[];for(const s of document.styleSheets){try{for(const r of s.cssRules){if(r instanceof CSSFontFaceRule)rules.push(r.cssText.replace(/url\\(["']?([^)'" ]+)["']?\\)/g,(_,u)=>'url("'+new URL(u,s.href||location.href).href+'")'))}}catch{}}return rules.join('\\n')})()`,
  );
  check(
    "Shared official identity and Bengali font are available",
    company.name === "AIA Home Solutions BD" &&
      company.email === "info@aiagroupbd.com" &&
      /Hind Siliguri/.test(fontCss),
  );
  await b.fill("Official company name", "LOCAL QA IDENTITY");
  await b.evaluate(`document.querySelector('form').requestSubmit()`);
  await b.clickText("Quotation Studio");
  await b.until(
    `!!document.querySelector('iframe')?.contentDocument?.body?.textContent.includes('LOCAL QA IDENTITY')`,
  );
  check("Company settings propagate to new document previews", true);
  await goto("products");
  await b.clickText("Add product");
  await b.fill("Product name", "QA DEMO Pendant");
  await b.fill("SKU", "DEMO-QA-100");
  await b.fill("Private unit price · BDT", "1200.50");
  await b.fill("Initial demo stock", "9");
  await b.clickText("Save local product");
  check(
    "Product creation updates local catalog",
    await b.evaluate(
      `document.querySelector('.a-table').textContent.includes('QA DEMO Pendant')`,
    ),
  );
  await b.evaluate(
    `document.querySelector('[aria-label="Edit DEMO-QA-100"]').click()`,
  );
  await b.fill("Product name", "QA DEMO Pendant Revised");
  await b.clickText("Save local product");
  check(
    "Product edits persist within workspace",
    await b.evaluate(
      `document.querySelector('.a-table').textContent.includes('QA DEMO Pendant Revised')`,
    ),
  );
  await b.evaluate(
    `document.querySelector('[aria-label="Archive DEMO-QA-100"]').click()`,
  );
  check(
    "Product archive changes demo state",
    await b.evaluate(
      `!!document.querySelector('[aria-label="Restore DEMO-QA-100"]')`,
    ),
  );
  await b.evaluate(
    `document.querySelector('[aria-label="Restore DEMO-QA-100"]').click()`,
  );
  await b.clickText("Add product");
  await b.fill("Product name", "Duplicate");
  await b.fill("SKU", "DEMO-QA-100");
  await b.clickText("Save local product");
  check(
    "Duplicate SKU is rejected",
    await b.evaluate(
      `document.querySelector('[role="alert"]').textContent.includes('already exists')`,
    ),
  );
  await b.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await b.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  check(
    "Product modal Escape closes and restores focus",
    await b.evaluate(
      `!document.querySelector('[role="dialog"]')&&document.activeElement.textContent.includes('Add product')`,
    ),
  );
  await set('[aria-label="Search demo products"]', "QA DEMO");
  check(
    "Product search filters table",
    await b.evaluate(`document.querySelectorAll('tbody tr').length===1`),
  );
  await set('[aria-label="Search demo products"]', "");
  await b.clickText("Next");
  check(
    "Product pagination changes page",
    await b.evaluate(
      `document.querySelector('.a-pagination').textContent.includes('Page 2')`,
    ),
  );
  await b.clickText("Previous");
  await b.clickText("Inventory");
  await b.evaluate(
    `document.querySelector('[aria-label="Adjust stock DEMO-QA-100"]').click()`,
  );
  await b.fill("Quantity change", "-999");
  await b.fill("Adjustment reason", "QA local stock test");
  await b.clickText("Record demo adjustment");
  check(
    "Negative resulting stock is blocked",
    await b.evaluate(
      `document.querySelector('[role="alert"]').textContent.includes('zero or more')`,
    ),
  );
  await b.fill("Quantity change", "-2");
  await b.clickText("Record demo adjustment");
  check(
    "Valid stock change is recorded locally",
    await b.evaluate(
      `document.querySelector('.a-record-list').textContent.includes('DEMO-QA-100')`,
    ),
  );
  await b.clickText("Roles");
  await b.evaluate(
    `document.querySelector('[aria-label="Product Staff: documents.create"]').click()`,
  );
  check(
    "Root reviewer can grant local scope with review entry",
    await b.evaluate(
      `document.querySelector('[aria-label="Product Staff: documents.create"]').checked&&document.body.textContent.includes('granted documents.create')`,
    ),
  );
  await set(".a-permission-review select", "DEMO-CONTENT");
  await b.evaluate(
    `document.querySelector('[aria-label="Product Staff: company.edit"]').click()`,
  );
  check(
    "Content Admin cannot escalate permissions",
    await b.evaluate(
      `!document.querySelector('[aria-label="Product Staff: company.edit"]').checked&&document.querySelector('[role="status"]').textContent.includes('Only the Root Admin')`,
    ),
  );
  await set(".a-permission-review select", "DEMO-ROOT");
  await b.clickText("Suspend demo access");
  check(
    "Root can simulate staff suspension",
    await b.evaluate(`document.body.textContent.includes('Suspended in demo')`),
  );
  await b.evaluate(
    `[...document.querySelectorAll('.a-role-list button')].find(e=>e.textContent.includes('Root Admin')).click()`,
  );
  check(
    "Root permission profile is immutable in matrix",
    await b.evaluate(
      `[...document.querySelectorAll('.a-matrix input')].every(i=>i.disabled&&i.checked)`,
    ),
  );
  await b.clickText("Inventory");
  check(
    "Stock adjustment log survives module navigation",
    await b.evaluate(
      `document.querySelector('.a-record-list').textContent.includes('DEMO-QA-100')`,
    ),
  );
  await b.clickText("Roles");
  check(
    "Staff suspension and permission log survive module navigation",
    await b.evaluate(
      `document.body.textContent.includes('Suspended in demo')&&document.body.textContent.includes('granted documents.create')`,
    ),
  );
  await set('[aria-label="Demo role for DEMO-STAFF-2"]', "Accounts Staff");
  check(
    "Root reviewer can assign a local staff role",
    await b.evaluate(
      `document.querySelector('[aria-label="Demo role for DEMO-STAFF-2"]').value==='Accounts Staff'`,
    ),
  );
  await set(".a-permission-review select", "DEMO-CONTENT");
  await set('[aria-label="Demo role for DEMO-STAFF-2"]', "Content Admin");
  check(
    "Content Admin cannot reassign staff roles",
    await b.evaluate(
      `document.querySelector('[aria-label="Demo role for DEMO-STAFF-2"]').value==='Accounts Staff'`,
    ),
  );
  await goto("memo-studio");
  await b.fill("Client / company", "Custom Demo Company");
  await b.fill("Document date", "2026-11-08");
  await b.clickText("Add item");
  await b.fill("Memo item 1 description", "Custom lighting installation");
  await b.fill("Item 1 Quantity", "2");
  await b.fill("Item 1 Unit price · BDT", "100.25");
  await b.fill("Memo discount · BDT", "10.50");
  await b.fill("Memo tax percentage", "7.50");
  await b.fill("Memo service / delivery · BDT", "25");
  check(
    "Custom memo calculates exact grand total",
    await b.evaluate(
      `document.querySelector('.a-editor-total').textContent.includes('229.25')`,
    ),
  );
  await b.fill("Demo payment amount", "100.01");
  await b.clickText("Add demo payment record");
  check(
    "Partial payment updates exact balance without collection",
    await b.evaluate(
      `document.querySelector('.a-payment-cards').textContent.includes('129.24')&&document.querySelector('.a-payment-cards').textContent.includes('PARTIAL')`,
    ),
  );
  await b.fill("Demo payment amount", "200");
  await b.clickText("Add demo payment record");
  check(
    "UI blocks overpayment",
    await b.evaluate(
      `document.querySelector('[role="alert"]').textContent.includes('exceed')`,
    ),
  );
  await b.clickText("Save local draft");
  check(
    "Custom memo can be saved as local draft",
    await b.evaluate(
      `document.querySelector('.a-saved-drafts').textContent.includes('Custom Demo Company')`,
    ),
  );
  await b.clickText("Create memo from quotation");
  check(
    "Conversion creates independent linked memo without payments",
    await b.evaluate(
      `document.querySelector('.a-studio-toolbar').textContent.includes('DEMO-QUO')&&document.querySelector('.a-payment-cards').textContent.includes('UNPAID')`,
    ),
  );
  await b.fill("Client / company", "Changed converted client");
  await b.clickText("Quotation Studio");
  await set(".a-quotation-sources select", "DEMO-QUO-2026-001");
  check(
    "Converted memo edits leave source quote unchanged",
    await b.evaluate(
      `!document.querySelector('input[maxlength="200"]').value.includes('Changed')`,
    ),
  );
  await set(".a-quotation-sources select", "DEMO-QUO-2026-006");
  await b.clickText("Create memo from source");
  check(
    "Draft source conversion is blocked",
    await b.evaluate(
      `document.querySelector('[role="status"]').textContent.includes('Draft offers cannot')`,
    ),
  );
  await set(".a-quotation-sources select", "DEMO-QUO-2026-001");
  await b.clickText("Document Studio");
  check(
    "Template workbench identifies missing form fields",
    await b.evaluate(
      `document.body.textContent.includes('Before applying, complete:')&&document.body.textContent.includes('Recipient name')&&document.body.textContent.includes('Document date')&&[...document.querySelectorAll('button')].find(b=>b.textContent==='Apply template').disabled`,
    ),
  );
  await b.fill("Recipient name", "Demo Recipient");
  await b.fill("Document date", "2026-11-08");
  await b.clickText("Apply template");
  check(
    "Template resolves populated fields into editable text",
    await b.evaluate(
      `[...document.querySelectorAll('textarea')][0].value.includes('Demo Recipient')`,
    ),
  );
  await b.clickText("Email Center");
  await b.fill("Subject", "DEMO local email draft");
  await b.fill("Message", "Local review only; no dispatch.");
  await b.clickText("Save locally");
  await b.clickText("Document Studio");
  check(
    "Letter fields survive module navigation",
    await b.evaluate(
      `document.querySelector('textarea').value.includes('Demo Recipient')`,
    ),
  );
  await b.clickText("Email Center");
  check(
    "Email fields and saved draft survive module navigation",
    await b.evaluate(
      `document.querySelector('textarea').value.includes('Local review only')&&document.body.textContent.includes('DEMO local email draft')`,
    ),
  );
  // UI and responsive evidence from fresh fixtures; local CRUD evidence above is separate.
  for (const section of [
    "dashboard",
    "products",
    "roles",
    "quotations",
    "memo-studio",
    "settings",
    "documents",
    "email",
    "payments",
    "invoices",
    "homepage",
  ]) {
    await goto(section);
    if (section === "quotations")
      await set(".a-quotation-sources select", "DEMO-QUO-2026-001");
    if (section === "memo-studio")
      await b.clickText("Create memo from quotation");
    for (const mode of ["light", "dark"]) {
      await theme(mode);
      for (const width of [320, 390, 768, 1440]) {
        await b.viewport(width, 1050);
        await b.evaluate("scrollTo(0,0)");
        const dimensions = await b.evaluate(
          "({width:innerWidth,scroll:document.documentElement.scrollWidth})",
        );
        check(
          `${section} ${mode} ${width}px has no page overflow`,
          dimensions.scroll <= dimensions.width + 1,
          dimensions,
        );
        if ([390, 1440].includes(width))
          await shot(`${section}-${width}-${mode}`);
      }
    }
    const badge = await b.evaluate(
      `(()=>[...document.querySelectorAll('nextjs-portal')].flatMap(p=>[...(p.shadowRoot?.querySelectorAll('button')||[])].map(b=>({text:b.textContent,label:b.getAttribute('aria-label')}))))()`,
    );
    diagnostics.push({ section, badge });
    check(
      `${section} has no Next development issue badge`,
      !badge.some((x) => /\d+\s+issues?/i.test(x.text)),
    );
  }
  await goto("dashboard");
  await b.viewport(1440);
  await theme("light");
  await set('[aria-label="Dashboard date range"]', "7");
  check(
    "Dashboard date filter updates committed sale count",
    await b.evaluate(
      `document.querySelector('.a-kpi p').textContent.includes('committed demo sales')`,
    ),
  );
  await set('[aria-label="Dashboard data source"]', "live");
  check(
    "Live source shows disconnected state without demo metrics",
    await b.evaluate(
      `!!document.querySelector('.a-disconnected')&&!document.querySelector('.a-kpi')`,
    ),
  );
  await set('[aria-label="Dashboard data source"]', "demo");
  await b.evaluate(
    `document.querySelector('[aria-label="Collapse sidebar"]').click()`,
  );
  await b.viewport(390);
  await b.evaluate(
    `document.querySelector('[aria-label="Open navigation"]').click()`,
  );
  check(
    "Mobile drawer works after desktop collapse",
    await b.evaluate(
      `document.querySelector('.a-workspace').classList.contains('a-mobile-open')&&!document.querySelector('.a-workspace').classList.contains('a-collapsed')`,
    ),
  );
  await shot("navigation-mobile");
  await b.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await b.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  check(
    "Mobile Escape closes drawer and returns focus",
    await b.evaluate(
      `!document.querySelector('.a-workspace').classList.contains('a-mobile-open')&&document.activeElement.getAttribute('aria-label')==='Open navigation'`,
    ),
  );
  await b.viewport(1440);
  await b.clickText("Products");
  await b.evaluate("history.back()");
  await b.until(
    `document.querySelector('h1')?.textContent==='Executive overview'`,
  );
  check("Browser back restores active module", true);
  for (const route of [
    "/en",
    "/bn",
    "/en/products",
    "/en/services",
    "/en/cart",
    "/en/request",
    "/en/login",
  ]) {
    const r = await fetch(origin + route);
    check("Preserved public route " + route, r.ok);
  }
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    const r = await fetch(origin + "/api/admin/sales", { method });
    check(
      "Protected API denies " + method,
      r.status === 401 && r.headers.get("cache-control")?.includes("no-store"),
    );
  }
  const redirect = await fetch(origin + "/en/admin/products", {
    redirect: "manual",
  });
  check(
    "Protected admin redirects to unified login",
    redirect.status === 307 && redirect.headers.get("location") === "/en/login",
  );
  for (const route of ["/en/admin-preview", "/bn/admin-preview/memo-studio"]) {
    const r = await fetch(production + route),
      html = await r.text();
    check(
      "Production excludes development workspace " + route,
      !html.includes("a-workspace") &&
        r.headers.get("x-robots-tag")?.includes("noindex") &&
        r.headers.get("cache-control")?.includes("no-store"),
    );
  }
  // Generate actual A4 PDFs with embedded local brand and font resources.
  const fontCache = new Map();
  async function embed(html) {
    html = html.replaceAll(
      company.logo,
      "data:image/webp;base64," +
        (await readFile(path.resolve("public" + company.logo))).toString(
          "base64",
        ),
    );
    for (const url of [
      ...new Set(
        [...html.matchAll(/url\("(http[^"\n]+)"\)/g)].map((m) => m[1]),
      ),
    ]) {
      if (!fontCache.has(url)) {
        const r = await fetch(url);
        if (!r.ok) throw Error("Font unavailable");
        fontCache.set(
          url,
          "data:font/woff2;base64," +
            Buffer.from(await r.arrayBuffer()).toString("base64"),
        );
      }
      html = html.replaceAll(url, fontCache.get(url));
    }
    return html;
  }
  async function print(name, html) {
    const filename = path.join(output, name + ".html");
    await writeFile(filename, await embed(html));
    await b.navigate(
      pathToFileURL(filename).href,
      '!!document.querySelector(".paper")',
    );
    const r = await b.send("Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
    });
    const bytes = Buffer.from(r.data, "base64");
    await writeFile(path.join(output, name + ".pdf"), bytes);
    const text = bytes.toString("latin1"),
      box = text.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
    return {
      name,
      pages: (text.match(/\/Type\s*\/Page\b/g) || []).length,
      bytes: bytes.length,
      widthPt: box ? Number(box[1]) : null,
      heightPt: box ? Number(box[2]) : null,
      fontsEmbedded: /\/FontFile[23]?\b/.test(text),
    };
  }
  const data = createDemoDataset(),
    quote = data.quotations[0],
    memo = quotationToMemo(quote),
    spec = (number) => ({ mode: "demo-issued", number });
  const custom = {
    ...memo,
    sourceQuotation: null,
    client: "Shapla Workspace (fictional demo)",
    issuer: "Demo Commercial Team",
    items: data.products.slice(0, 3).map((p, i) => ({
      id: "DEMO-" + i,
      code: p.sku,
      description: p.name,
      unit: "pcs",
      quantity: String(i + 1),
      unitPrice: p.price,
    })),
    terms: "Demonstration specimen for layout review.",
    paymentTerms: "Payment schedule to be agreed.",
    deliveryTerms: "",
  };
  pdfs.push(
    await print(
      "quotation-official-layout",
      renderQuotation(quote.draft, company, "en", fontCss, spec(quote.id)),
    ),
  );
  pdfs.push(
    await print(
      "memo-custom",
      renderSalesDocument(
        custom,
        company,
        "en",
        fontCss,
        spec("DEMO-MEM-2026-001"),
      ),
    ),
  );
  pdfs.push(
    await print(
      "memo-from-quotation",
      renderSalesDocument(
        memo,
        company,
        "en",
        fontCss,
        spec("DEMO-MEM-2026-002"),
      ),
    ),
  );
  const partial = data.sales.find(
    (s) =>
      s.payments.length &&
      s.payments[0].amount !== s.items[0].unitPrice &&
      s.payments[0].method === "BANK_TRANSFER",
  );
  pdfs.push(
    await print(
      "invoice-partial-payment",
      renderSalesDocument(
        demoSaleDraft(partial, "INVOICE"),
        company,
        "en",
        fontCss,
        spec("DEMO-INV-2026-001"),
      ),
    ),
  );
  pdfs.push(
    await print(
      "payment-receipt",
      renderSalesDocument(
        demoSaleDraft(partial, "RECEIPT"),
        company,
        "en",
        fontCss,
        spec("DEMO-RCT-2026-001"),
      ),
    ),
  );
  pdfs.push(
    await print(
      "delivery-challan",
      renderSalesDocument(
        { ...custom, kind: "CHALLAN" },
        company,
        "en",
        fontCss,
        spec("DEMO-CHL-2026-001"),
      ),
    ),
  );
  pdfs.push(
    await print(
      "letter-bengali",
      renderLetter(
        {
          ...letterFixture("bn"),
          subject: "অফিশিয়াল লেটারহেডের নমুনা",
          sender: "ডেমো প্রতিনিধি",
          senderDesignation: "নমুনা প্রস্তুতকারী",
        },
        company,
        "bn",
        fontCss,
        spec("DEMO-LTR-2026-001"),
      ),
    ),
  );
  pdfs.push(
    await print(
      "memo-bengali",
      renderSalesDocument(
        {
          ...custom,
          client: "শাপলা ওয়ার্কস্পেস (কাল্পনিক নমুনা)",
          items: [
            {
              ...custom.items[0],
              description: "আলোকসজ্জা পরিকল্পনা ও স্থাপন সেবা",
              unit: "টি",
            },
          ],
          terms: "নকশা ও সফটওয়্যার পর্যালোচনার নমুনা।",
          paymentTerms: "পরিশোধের শর্ত পরে নির্ধারিত হবে।",
        },
        company,
        "bn",
        fontCss,
        spec("DEMO-MEM-2026-003"),
      ),
    ),
  );
  pdfs.push(
    await print(
      "memo-draft",
      renderSalesDocument(custom, company, "en", fontCss),
    ),
  );
  for (const target of [2, 5]) {
    let count = target === 2 ? 14 : 50,
      result;
    for (let attempt = 0; attempt < 30; attempt++) {
      const long = {
        ...custom,
        items: Array.from({ length: count }, (_, i) => ({
          ...custom.items[i % 3],
          id: "DEMO-LONG-" + i,
          description: `Demonstration item ${i + 1}: Architectural lighting, installation scope and site coordination.`,
        })),
      };
      result = await print(
        `memo-${target}-page`,
        renderSalesDocument(
          long,
          company,
          "en",
          fontCss,
          spec(`DEMO-MEM-2026-LONG${target}`),
        ),
      );
      if (result.pages === target) break;
      count += result.pages < target ? 1 : -1;
    }
    pdfs.push({ ...result, lineCount: count });
    check(
      `Multi-page memo renders exactly ${target} pages`,
      result.pages === target,
      result,
    );
  }
  for (const pdf of pdfs) {
    check(
      pdf.name + " uses A4 and embedded fonts",
      Math.abs(pdf.widthPt - 595.28) < 2 &&
        Math.abs(pdf.heightPt - 841.89) < 2 &&
        pdf.fontsEmbedded,
      pdf,
    );
    if (!/-(2|5)-page$/.test(pdf.name))
      check(pdf.name + " has no extra blank page", pdf.pages === 1, pdf);
  }
  await b.viewport(1000, 1350);
  for (const pdf of pdfs) {
    await b.send("Page.navigate", { url: "about:blank" });
    await delay(80);
    await b.send("Page.navigate", {
      url: pathToFileURL(path.join(output, pdf.name + ".pdf")).href,
    });
    await delay(1600);
    await shot(pdf.name + "-pdf");
  }
  for (const [name, page] of [
    ["memo-2-page", 2],
    ["memo-5-page", 3],
    ["memo-5-page", 5],
  ]) {
    await b.send("Page.navigate", { url: "about:blank" });
    await delay(80);
    await b.send("Page.navigate", {
      url:
        pathToFileURL(path.join(output, name + ".pdf")).href + "#page=" + page,
    });
    await delay(1600);
    await shot(name + "-page-" + page + "-pdf");
  }
  check(
    "No business mutation requests occurred",
    b.mutations.length === 0,
    b.mutations,
  );
  check(
    "No browser runtime or console errors",
    b.errors.length === 0,
    b.errors,
  );
  check(
    "No browser console or resource warnings",
    b.warnings.length === 0,
    b.warnings,
  );
} catch (error) {
  await shot("qa-failure");
  await writeFile(
    path.join(output, "qa-failure.txt"),
    await b.evaluate("document.body.innerText"),
  );
  check("QA script completed all stages", false, error.stack);
  throw error;
} finally {
  await writeFile(
    path.join(output, "checks.json"),
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        checks,
        pdfs,
        diagnostics,
        browserErrors: b.errors,
        browserWarnings: b.warnings,
        mutations: b.mutations,
      },
      null,
      2,
    ),
  );
  await b.close();
}
console.log(
  JSON.stringify(
    {
      checks: checks.length,
      passed: checks.filter((c) => c.passed).length,
      failed: checks.filter((c) => !c.passed).length,
      pdfs,
    },
    null,
    2,
  ),
);
if (checks.some((c) => !c.passed)) process.exitCode = 1;
