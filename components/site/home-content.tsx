import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { dictionaries, href, text, type Locale } from "@/lib/i18n";
import {
  solutionPreviews,
  publicServices,
} from "@/lib/public-content";
import { requestCopy } from "@/lib/request-copy";
import { Icon, type IconName } from "@/components/ui/icon";
import { Hero } from "./hero";
import { ServiceActions } from "./service-actions";
import { verifiedMetrics } from "@/lib/trust-content";

const highlights: {
  title: ReturnType<typeof text>;
  copy: ReturnType<typeof text>;
  icon: IconName;
}[] = [
  {
    title: text("Consultation & planning", "পরামর্শ ও পরিকল্পনা"),
    copy: text(
      "Start with your space, routines, and priorities.",
      "আপনার পরিসর, দৈনন্দিন ব্যবহার ও অগ্রাধিকার দিয়ে শুরু করুন।",
    ),
    icon: "layers",
  },
  {
    title: text("Product selection guidance", "পণ্য নির্বাচনে সহায়তা"),
    copy: text(
      "Bring suitable options into one clear discussion.",
      "উপযুক্ত বিকল্পগুলো নিয়ে একসঙ্গে আলোচনা করুন।",
    ),
    icon: "box",
  },
  {
    title: text("Site assessment options", "সাইট পরিদর্শনের সুযোগ"),
    copy: text(
      "Request a visit to discuss the conditions on site.",
      "স্থানের বাস্তব অবস্থা নিয়ে আলোচনার জন্য পরিদর্শনের অনুরোধ করুন।",
    ),
    icon: "pin",
  },
  {
    title: text("Installation & setup planning", "স্থাপন ও সেটআপের পরিকল্পনা"),
    copy: text(
      "Discuss compatibility and scope before work begins.",
      "কাজ শুরুর আগে সামঞ্জস্য ও কাজের পরিধি নিয়ে আলোচনা করুন।",
    ),
    icon: "architecture",
  },
];
export function ClosingCTA({ locale }: { locale: Locale }) {
  const c = requestCopy(locale),
    d = dictionaries[locale];
  return (
    <section className="quotation-strip closing-cta">
      <div className="shell">
        <div>
          <p className="section-label">
            {locale === "bn" ? "আপনার পরবর্তী পদক্ষেপ" : "Your next step"}
          </p>
          <h2>{d.footerContact}</h2>
          <p>
            {locale === "bn"
              ? "একটি ভাবনা, একটি ঘর, অথবা পুরো প্রকল্প—আলোচনা দিয়ে শুরু করুন।"
              : "One idea, one room, or an entire project. Start with a conversation."}
          </p>
        </div>
        <div className="closing-actions">
          <Link
            className="button button-gold"
            href={`${href(locale, "request")}?entry=direct&type=consultation`}
          >
            {c.consultation}
          </Link>
          <Link className="text-link" href={href(locale, "services")}>
            {c.book}
          </Link>
          <Link className="text-link" href={href(locale, "products")}>
            {d.products}
          </Link>
          <Link className="text-link" href={href(locale, "contact")}>
            {d.contact}
          </Link>
        </div>
      </div>
    </section>
  );
}
export function HomeContent({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const d = dictionaries[locale],
    c = requestCopy(locale);
  const journey: {
    icon: IconName;
    title: ReturnType<typeof text>;
    copy: ReturnType<typeof text>;
  }[] = [
    {
      icon: "eye",
      title: text("Explore", "দেখুন"),
      copy: text(
        "Browse products and services, or start a general consultation.",
        "পণ্য ও সেবা দেখুন, অথবা সরাসরি সাধারণ পরামর্শ দিয়ে শুরু করুন।",
      ),
    },
    {
      icon: "box",
      title: text("Make it yours", "পছন্দ জানান"),
      copy: text(
        "Collect products, choose a service, and tell us what you need.",
        "পণ্য বাছুন, সেবা নির্বাচন করুন এবং আপনার চাহিদা জানান।",
      ),
    },
    {
      icon: "pin",
      title: text("Choose a preference", "সময় বাছুন"),
      copy: text(
        "Choose how to meet and your preferred date in Dhaka time.",
        "সাক্ষাতের ধরন ও ঢাকার সময় অনুযায়ী পছন্দের তারিখ বাছুন।",
      ),
    },
    {
      icon: "check",
      title: text("Review & contact AIA", "পর্যালোচনা ও যোগাযোগ"),
      copy: text(
        "Save your request document and contact AIA for review and confirmation. Online submission is coming later.",
        "অনুরোধের নথি সংরক্ষণ করে পর্যালোচনা ও নিশ্চিত করার জন্য AIA-এর সঙ্গে যোগাযোগ করুন। অনলাইনে জমা দেওয়া পরে চালু হবে।",
      ),
    },
  ];
  return (
    <>
      <Hero
        locale={locale}
        verifiedBadges={verifiedMetrics
          .filter(
            (item) =>
              item.status === "published" &&
              item.approved &&
              item.sourceUrl &&
              item.verifiedAt,
          )
          .map((item) => ({
            id: item.id,
            label: item.label[locale],
            value: item.value,
          }))}
      />
      <section className="section-space home-overview" id="solutions">
        <div className="shell">
          <div className="section-heading-row">
            <div>
              <p className="section-label">{c.homeDigital}</p>
              <h2 lang="en" className="editorial-brand">
                Considered for your space.
              </h2>
              <p>{d.solutionsDescription}</p>
            </div>
            <Link className="text-link" href={href(locale, "products")}>
              {locale === "bn" ? "সব পণ্য দেখুন" : "Explore All Products"}
            </Link>
          </div>
          <div className="overview-grid">
            {solutionPreviews.map((item) => (
              <Link className="overview-card category-preview" key={item.id}
                href={href(locale, "products") + "?category=" + item.id}>
                <span className="category-emblem"><Icon name={item.icon} /></span>
                <div><h3>{item.name[locale]}</h3><p>{item.description[locale]}</p><Icon name="arrow" /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section-space service-preview">
        <div className="shell">
          <div className="section-heading-row">
            <div>
              <p className="section-label">{d.services}</p>
              <h2 lang="en" className="editorial-brand">
                Ideas, thoughtfully connected.
              </h2>
              <p>{d.servicesIntro}</p>
            </div>
            <Link className="text-link" href={href(locale, "services")}>
              {d.allServices}
            </Link>
          </div>
          <div className="home-service-grid">
            {publicServices
              .filter((s) => s.status === "published")
              .slice(0, 3)
              .map((service) => (
                <article key={service.slug}>
                  <Link
                    className="home-service-image"
                    href={href(locale, `services/${service.slug}`)}
                  >
                    <Image
                      src={service.image.src}
                      alt={service.image.alt[locale]}
                      fill
                      sizes="(max-width: 767px) 100vw, 33vw"
                    />
                    <span className="image-caption">{d.conceptVisual}</span>
                  </Link>
                  <div className="home-service-copy">
                    <h3>{service.name[locale]}</h3>
                    <p>{service.description[locale]}</p>
                    <Link
                      className="text-link"
                      href={href(locale, `services/${service.slug}`)}
                    >
                      {d.viewDetails}
                    </Link>
                    <ServiceActions locale={locale} id={service.slug} compact />
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>
      <section className="section-space why-section">
        <div className="shell">
          <h2>{c.why}</h2>
          <div className="feature-grid">
            {highlights.map((item) => (
              <article key={item.title.en}>
                <Icon name={item.icon} />
                <h3>{item.title[locale]}</h3>
                <p>{item.copy[locale]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section-space journey-section">
        <div className="shell">
          <p className="section-label">
            {locale === "bn" ? "যেভাবে এগোবেন" : "How it works"}
          </p>
          <h2 lang="en" className="editorial-brand">
            From an idea to a clear brief.
          </h2>
          <ol className="feature-grid">
            {journey.map((item) => (
              <li key={item.title.en}>
                <Icon name={item.icon} />
                <h3>{item.title[locale]}</h3>
                <p>{item.copy[locale]}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      {children}
      <ClosingCTA locale={locale} />
    </>
  );
}
