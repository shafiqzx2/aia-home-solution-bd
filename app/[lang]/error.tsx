"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { dictionaries, href, isLocale } from "@/lib/i18n";
export default function ErrorPage({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const params = useParams(),
    locale =
      typeof params.lang === "string" && isLocale(params.lang)
        ? params.lang
        : "en",
    d = dictionaries[locale];
  return (
    <main id="main-content" className="state-page shell">
      <h1>{d.errorTitle}</h1>
      <p>{d.errorCopy}</p>
      <div className="form-actions">
        <button type="button" className="button button-gold" onClick={retry}>
          {d.retry}
        </button>
        <Link className="button button-outline" href={href(locale)}>
          {d.backHome}
        </Link>
      </div>
    </main>
  );
}
