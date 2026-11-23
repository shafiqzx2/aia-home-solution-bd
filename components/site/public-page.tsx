import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { dictionaries, href, type Locale } from "@/lib/i18n";
import {
  categories,
  company,
  jobs,
  media,
  productConcepts,
  publicServices,
} from "@/lib/public-content";
import { BrandedLoading } from "./branded-loading";
import { Catalog } from "./catalog";
import { ServiceCatalog } from "./service-catalog";
import { ReviewPreview } from "./review-preview";
import { CartPage } from "./cart-page";
import { RequestContact } from "./inquiry-contact";
import { ContactNotice } from "./direct-contact";
import { contactText } from "@/lib/public-contact";
import { requestCopy } from "@/lib/request-copy";
import { HomeContent, ClosingCTA } from "./home-content";
import { ServiceActions } from "./service-actions";
import { TrustPreview } from "./trust-preview";
import { ContactDetails, SocialLinks } from "./contact-details";
import { RelatedProducts } from "./related-products";


function PageIntro({
  title,
  description,
  label,
}: {
  title: string;
  description?: string;
  label?: string;
}) {
  return (
    <div className="page-intro">
      {label && <p className="section-label">{label}</p>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
function QuotationCTA({ locale }: { locale: Locale }) {
  return <ClosingCTA locale={locale} />;
}
function ProjectCards({ locale }: { locale: Locale }) {
  return <div className="empty-state compact"><h2 className="subheading">{locale === "bn" ? "শিগগিরই আসছে" : "Coming soon"}</h2><p>{contactText(locale, "projects")}</p></div>;
}
function Home({ locale }: { locale: Locale }) {
  const d = dictionaries[locale];
  return (
    <HomeContent locale={locale}>
      <section className="section-space">
        <div className="shell">
          <div className="section-heading-row">
            <div>
              <p className="section-label">{d.projects}</p>
              <h2 lang="en" className="editorial-brand">
                {dictionaries.en.projectsTitle}
              </h2>
            </div>
            <Link className="text-link" href={href(locale, "projects")}>
              {d.projects}
            </Link>
          </div>
          <ProjectCards locale={locale} />
        </div>
      </section>
      <ReviewPreview locale={locale} />
      <TrustPreview locale={locale} />
    </HomeContent>
  );
}
function PageContent({
  locale,
  segments,
}: {
  locale: Locale;
  segments: string[];
}) {
  const d = dictionaries[locale],
    [page, slug] = segments;
  if (!page) return <Home locale={locale} />;
  if (page === "privacy")
    return (
      <section className="section-space">
        <div className="shell privacy-copy">
          <PageIntro title={requestCopy(locale).privacy} />
          <h2>{locale === "bn" ? "অনলাইন জিজ্ঞাসা" : "Online inquiries"}</h2>
          <p>{contactText(locale, "quotation")}</p>
          <h2>
            {locale === "bn" ? "আপনার ব্রাউজারের সংরক্ষণ" : "Browser storage"}
          </h2>
          <p>
            {locale === "bn"
              ? "কার্টে শুধু প্রকাশিত পণ্যের পরিচয় ও পরিমাণ সংরক্ষণ করা হয়। থিমের পছন্দও রাখা হয়। এই ওয়েবসাইটে অনলাইন বুকিং বা কোটেশন জমা নেওয়া হয় না।"
              : "The cart stores published product identifiers and quantities. Your theme preference is also saved. This website does not accept online booking or quotation submissions."}
          </p>
          <h2>{locale === "bn" ? "সরাসরি যোগাযোগ" : "Direct contact"}</h2>
          <p>
            {locale === "bn"
              ? "ফোন, ইমেইল বা WhatsApp ব্যবহার করলে আপনার নির্বাচিত সেবার মাধ্যমে তথ্য পাঠানো হয়। অনলাইন অনুরোধ চালুর আগে তথ্য ব্যবহার, সংরক্ষণ ও মুছে ফেলার বিস্তারিত নীতি প্রকাশ করতে হবে।"
              : "Using phone, email, or WhatsApp shares information through the service you choose. A detailed collection, retention, and deletion policy must be published before online request submission is enabled."}
          </p>
          <ContactDetails locale={locale} />
        </div>
      </section>
    );
  if (page === "cart") return <CartPage locale={locale} />;
  if (page === "request")
    return (
      <section className="section-space">
        <div className="shell request-shell">
          <PageIntro title={requestCopy(locale).consultation} />
          <Suspense fallback={<BrandedLoading locale={locale} compact />}>
            <RequestContact locale={locale} />
          </Suspense>
        </div>
      </section>
    );
  if (page === "products" && !slug)
    return (
      <section className="section-space">
        <div className="shell">
          <PageIntro
            label={d.products}
            title={d.featured}
            description={d.catalogIntro}
          />
          <p className="notice">{d.catalogNotice}</p>
          <ContactNotice locale={locale} />
          <Suspense fallback={<BrandedLoading locale={locale} compact />}>
            <Catalog
              locale={locale}
              products={productConcepts.filter((p) => p.status === "published")}
              categories={categories}
            />
          </Suspense>
        </div>
      </section>
    );
  if (page === "services" && !slug)
    return (
      <>
        <section className="section-space">
          <div className="shell">
            <PageIntro
              label={d.services}
              title={d.servicesTitle}
              description={d.servicesIntro}
            />
            <ContactNotice locale={locale} kind="booking" />
            <Suspense fallback={<BrandedLoading locale={locale} compact />}>
              <ServiceCatalog
                locale={locale}
                services={publicServices.filter(
                  (s) => s.status === "published",
                )}
                categories={categories}
              />
            </Suspense>
          </div>
        </section>
        <QuotationCTA locale={locale} />
      </>
    );
  if (page === "services") {
    const service = publicServices.find(
      (s) => s.slug === slug && s.status === "published",
    )!;
    return (
      <section className="section-space">
        <div className="shell">
          <Link className="text-link back-link" href={href(locale, "services")}>
            {d.allServices}
          </Link>
          <div className="detail-layout">
            <div className="editorial-image">
              <Image
                src={service.image.src}
                alt={service.image.alt[locale]}
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
              />
              <span className="image-caption">{d.conceptVisual}</span>
            </div>
            <div>
              <PageIntro
                label={d.services}
                title={service.name[locale]}
                description={service.description[locale]}
              />
              <h2 className="subheading">{d.serviceScope}</h2>
              <ul className="scope-list">
                {service.scope.map((item) => (
                  <li key={item.en}>{item[locale]}</li>
                ))}
              </ul>
              <p className="content-note">{d.servicesIntro}</p>
              <p className="notice">{contactText(locale, "booking")}</p>
              <ServiceActions locale={locale} id={service.slug} />
            </div>
          </div>
          <RelatedProducts locale={locale} areas={service.areas} />
        </div>
      </section>
    );
  }
  if (page === "projects" && !slug)
    return (
      <section className="section-space">
        <div className="shell">
          <PageIntro
            label={d.projects}
            title={d.projectsTitle}
          />
          <ProjectCards locale={locale} />
        </div>
      </section>
    );
  if (page === "about")
    return (
      <>
        <section className="section-space">
          <div className="shell">
            <PageIntro label={d.about} title={d.aboutTitle} />
            <div className="editorial-split">
              <div className="editorial-image">
                <Image
                  src={media.home.src}
                  alt={media.home.alt[locale]}
                  fill
                  sizes="(max-width: 767px) 100vw, 50vw"
                />
                <span className="image-caption">{d.conceptVisual}</span>
              </div>
              <div className="prose">
                <h2>{company.name}</h2>
                <p>{d.aboutCopy}</p>
                <p>{d.aboutApproach}</p>
                <ContactDetails locale={locale} />
                <h2 className="subheading">{d.approach}</h2>
                <ul className="scope-list">
                  {d.approachItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        <QuotationCTA locale={locale} />
      </>
    );
  if (page === "careers" && !slug)
    return (
      <section className="section-space">
        <div className="shell">
          <PageIntro
            label={d.careers}
            title={d.careersTitle}
            description={d.careersIntro}
          />
          <div className="empty-state">
            <h2>{d.vacancies}</h2>
            {jobs.filter((job) => job.status === "published").length ? (
              jobs
                .filter((job) => job.status === "published")
                .map((job) => <p key={job.slug}>{job.title[locale]}</p>)
            ) : (
              <>
                <h3>{d.noJobs}</h3>
                <p>{d.noJobsDetail}</p>
              </>
            )}
            <Link className="text-link" href={href(locale, "careers/preview")}>
              {d.jobPreview}
            </Link>
          </div>
        </div>
      </section>
    );
  if (page === "careers")
    return (
      <section className="section-space">
        <div className="shell narrow">
          <PageIntro
            label={d.jobPreview}
            title={d.jobTemplate}
            description={d.jobPreviewNote}
          />
          <div className="notice">{d.jobTeam}</div>
          <h2 className="subheading">{d.responsibilities}</h2>
          <p>{d.jobResponsibilities}</p>
          <h2 className="subheading">{d.requirements}</h2>
          <p>{d.jobRequirements}</p>
          <button
            className="button button-gold"
            disabled
            aria-describedby="application-status"
          >
            {d.applicationUnavailable}
          </button>
          <p className="content-note" id="application-status">
            {d.noJobsDetail}
          </p>
        </div>
      </section>
    );
  return (
    <section className="section-space">
      <div className="shell">
        <div className="contact-overview">
          <div>
            <PageIntro
              label={d.contact}
              title={d.contactTitle}
              description={d.contactIntro}
            />
            <p>{d.contactRegion}</p>
            <ContactDetails locale={locale} />
          </div>
          <Suspense fallback={<BrandedLoading locale={locale} compact />}>
            <ContactNotice locale={locale} />
          </Suspense>
        </div>
        <div className="contact-entry-grid">
          {[
            ["consultation", requestCopy(locale).consultation],
            [
              "inquiry",
              locale === "bn" ? "সাধারণ জিজ্ঞাসা" : "General inquiry",
            ],
            ["quotation", d.quotation],
            [
              "office",
              locale === "bn"
                ? "অফিসে সাক্ষাতের অনুরোধ"
                : "Request an office visit",
            ],
            [
              "assessment",
              locale === "bn"
                ? "সাইট পরিদর্শনের অনুরোধ"
                : "Request a site assessment",
            ],
          ].map(([type, label]) => (
            <Link
              key={type}
              href={`${href(locale, "request")}?entry=direct&type=${type}`}
            >
              {label}
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
          <Link href={href(locale, "services")}>
            {requestCopy(locale).book}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="contact-faq">
          <h2>{locale === "bn" ? "অনুরোধ সম্পর্কে" : "About your request"}</h2>
          <details>
            <summary>
              {locale === "bn"
                ? "পরামর্শের জন্য পণ্য বাছতে হবে?"
                : "Do I need to select a product first?"}
            </summary>
            <p>
              {locale === "bn"
                ? "না। সাধারণ পরামর্শের জন্য সরাসরি ইমেইল, ফোন বা হোয়াটসঅ্যাপে যোগাযোগ করুন।"
                : "No. Email, call, or message our team directly for a general consultation."}
            </p>
          </details>
          <details>
            <summary>
              {locale === "bn"
                ? "পছন্দের সময় কি নিশ্চিত বুকিং?"
                : "Is my preferred time a confirmed booking?"}
            </summary>
            <p>{requestCopy(locale).scheduleNote}</p>
          </details>
          <details>
            <summary>
              {locale === "bn"
                ? "পছন্দের পণ্যের তালিকা কীভাবে পাঠাব?"
                : "How do I share a product shortlist?"}
            </summary>
            <p>
              {locale === "bn"
                ? "কার্টে পণ্য যোগ করে ইমেইল বা হোয়াটসঅ্যাপে জিজ্ঞাসা খুলুন। তালিকাটি কপিও করতে পারেন। নির্বাচিত অ্যাপে দেখে পাঠান।"
                : "Add products to your cart, then open an email or WhatsApp inquiry. You can also copy the list. Review and send it in your chosen app."}
            </p>
          </details>
        </div>
        <SocialLinks locale={locale} />
      </div>
    </section>
  );
}
export function PublicPage({
  locale,
  segments,
}: {
  locale: Locale;
  segments: string[];
}) {
  return (
    <>
      <main id="main-content" data-page-path={href(locale, segments.join("/"))}>
        <PageContent locale={locale} segments={segments} />
      </main>
    </>
  );
}
