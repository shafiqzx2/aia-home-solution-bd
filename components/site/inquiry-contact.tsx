"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart, type CartLine } from "@/lib/cart";
import { productConcepts, publicServices } from "@/lib/public-content";
import { type Locale } from "@/lib/i18n";
import { contactText, inquiryEmail, inquiryWhatsApp } from "@/lib/public-contact";
import { ContactActions } from "./direct-contact";

export function InquiryContact({ locale, lines }: { locale: Locale; lines: CartLine[] }) {
  const [copyStatus, setCopyStatus] = useState("");
  const body = [locale === "bn" ? "AIA Home Solutions BD, নিচের পণ্যগুলোর তথ্য ও কোটেশন জানতে চাই:" : "Hello AIA Home Solutions BD, please advise on these products and a quotation:", ...lines.flatMap(line => {
    const product = productConcepts.find(p => p.slug === line.id && p.status === "published");
    return product ? [`${product.name[locale]} - ${locale === "bn" ? "পরিমাণ" : "Quantity"}: ${line.quantity}`] : [];
  })].join("\n");
  const email = inquiryEmail(body);
  const long = email.length > 1800;
  const whatsapp = inquiryWhatsApp(long ? "Hello AIA Home Solutions BD, I have a product shortlist to discuss. I will paste the details." : body);
  return <div className="public-contact-notice">
    <p>{contactText(locale, "quotation")}</p>
    <div className="action-row">
      <a className="button button-gold" href={long ? inquiryEmail("I have a product shortlist to discuss. I will paste the details below.") : email}>{contactText(locale, "email")}</a>
      {whatsapp && <a className="text-link" href={whatsapp} target="_blank" rel="noopener noreferrer">{contactText(locale, "whatsapp")}</a>}
      <button type="button" className="text-link" onClick={async () => {
        try { await navigator.clipboard.writeText(body); setCopyStatus(contactText(locale, "copied")); }
        catch { setCopyStatus(contactText(locale, "copyFailed")); }
      }}>{contactText(locale, "copy")}</button>
    </div>
    <p className="content-note">{contactText(locale, "notSent")}</p>
    <p role="status">{copyStatus}</p>
    {(long || copyStatus === contactText(locale, "copyFailed")) && <label className="inquiry-copy">{locale === "bn" ? "জিজ্ঞাসার লেখা" : "Inquiry text"}<textarea readOnly value={body} rows={6} onFocus={e => e.currentTarget.select()} /></label>}
  </div>;
}
export function RequestContact({ locale }: { locale: Locale }) {
  const params = useSearchParams();
  const { items } = useCart();
  const product = productConcepts.find(p => p.slug === params.get("product") && p.status === "published");
  const quantity = Math.max(1, Math.min(99, Math.trunc(Number(params.get("quantity")) || 1)));
  const lines = params.get("entry") === "cart" ? items : product ? [{ id: product.slug, quantity }] : [];
  const service = publicServices.find(s => s.slug === params.get("service") && s.status === "published");
  return <>
    <p className="notice">{contactText(locale, "booking")}</p>
    {lines.length ? <InquiryContact locale={locale} lines={lines} /> : <><p>{contactText(locale, "quotation")}</p><ContactActions locale={locale} message={service ? `Hello AIA Home Solutions BD, I would like assistance with ${service.name[locale]}.` : undefined} /></>}
  </>;
}
