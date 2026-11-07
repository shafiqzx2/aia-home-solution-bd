import { company } from "@/lib/public-content";
import { type Locale } from "@/lib/i18n";
import { requestCopy } from "@/lib/request-copy";
import { whatsappUrl } from "@/lib/whatsapp";
import { Icon, type IconName } from "@/components/ui/icon";
export function ContactDetails({ locale }: { locale: Locale }) {
  return <address className="business-contact">
    {company.contact.phone && <a href={`tel:${company.contact.phone}`}>{company.contact.phone}</a>}
    {company.contact.email && <a href={`mailto:${company.contact.email}`}>{company.contact.email}</a>}
    {company.contact.address && <p>{company.contact.address[locale]}</p>}
  </address>;
}
function safeSocialUrl(value: string | null, network: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const hosts: Record<string, string[]> = {
      facebook: ["facebook.com", "fb.com"], instagram: ["instagram.com"],
      youtube: ["youtube.com", "youtu.be"], linkedin: ["linkedin.com"],
    };
    if (url.protocol !== "https:" || url.username || url.password ||
      !hosts[network]?.some((host) => url.hostname === host || url.hostname.endsWith("." + host))) return null;
    return url.href;
  } catch { return null; }
}
export function SocialLinks({ locale }: { locale: Locale }) {
  const settings = company.socialLinks;
  const profiles: { label: string; icon: IconName; url: string | null }[] = [
    { label: "Facebook", icon: "facebook" as const, url: settings.facebookUrl },
    { label: "Instagram", icon: "instagram" as const, url: settings.instagramUrl },
    { label: "YouTube", icon: "youtube" as const, url: settings.youtubeUrl },
    { label: "LinkedIn", icon: "linkedin" as const, url: settings.linkedinUrl },
  ].map((item) => ({ ...item, url: safeSocialUrl(item.url || company.social.find((s) => s.network === item.icon)?.url || null, item.icon) }));
  profiles.push({ label: "WhatsApp", icon: "whatsapp", url: whatsappUrl(company.contact.whatsapp, company.contact.whatsappMessage[locale]) });
  const unavailable = locale === "bn" ? "লিংক এখনো যুক্ত হয়নি" : "Link not configured yet";
  return <div className="social-links">
    <p>{requestCopy(locale).socials}</p>
    <ul>{profiles.map((item) => <li key={item.label}>
      {item.url ? <a className="social-icon" href={item.url} target="_blank" rel="noopener noreferrer"
        aria-label={`${item.label} (${locale === "bn" ? "নতুন ট্যাব" : "new tab"})`} title={item.label}>
        <Icon name={item.icon} />
      </a> : <span className="social-icon social-unavailable" role="link" aria-disabled="true"
        aria-label={`${item.label}: ${unavailable}`} title={`${item.label}: ${unavailable}`}>
        <Icon name={item.icon} />
      </span>}
    </li>)}</ul>
    {profiles.some((item) => !item.url) && <small>{locale === "bn" ? "কিছু সামাজিক লিংক শীঘ্রই যুক্ত হবে।" : "More social links coming soon."}</small>}
  </div>;
}
