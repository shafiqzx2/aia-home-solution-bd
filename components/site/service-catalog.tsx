"use client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { dictionaries, href, type Locale } from "@/lib/i18n";
import type { Service, categories as CategoryList } from "@/lib/public-content";
import { CategoryFilter } from "./category-filter";
import { ServiceActions } from "./service-actions";
import { requestCopy } from "@/lib/request-copy";
import {
  categoryBranchIds,
  categoryNodes,
  flattenCategories,
} from "@/lib/category-tree";

export function ServiceCatalog({
  locale,
  services,
  categories,
}: {
  locale: Locale;
  services: Service[];
  categories: typeof CategoryList;
}) {
  const d = dictionaries[locale],
    params = useSearchParams();
  const requested = params.get("category") || "";
  const category =
    requested === "others" ||
    flattenCategories(categories).some((item) => item.id === requested)
      ? requested
      : "";
  const selectedIds = categoryBranchIds(categories, category);
  const query = params.get("q") || "";
  const visible = services.filter(
    (service) =>
      (!category || service.areas.some((area) => selectedIds.includes(area))) &&
      `${service.name[locale]} ${service.description[locale]}`
        .toLocaleLowerCase(locale)
        .includes(query.trim().toLocaleLowerCase(locale)),
  );
  function select(value: string, key = "category") {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${next.size ? `?${next}` : ""}`,
    );
  }
  return (
    <div className="service-catalog">
      <CategoryFilter
        locale={locale}
        nodes={[
          ...categoryNodes(categories, locale),
          { id: "others", label: locale === "bn" ? "অন্যান্য" : "Others" },
        ]}
        selected={category}
        onSelect={select}
        label={d.serviceCategories}
        allLabel={d.allServiceCategories}
        inline
      />
      <label className="search-field service-search">
        <span>{d.search}</span>
        <input
          type="search"
          value={query}
          onChange={(e) => select(e.target.value, "q")}
          placeholder={locale === "bn" ? "সেবা খুঁজুন" : "Search services"}
        />
      </label>
      <p className="results-count" role="status">
        {d.results}: {new Intl.NumberFormat(locale).format(visible.length)}
      </p>
      <div className="service-pages">
        {visible.map((service) => (
          <article key={service.slug}>
            <div className="service-image">
              <Image
                src={service.image.src}
                alt={service.image.alt[locale]}
                fill
                sizes="(max-width: 767px) 100vw, 35vw"
              />
              <span className="image-caption">{d.conceptVisual}</span>
            </div>
            <div>
              <h2>{service.name[locale]}</h2>
              <p>{service.description[locale]}</p>
              <Link
                className="text-link"
                href={href(locale, `services/${service.slug}`)}
              >
                {d.viewDetails}
              </Link>
              <ServiceActions locale={locale} id={service.slug} />
            </div>
          </article>
        ))}
      </div>
      {category === "others" ? (
        <div className="empty-state">
          <h2>
            {locale === "bn"
              ? "আপনার বিশেষ চাহিদার কথা বলুন।"
              : "Tell us what you have in mind."}
          </h2>
          <p>
            {locale === "bn"
              ? "কাজের বিবরণ জানান। AIA কাজের পরিধি ও উপযোগিতা পর্যালোচনা করবে।"
              : "Describe your custom requirement. AIA will need to review scope and suitability."}
          </p>
          <Link
            className="small-action"
            href={`${href(locale, "request")}?entry=service&service=others&type=service`}
          >
            {requestCopy(locale).book}
          </Link>
        </div>
      ) : (
        !visible.length && <p className="empty-state">{d.noServices}</p>
      )}
    </div>
  );
}
