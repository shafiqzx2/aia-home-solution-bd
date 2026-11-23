import { type Locale } from "@/lib/i18n";
import { company } from "@/lib/public-content";
import { contactText, inquiryEmail, inquiryWhatsApp } from "@/lib/public-contact";

export function ContactActions({ locale, message = "Hello AIA Home Solutions BD, I would like to discuss a product or service.", compact = false }: { locale: Locale; message?: string; compact?: boolean }) {
  const whatsapp = inquiryWhatsApp(message);
  return <div className="action-row direct-contact-actions">
    <a className={compact ? "small-action" : "button button-gold"} href={inquiryEmail(message)}>{contactText(locale, "email")}</a>
    {whatsapp && <a className="text-link" href={whatsapp} target="_blank" rel="noopener noreferrer">{contactText(locale, "whatsapp")}</a>}
    {!compact && <a className="text-link" href={`tel:${company.contact.phone}`}>{contactText(locale, "call")}</a>}
  </div>;
}
export function ContactNotice({ locale, kind = "quotation" }: { locale: Locale; kind?: "quotation" | "booking" }) {
  return <div className="public-contact-notice"><p>{contactText(locale, kind)}</p><ContactActions locale={locale} /></div>;
}
export function UpdateAnnouncement({ locale }: { locale: Locale }) {
  const whatsapp = inquiryWhatsApp(company.contact.whatsappMessage[locale]);
  return <aside className="update-announcement" aria-label={locale === "bn" ? "ওয়েবসাইটের আপডেট" : "Website update"}>
    <div className="shell"><p>{contactText(locale, "announcement")}</p><span><a href={`mailto:${company.contact.email}`}>{contactText(locale, "email")}</a>{whatsapp && <> · <a href={whatsapp} target="_blank" rel="noopener noreferrer">{contactText(locale, "whatsapp")}</a></>}</span></div>
  </aside>;
}
