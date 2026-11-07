"use client";
import { useSearchParams } from "next/navigation";
import { dictionaries, type Locale } from "@/lib/i18n";
import {
  type ProductConcept,
  type categories as CategoryList,
} from "@/lib/public-content";
import { ProductCard, ProductQuickView } from "./product-card";
import { CategoryFilter } from "./category-filter";
import { requestCopy } from "@/lib/request-copy";
import {
  categoryBranchIds,
  categoryNodes,
  flattenCategories,
} from "@/lib/category-tree";

export function Catalog({
  locale,
  products,
  categories,
}: {
  locale: Locale;
  products: ProductConcept[];
  categories: typeof CategoryList;
}) {
  const d = dictionaries[locale],
    params = useSearchParams();
  const query = params.get("q") || "",
    requested = params.get("category") || "";
  const groupedCategories = [...categories.filter((item) => !["audio", "digital"].includes(item.id)), {
    id: "audio-digital", name: { en: "Audio & digital", bn: "অডিও ও ডিজিটাল" }, description: { en: "", bn: "" },
    children: categories.filter((item) => ["audio", "digital"].includes(item.id)),
  }];
  const allCategories = flattenCategories(groupedCategories);
  const category = allCategories.some((item) => item.id === requested)
    ? requested
    : "";
  const normalized = query.trim().toLocaleLowerCase(locale);
  const selectedIds = categoryBranchIds(groupedCategories, category);
  const collections = ["featured", "new-arrivals", "new-designs"];
  const collection = collections.includes(params.get("collection") || "")
    ? params.get("collection")!
    : "";
  const c = requestCopy(locale);
  const visible = products.filter(
    (p) =>
      (!category || selectedIds.includes(p.category)) &&
      (!collection ||
        p.collections?.includes(
          collection as "featured" | "new-arrivals" | "new-designs",
        )) &&
      `${p.name[locale]} ${p.description[locale]} ${allCategories.find((c) => c.id === p.category)?.name[locale]}`
        .toLocaleLowerCase(locale)
        .includes(normalized),
  );
  function update(key: string, value: string) {
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
    <div className="catalog-layout">
      <ProductQuickView product={products.find((item) => item.slug === params.get("product"))} locale={locale} onClose={() => update("product", "")} />
      <aside>
        <CategoryFilter
          locale={locale}
          nodes={categoryNodes(groupedCategories, locale)}
          selected={category}
          onSelect={(value) => update("category", value)}
          label={d.categories}
          allLabel={d.all}
        />
      </aside>
      <div className="catalog-results">
        <label className="search-field">
          <span>{d.search}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => update("q", event.target.value)}
            placeholder={d.searchPlaceholder}
          />
        </label>
        <p className="results-count" role="status">
          {d.results}: {new Intl.NumberFormat(locale).format(visible.length)}
        </p>
        <label className="collection-filter">
          {c.collections}
          <select
            value={collection}
            onChange={(e) => update("collection", e.target.value)}
          >
            <option value="">{c.allCollections}</option>
            <option value="featured">{c.featured}</option>
            <option value="new-arrivals">{c.newArrivals}</option>
            <option value="new-designs">{c.newDesigns}</option>
          </select>
        </label>
        <div className="product-grid">
          {visible.map((product) => (
            <ProductCard key={product.slug} product={product} locale={locale}
              onQuickView={() => update("product", product.slug)} />
          ))}
        </div>
        {!visible.length && (
          <div className="empty-state">
            <p>{d.noResults}</p>
            <button
              type="button"
              className="button button-outline"
              onClick={() =>
                window.history.replaceState(null, "", window.location.pathname)
              }
            >
              {d.clear}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
