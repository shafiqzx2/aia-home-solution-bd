import Link from "next/link";
import { Brand } from "./brand";
import { company, navigation, solutionPreviews, publicServices } from "@/lib/public-content";
import { dictionaries, href, type Locale } from "@/lib/i18n";
import { ContactDetails, SocialLinks } from "./contact-details";
import { requestCopy } from "@/lib/request-copy";
import { FooterLinks } from "./footer-links";
export function Footer({ locale = "en" }: { locale?: Locale }) {
  const d = dictionaries[locale];
  const labels = { navigation: locale === "bn" ? "দেখুন" : "Discover", categories: locale === "bn" ? "পণ্যের বিভাগ" : "Product categories" };
  return <footer className="site-footer"><div className="shell">
    <div className="footer-main">
      <div className="footer-brand"><Brand locale={locale} placement="footer" />
        <p className="footer-description">{d.footerCopy}</p><SocialLinks locale={locale} />
      </div>
      <FooterLinks title={labels.navigation} label={d.footerNav}>
        {navigation.map((key) => <Link key={key} href={href(locale, key === "home" ? "" : key)}>{d[key]}</Link>)}
      </FooterLinks>
      <FooterLinks title={labels.categories} label={labels.categories}>
        {solutionPreviews.map((item) => <Link key={item.id} href={href(locale, "products") + "?category=" + item.id}>{item.name[locale]}</Link>)}
      </FooterLinks>
      <FooterLinks title={d.services} label={d.services}>
        {publicServices.filter((s) => s.status === "published").slice(0, 4).map((service) => <Link key={service.slug} href={href(locale, "services/" + service.slug)}>{service.name[locale]}</Link>)}
        <Link href={href(locale, "services")}>{d.allServices}</Link>
      </FooterLinks>
      <div className="footer-contact"><h2>{d.contact}</h2><ContactDetails locale={locale} />
        <Link className="text-link" href={href(locale, "request") + "?entry=direct&type=consultation"}>{requestCopy(locale).consultation}</Link>
        <p className="footer-location">{company.country[locale]}</p>
      </div>
    </div>
    <div className="footer-bottom"><p>© {company.name}. {d.rights}</p>
      <div><Link href={href(locale, "privacy")}>{requestCopy(locale).privacy}</Link><Link href={href(locale, "login")}>{d.login}</Link></div>
    </div>
  </div></footer>;
}
