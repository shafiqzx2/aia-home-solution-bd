import {
  calculateQuote,
  lineTotal,
  money,
  type QuoteInput,
  type QuoteLine,
} from "./finance.ts";
import type { CompanySnapshot } from "./company-settings.ts";
import { paymentSummary, type SalesDraft } from "./sales.ts";

export type QuotationDraft = QuoteInput & {
  client: string;
  attention: string;
  email: string;
  address: string;
  project: string;
  date: string;
  validUntil: string;
  terms: string;
  paymentTerms: string;
  deliveryTerms: string;
  notes: string;
};
// The server supplies issued presentation only after reading authorized immutable snapshots.
export type DocumentPresentation =
  | { mode: "draft" }
  | { mode: "demo-issued"; number: string; issuer?: string }
  | { mode: "issued"; number: string; issuer?: string };
export function emptyQuotation(): QuotationDraft {
  return {
    client: "",
    attention: "",
    email: "",
    address: "",
    project: "",
    date: "",
    validUntil: "",
    terms: "",
    paymentTerms: "",
    deliveryTerms: "",
    notes: "",
    items: [],
    discount: "0",
    taxPercent: "0",
    charges: "0",
  };
}
export function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
const e = escapeHtml;
const paragraphs = (text: string) => e(text).replace(/\n/g, "<br>");
export function dateText(date: string, locale: "en" | "bn") {
  if (!date) return "—";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
  )
    throw new Error("Enter a valid document date.");
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
function descriptionParts(text: string): string[] {
  const chars = Array.from(text),
    parts: string[] = [];
  while (chars.length > 300) {
    let end = 300;
    while (end > 150 && !/\s/u.test(chars[end - 1])) end--;
    if (end <= 150) end = 300;
    parts.push(chars.splice(0, end).join("").trim());
  }
  parts.push(chars.join("").trim());
  return parts;
}
export const documentCss = `
@page{size:A4 portrait;margin:14mm 15mm 17mm;@bottom-right{content:"Page " counter(page) " / " counter(pages);font:8pt Arial;color:#666}}
*{box-sizing:border-box}html,body{background:#fff!important;color:#222a25}body{margin:0;font:10pt "Geist","Hind Siliguri","Nirmala UI",Arial,sans-serif;line-height:1.5;font-synthesis:none}
.paper{padding:14mm 15mm 17mm;max-width:210mm;min-height:297mm;margin:auto;background:#fff}.letterhead{display:flex;align-items:center;justify-content:space-between;gap:8mm;border-bottom:1.5pt solid #9d814b;padding-bottom:4mm;margin-bottom:6mm}.logo{width:31mm;height:19mm;object-fit:contain}.company{text-align:right;max-width:125mm;font-size:9pt;line-height:1.6}.company strong{display:block;font-size:12pt;font-weight:600}
.title-row{display:flex;justify-content:space-between;align-items:center;gap:5mm;margin-bottom:6mm}.title-row h1{font-size:26pt;font-weight:500;letter-spacing:-.8pt;line-height:1.2;margin:0}.eyebrow{font-size:8pt;color:#786039;text-transform:uppercase;letter-spacing:1.2pt;margin:0 0 1mm}.document-badge{font:8pt Arial;letter-spacing:1pt;border:1pt solid #b7a37b;color:#69552e;padding:2mm 3mm}
.meta{display:grid;grid-template-columns:1.2fr 1fr;gap:7mm;padding:4mm 0 5mm;border-bottom:.5pt solid #d6dad4;margin-bottom:5mm}.meta h2{font-size:8pt;text-transform:uppercase;letter-spacing:1pt;font-weight:500;color:#687266;margin:0 0 2mm}.meta strong{font-size:11pt}.meta p{margin:1mm 0;overflow-wrap:anywhere}.dates>div{display:flex;justify-content:space-between;gap:4mm;margin-bottom:2mm;font-size:9pt}.dates b{font-weight:500}.project{font-size:9pt;margin:0 0 5mm;overflow-wrap:anywhere}
table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:9pt}thead{display:table-header-group}th{padding:3mm 2mm;background:#263b30;color:#fff;font-weight:500;text-align:left;font-size:8pt}td{padding:2.5mm 2mm;vertical-align:top;border-bottom:.5pt solid #dce0da;overflow-wrap:anywhere}td small{display:block;font-size:8pt;color:#667065;margin-top:1mm}.num{text-align:right;font-variant-numeric:tabular-nums}tr{break-inside:avoid;page-break-inside:avoid}
.totals{width:105mm;max-width:100%;margin:5mm 0 5mm auto;break-inside:avoid}.totals>div{display:flex;justify-content:space-between;gap:4mm;padding:1mm 3mm;font-size:9pt}.totals .grand{border-top:1pt solid #a78e5b;background:#f2efe6;padding:3mm;margin-top:2mm;font-weight:600;font-size:12pt;align-items:center}.grand>span{white-space:nowrap}.grand>span:last-child{font-size:11.5pt}.payment-summary{display:flex;justify-content:space-between;gap:5mm;padding:3mm;border:1pt solid #d6dad4;font-size:9pt;margin:4mm 0;break-inside:avoid}.payment-summary strong{display:block;font-size:11pt}.terms{display:grid;grid-template-columns:1fr 1fr;gap:4mm 8mm;margin-top:5mm}.terms section{break-inside:avoid;overflow-wrap:anywhere}.terms h2{font-size:9pt;color:#68522e;margin:0 0 1mm}.terms p{font-size:9pt;margin:0;white-space:pre-wrap}.signature{display:flex;justify-content:space-between;gap:5mm;margin-top:8mm;padding-top:3mm;border-top:.5pt solid #d6dad4;font-size:9pt;break-inside:avoid}.footer{margin-top:6mm;padding-top:3mm;border-top:.5pt solid #d6dad4;font-size:8pt;color:#5e685e;overflow-wrap:anywhere;break-inside:avoid}.letter-body{white-space:pre-wrap;overflow-wrap:anywhere;font-size:11pt;line-height:1.9}.letter-subject{font-size:12pt;margin:7mm 0}.email-body{max-width:600px;margin:30px auto;padding:35px;border:1px solid #ddd}.email-body h1{font-size:24px}
@media print{html,body{background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}.paper{padding:0;min-height:0;max-width:none}.letterhead,.title-row,.meta{break-inside:avoid}}`;
function badge(presentation: DocumentPresentation) {
  if(presentation.mode==='issued'&&!/^(QUO|MEM|INV|RCT|CHL|LTR)-\d{4}-\d{6,}$/.test(presentation.number))throw Error('A persisted document number is required.');
  if (
    presentation.mode === "demo-issued" &&
    !/^DEMO-[A-Z0-9-]+$/.test(presentation.number)
  )
    throw new Error(
      "Issued-layout specimens require an explicit DEMO document number.",
    );
  return `<span class="document-badge">${presentation.mode === "draft" ? "DRAFT" : presentation.mode==='issued'?'ISSUED':'DEMO'}</span>`;
}
function frame(
  content: string,
  company: CompanySnapshot,
  locale: "en" | "bn",
  fontCss: string,
  title: string,
) {
  const logo = /^\/branding\/[a-z0-9.-]+\.(webp|png)$/.test(company.logo)
    ? company.logo
    : "";
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}</title><style>${fontCss}\n${documentCss}</style></head><body><article class="paper"><header class="letterhead">${logo ? `<img class="logo" src="${logo}" alt="${e(company.name)}">` : ""}<div class="company"><strong>${e(company.name)}</strong><div>${e(company.address)}</div><div>${e(company.phone)} · ${e(company.email)}</div></div></header>${content}<footer class="footer">${e(company.documentFooter || company.name)}</footer></article></body></html>`;
}
function clientBlock(
  draft: QuotationDraft,
  locale: "en" | "bn",
  pairs: [string, string][],
) {
  return `<section class="meta"><div><h2>${locale === "bn" ? "প্রাপক" : "Prepared for"}</h2><strong>${e(draft.client || "Client name")}</strong>${[
    draft.attention,
    draft.address,
    draft.email,
  ]
    .filter(Boolean)
    .map((v) => `<p>${paragraphs(v)}</p>`)
    .join(
      "",
    )}</div><div class="dates">${pairs.map(([k, v]) => `<div><span>${e(k)}</span><b>${e(v)}</b></div>`).join("")}</div></section>${draft.project ? `<p class="project"><b>${locale === "bn" ? "প্রকল্প / সাইট" : "Project / site"}</b> &nbsp; ${e(draft.project)}</p>` : ""}`;
}
function itemTable(items: QuoteLine[], locale: "en" | "bn", prices = true) {
  const bn = locale === "bn";
  const rows = items
    .flatMap((item, i) =>
      descriptionParts(item.description).map(
        (part, n) =>
          `<tr><td>${n === 0 ? i + 1 : ""}</td><td>${n ? `<small>${bn ? "বিবরণের পরবর্তী অংশ" : `Item ${i + 1} · description continued`}</small>` : ""}${paragraphs(part)}${!n && item.code ? `<small>${e(item.code)}</small>` : ""}</td><td>${n ? "" : e(item.unit)}</td><td class="num">${n ? "" : e(item.quantity)}</td>${prices ? `<td class="num">${n ? "" : money(item.unitPrice)}</td><td class="num">${n ? "" : money(lineTotal(item))}</td>` : ""}</tr>`,
      ),
    )
    .join("");
  return `<table><colgroup><col style="width:5%"><col style="width:${prices ? 36 : 67}%"><col style="width:8%"><col style="width:${prices ? 9 : 20}%">${prices ? '<col style="width:20%"><col style="width:22%">' : ""}</colgroup><thead><tr><th>#</th><th>${bn ? "পণ্য / সেবার বিবরণ" : "Product / service description"}</th><th>${bn ? "একক" : "Unit"}</th><th class="num">${bn ? "পরিমাণ" : "Qty"}</th>${prices ? `<th class="num">${bn ? "একক মূল্য" : "Unit price"}</th><th class="num">${bn ? "মোট" : "Amount"}</th>` : ""}</tr></thead><tbody>${rows || `<tr><td colspan="${prices ? 6 : 4}">${bn ? "পণ্য বা সেবা যোগ করুন।" : "Add items to this document."}</td></tr>`}</tbody></table>`;
}
function totalsBlock(draft: QuotationDraft, locale: "en" | "bn") {
  const t = calculateQuote(draft),
    bn = locale === "bn";
  return `<section class="totals">${[[bn ? "উপমোট" : "Subtotal", t.subtotal], ...(t.discount !== "0.00" ? [[bn ? "ছাড়" : "Discount", t.discount]] : []), ...(t.tax !== "0.00" ? [[`${bn ? "কর" : "Tax"} (${draft.taxPercent}%)`, t.tax]] : []), ...(t.charges !== "0.00" ? [[bn ? "সেবা / ডেলিভারি" : "Service / delivery", t.charges]] : [])].map(([k, v]) => `<div><span>${e(k)}</span><span>${money(v)}</span></div>`).join("")}<div class="grand"><span>${bn ? "সর্বমোট" : "Grand total"}</span><span>BDT ${money(t.total)}</span></div></section>`;
}
function termsBlock(draft: QuotationDraft, locale: "en" | "bn") {
  const bn = locale === "bn";
  return `<div class="terms">${[
    [bn ? "শর্তাবলি" : "Terms", draft.terms],
    [bn ? "পরিশোধের শর্ত" : "Payment terms", draft.paymentTerms],
    [bn ? "ডেলিভারি ও স্থাপন" : "Delivery & installation", draft.deliveryTerms],
    [bn ? "মন্তব্য" : "Notes", draft.notes],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<section><h2>${k}</h2><p>${e(v)}</p></section>`)
    .join("")}</div>`;
}
export function renderQuotation(
  draft: QuotationDraft,
  company: CompanySnapshot,
  locale: "en" | "bn" = "en",
  fontCss = "",
  presentation: DocumentPresentation = { mode: "draft" },
): string {
  calculateQuote(draft);
  if (draft.date && draft.validUntil && draft.validUntil < draft.date)
    throw new Error("Validity cannot end before the document date.");
  const bn = locale === "bn",
    marker = badge(presentation);
  const pairs: [string, string][] = [
    [
      bn ? "কোটেশন নং" : "Quotation no.",
      presentation.mode === "draft" ? "Not issued" : presentation.number,
    ],
    [bn ? "তারিখ" : "Date", dateText(draft.date, locale)],
  ];
  if (draft.validUntil)
    pairs.push([
      bn ? "মেয়াদ" : "Valid until",
      dateText(draft.validUntil, locale),
    ]);
  return frame(
    `<div class="title-row"><div><p class="eyebrow">${bn ? "ব্যবসায়িক প্রস্তাব" : "Commercial proposal"}</p><h1>${bn ? "কোটেশন" : "Quotation"}</h1></div>${marker}</div>${clientBlock(draft, locale, pairs)}${itemTable(draft.items, locale)}${totalsBlock(draft, locale)}${termsBlock(draft, locale)}${presentation.mode === "demo-issued" && presentation.issuer ? `<div class="signature"><span>${bn ? "প্রস্তুতকারক" : "Prepared by"}: ${e(presentation.issuer)}</span><span>${e(company.name)}</span></div>` : ""}`,
    company,
    locale,
    fontCss,
    "AIA quotation",
  );
}
export function renderSalesDocument(
  draft: SalesDraft,
  company: CompanySnapshot,
  locale: "en" | "bn" = "en",
  fontCss = "",
  presentation: DocumentPresentation = { mode: "draft" },
) {
  const totals = calculateQuote(draft),
    payment = paymentSummary(totals.total, draft.payments),
    bn = locale === "bn";
  if (
    draft.kind === "RECEIPT" &&
    !draft.payments.some((p) => p.state === "POSTED")
  )
    throw new Error("Choose a recorded demo payment to preview its receipt.");
  const names = {
    MEMO: !draft.demo&&payment.status==='PAID'&&draft.payments.every(p=>p.method==='CASH')?(bn?'ক্যাশ মেমো':'Cash memo'):(bn ? "বিক্রয় মেমো" : "Sales memo"),
    INVOICE: bn ? "চালান / ইনভয়েস" : "Invoice",
    RECEIPT: bn ? "অর্থপ্রাপ্তির রসিদ" : "Payment receipt",
    CHALLAN: bn ? "ডেলিভারি চালান" : "Delivery challan",
  };
  const pairs: [string, string][] = [
    [
      bn ? "নথি নং" : "Document no.",
      presentation.mode === "draft" ? "Not issued" : presentation.number,
    ],
    [bn ? "তারিখ" : "Date", dateText(draft.date, locale)],
  ];
  if (draft.sourceQuotation)
    pairs.push([bn ? "মূল কোটেশন" : "Source quotation", draft.sourceQuotation]);
  let content = itemTable(draft.items, locale, draft.kind !== "CHALLAN");
  if (draft.kind === "RECEIPT")
    content = `<table><thead><tr><th>Date</th><th>Method / reference</th><th class="num">Received · BDT</th></tr></thead><tbody>${draft.payments
      .filter((p) => p.state === "POSTED")
      .map(
        (p) =>
          `<tr><td>${dateText(p.date, locale)}</td><td>${e(p.method.replaceAll("_", " "))}<small>${e(p.reference)}</small></td><td class="num">${money(p.amount)}</td></tr>`,
      )
      .join(
        "",
      )}</tbody></table><section class="totals"><div class="grand"><span>${bn ? "প্রাপ্ত অর্থ" : "Amount received"}</span><span>BDT ${money(payment.paid)}</span></div></section>`;
  else if (draft.kind !== "CHALLAN")
    content +=
      totalsBlock(draft, locale) +
      `<div class="payment-summary"><span>${bn ? "পরিশোধিত" : "Paid amount"}<strong>BDT ${money(payment.paid)}</strong></span><span>${bn ? "বকেয়া" : "Balance due"}<strong>BDT ${money(payment.balance)}</strong></span><span>${bn ? "পরিশোধের অবস্থা" : "Payment status"}<strong>${payment.status === "PARTIAL" ? "Partially paid" : payment.status === "PAID" ? "Paid" : "Unpaid"}</strong></span></div>`;
  return frame(
    `<div class="title-row"><div><p class="eyebrow">${bn ? "বাণিজ্যিক নথি" : "Commercial document"}</p><h1>${names[draft.kind]}</h1></div>${badge(presentation)}</div>${clientBlock(draft, locale, pairs)}${content}${termsBlock(draft, locale)}${draft.issuer ? `<div class="signature"><span>${bn ? "ইস্যুকারী" : "Prepared by"}: ${e(draft.issuer)}</span><span>${e(company.name)}</span></div>` : ""}`,
    company,
    locale,
    fontCss,
    names[draft.kind],
  );
}
export type LetterDraft = {
  recipient: string;
  designation: string;
  organization: string;
  address: string;
  subject: string;
  body: string;
  date: string;
  sender: string;
  senderDesignation: string;
};
export function renderLetter(
  draft: LetterDraft,
  company: CompanySnapshot,
  locale: "en" | "bn" = "en",
  fontCss = "",
  presentation: DocumentPresentation = { mode: "draft" },
) {
  const bn = locale === "bn";
  return frame(
    `<div class="title-row"><p class="eyebrow">${bn ? "কোম্পানির পত্র" : "Company correspondence"}</p>${badge(presentation)}</div><p>${dateText(draft.date, locale)}${presentation.mode === "demo-issued" ? `<br>${e(presentation.number)}` : ""}</p><p>${[draft.recipient, draft.designation, draft.organization, draft.address].filter(Boolean).map(paragraphs).join("<br>")}</p><h2 class="letter-subject">${bn ? "বিষয়" : "Subject"}: ${e(draft.subject)}</h2><div class="letter-body">${e(draft.body)}</div>${draft.sender ? `<div class="signature"><span>${e(draft.sender)}${draft.senderDesignation ? `<br>${e(draft.senderDesignation)}` : ""}</span></div>` : ""}`,
    company,
    locale,
    fontCss,
    "AIA company letter",
  );
}
export function renderEmail(
  subject: string,
  body: string,
  company: CompanySnapshot,
) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><style>${documentCss}</style></head><body><article class="email-body"><p class="eyebrow">${e(company.name)}</p><h1>${e(subject)}</h1><div class="letter-body">${e(body)}</div><footer class="footer">${e(company.address)}<br>${e(company.email)} · ${e(company.phone)}</footer></article></body></html>`;
}

export {frame as documentFrame};
