import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { dictionaries, href, isLocale } from "@/lib/i18n";
import {
  company,
  navigation,
  productConcepts,
  publicServices,
  portfolio,
} from "@/lib/public-content";
import { PublicPage } from "@/components/site/public-page";
import { requestCopy } from "@/lib/request-copy";

type Props = { params: Promise<{ lang: string; slug?: string[] }> };
const routes = [
  "",
  ...navigation.filter((key) => key !== "home"),
  ...publicServices
    .filter((p) => p.status === "published")
    .map((p) => `services/${p.slug}`),
  ...portfolio
    .filter((p) => p.status === "published")
    .map((p) => `projects/${p.slug}`),
  "careers/preview",
  "cart",
  "request",
  "privacy",
];
export function generateStaticParams() {
  return routes.map((route) => ({ slug: route ? route.split("/") : [] }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug = [] } = await params;
  if (!isLocale(lang)) return {};
  const d = dictionaries[lang];
  const path = slug.join("/");
  const key = slug[0] as (typeof navigation)[number];
  const entries =
    key === "products"
      ? productConcepts
      : key === "services"
        ? publicServices
        : key === "projects"
          ? portfolio
          : [];
  const item =
    slug.length === 2
      ? entries.find(
          (item) => item.slug === slug[1] && item.status === "published",
        )
      : undefined;
  const title =
    path === "privacy"
      ? requestCopy(lang).privacy
      : path === "cart"
        ? requestCopy(lang).cart
        : path === "request"
          ? requestCopy(lang).consultation
          : path === "careers/preview"
            ? d.jobPreview
            : item
              ? item.name[lang]
              : key && navigation.includes(key)
                ? d[key]
                : company.name;
  return {
    title: !path ? { absolute: `${company.name} — ${d.intro}` } : title,
    description: item ? item.description[lang] : d.heroDescription,
    alternates: {
      canonical: href(lang, path),
      languages: { en: href("en", path), bn: href("bn", path) },
    },
    openGraph: {
      title,
      description: item ? item.description[lang] : d.heroDescription,
      locale: lang === "bn" ? "bn_BD" : "en_BD",
      siteName: company.name,
    },
    ...(["careers/preview", "cart", "request"].includes(path)
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}
async function ResolvedPage({ params }: Props) {
  const { lang, slug = [] } = await params;
  if (!isLocale(lang)) notFound();
  if (slug.length === 2 && slug[0] === "products" && productConcepts.some((p) => p.slug === slug[1] && p.status === "published")) {
    redirect(href(lang, "products") + "?product=" + encodeURIComponent(slug[1]));
  }
  if (!routes.includes(slug.join("/"))) notFound();
  return <PublicPage locale={lang} segments={slug} />;
}

export default function Page({ params }: Props) {
  return <ResolvedPage params={params} />;
}
