"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { dictionaries, href, isLocale } from "@/lib/i18n";
export default function NotFound() {
  const params = useParams(),
    locale =
      typeof params.lang === "string" && isLocale(params.lang)
        ? params.lang
        : "en",
    d = dictionaries[locale];
  return (
    <>
      <Header locale={locale} />
      <main id="main-content" className="state-page shell">
        <p>404</p>
        <h1>{d.notFoundTitle}</h1>
        <p>{d.notFoundCopy}</p>
        <Link className="button button-gold" href={href(locale)}>
          {d.backHome}
        </Link>
      </main>
      <Footer locale={locale} />
    </>
  );
}
