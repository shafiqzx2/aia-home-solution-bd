"use client";
import {usePublished,useSiteCopy} from "./published-provider";
import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { dictionaries, href, type Locale } from "@/lib/i18n";
import {media} from "@/lib/public-content";
import { BrandedLoading } from "./branded-loading";
import { Catalog } from "./catalog";
import { ProjectBrief } from "./project-brief";
import { MediaGallery } from "./media-gallery";
import {CareerApplication} from './career-application';
import { ServiceCatalog } from "./service-catalog";

import { flattenCategories } from "@/lib/category-tree";
import { CartPage } from "./cart-page";
import { RequestFlow } from "./request-flow";
import { requestCopy } from "@/lib/request-copy";
import { HomeContent, ClosingCTA } from "./home-content";
import { ServiceActions } from "./service-actions";

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
  const {portfolio}=usePublished();
  const d = useSiteCopy(locale);
  return (
    <div className="project-grid">
      {portfolio
        .filter((p) => p.status === "published")
        .map((project) => (
          <article className="project-card" key={project.slug}>
            <Link href={href(locale, `projects/${project.slug}`)}>
              <div className="project-image">
                <Image
                  src={project.cover.src}
                  alt={project.cover.alt[locale]}
                  fill
                  sizes="(max-width: 767px) 100vw, 50vw"
                />
                <span>{d.conceptProject}</span>
              </div>
              <div className="project-caption">
                <p>{project.category[locale]}</p>
                <h3>{project.name[locale]}</h3>
                <span className="text-link">{d.viewDetails}</span>
              </div>
            </Link>
          </article>
        ))}
    </div>
  );
}
function Home({ locale, extras }: { locale: Locale; extras?: ReactNode }) {
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
          <p className="content-note">{d.projectNotice}</p>
        </div>
      </section>
      {extras}
    </HomeContent>
  );
}
function PageContent({
  locale,
  segments,
  extras,
}: {
  locale: Locale;
  segments: string[];
  extras?: ReactNode;
}) {
  const {categories,company,jobs,portfolio,products:productConcepts,services:publicServices,pages,connected}=usePublished();
  const allCategories=flattenCategories(categories);
  const d = useSiteCopy(locale),
    [page, slug] = segments;
  if (!page) return <Home locale={locale} extras={extras} />;
  if (page === "privacy")
    return (
      <section className="section-space">
        <div className="shell privacy-copy">
          <PageIntro title={requestCopy(locale).privacy} />
          <h2>{locale === "bn" ? "এই ফর্মে কী হয়" : "What this form does"}</h2>
          <p>{connected?"Submitting a request stores the contact details, preferences, and selected products or services you provide so AIA can review and follow up. Submission does not confirm an appointment or order.":requestCopy(locale).localOnly}</p>
          <h2>
            {locale === "bn" ? "আপনার ব্রাউজারের সংরক্ষণ" : "Browser storage"}
          </h2>
          <p>
            {locale === "bn"
              ? "কার্টে শুধু প্রকাশিত পণ্যের পরিচয় ও পরিমাণ সংরক্ষণ করা হয়। থিমের পছন্দও রাখা হয়। নাম, ফোন, ইমেইল, ঠিকানা ও বিবরণ ব্রাউজার স্টোরেজে রাখা হয় না। ডাউনলোড বা প্রিন্ট করা নথির কপি আপনার নিয়ন্ত্রণে থাকে।"
              : "The cart stores published product identifiers and quantities. Your theme preference is also saved. Names, phone numbers, email, addresses, and request notes are not stored in browser storage. Copies you download or print remain under your control."}
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
            <RequestFlow locale={locale} />
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
            description={d.projectsIntro}
          />
          <div className="empty-state compact">
            <h2 className="subheading">{d.verifiedProjects}</h2>
            <p>{d.projectsEmpty}</p>
          </div>
          <p className="notice">{d.projectNotice}</p>
          <ProjectCards locale={locale} />
        </div>
      </section>
    );
  if (page === "projects") {
    const project = portfolio.find(
      (p) => p.slug === slug && p.status === "published",
    )!;
    return (
      <section className="section-space">
        <div className="shell">
          <Link className="text-link back-link" href={href(locale, "projects")}>
            {d.backProjects}
          </Link>
          <PageIntro
            label={project.category[locale]}
            title={project.name[locale]}
            description={project.description[locale]}
          />
          <p className="notice">{d.projectNotice}</p>
          <MediaGallery images={project.gallery} locale={locale} />
          <div className="project-information">
            <div>
              <h2 className="subheading">{d.location}</h2>
              <p>{project.location?.[locale] || d.notAssigned}</p>
            </div>
            <div>
              <h2 className="subheading">{d.related}</h2>
              <div className="related-links">
                {project.areas.map((id) => (
                  <Link
                    className="text-link"
                    key={id}
                    href={`${href(locale, "products")}?category=${id}`}
                  >
                    {allCategories.find((c) => c.id === id)!.name[locale]}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
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
                {pages.about?.[locale]?.body.leadership?.name&&<section>{pages.about[locale]!.body.leadership!.photo&&<Image src={pages.about[locale]!.body.leadership!.photo!} alt={pages.about[locale]!.body.leadership!.name} width={320} height={360}/>}<h2>{pages.about[locale]!.body.leadership!.name}</h2><p>{pages.about[locale]!.body.leadership!.designation}</p><p>{pages.about[locale]!.body.leadership!.biography}</p></section>}
                <p>{d.aboutCopy}</p>
                <p>{d.aboutApproach}</p>
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
                .map((job) => <p key={job.slug}><Link className="text-link" href={href(locale,`careers/${job.slug}`)}>{job.title[locale]}</Link></p>)
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
  if(page==='careers'&&slug!=='preview'){
    const job=jobs.find(j=>j.slug===slug&&j.status==='published');
    return job?<section className="section-space"><div className="shell narrow">
      <PageIntro label={d.careers} title={job.title[locale]} description={job.description[locale]}/>
      <p>{job.team[locale]} · {job.location[locale]}</p>
      <h2 className="subheading">{d.responsibilities}</h2>
      <ul>{job.responsibilities.map((r,i)=><li key={i}>{r[locale]}</li>)}</ul>
      <h2 className="subheading">{d.requirements}</h2>
      <ul>{job.requirements.map((r,i)=><li key={i}>{r[locale]}</li>)}</ul>
      {job.applicationsOpen?<CareerApplication slug={job.slug} locale={locale}/>:<p className="content-note">{locale==='bn'?'\u0986\u09ac\u09c7\u09a6\u09a8 \u09ac\u09a8\u09cd\u09a7\u0964':'Applications are closed.'}</p>}
    </div></section>:null;
  }
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
            <ProjectBrief locale={locale} />
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
                ? "না। সাধারণ পরামর্শের জন্য সরাসরি অনুরোধ প্রস্তুত করতে পারেন।"
                : "No. You can prepare a general consultation request without selecting any product or service."}
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
                ? "ডাউনলোড করলে কি নথি AIA পাবে?"
                : "Does downloading send my document to AIA?"}
            </summary>
            <p>
              {locale === "bn"
                ? "না। ডাউনলোড ও প্রিন্ট আপনার ডিভাইসে হয়। অনলাইনে জমা দেওয়া এখনো চালু হয়নি। সরাসরি যোগাযোগ করুন।"
                : connected?"Downloading and printing happen on your device. Only submitting the form sends your details to AIA and returns a request reference.":"No. Downloading and printing happen on your device. Online submission is not yet available; contact AIA directly."}
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
  extras,
}: {
  locale: Locale;
  segments: string[];
  extras?: ReactNode;
}) {
  return (
    <>
      <main id="main-content" data-page-path={href(locale, segments.join("/"))}>
        <PageContent locale={locale} segments={segments} extras={extras} />
      </main>
    </>
  );
}
