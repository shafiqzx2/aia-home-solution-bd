import { notFound } from "next/navigation";
import { company } from "@/lib/public-content";
import { mapsUrl, officeAddress } from "@/lib/public-contact";
import { isLocale } from "@/lib/i18n";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";

import { UpdateAnnouncement } from "@/components/site/direct-contact";

// A shared frame keeps navigation, logo images and cart subscription mounted
// while public route content streams. The unified login keeps its own design.
export default async function PublicLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const business = { "@context": "https://schema.org", "@type": "LocalBusiness", name: company.name, url: "https://aiagroupbd.com", email: company.contact.email, telephone: company.contact.phone, address: { "@type": "PostalAddress", streetAddress: officeAddress, addressLocality: "Dhaka", postalCode: "1229", addressCountry: "BD" }, hasMap: mapsUrl };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(business).replaceAll("<", "\\u003c") }} /><UpdateAnnouncement locale={lang} /><Header locale={lang} />{children}<Footer locale={lang} /></>;
}
