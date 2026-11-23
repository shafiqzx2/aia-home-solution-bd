"use client";
import { useSearchParams } from "next/navigation";
import { dictionaries, type Locale } from "@/lib/i18n";
import { type ProductConcept, type categories as CategoryList } from "@/lib/public-content";
import { ProductCard, ProductQuickView } from "./product-card";
import { CategoryFilter } from "./category-filter";
import { requestCopy } from "@/lib/request-copy";
import { categoryBranchIds, categoryNodes, flattenCategories } from "@/lib/category-tree";

const cameraTypes = ["Bullet", "Dome", "Turret", "PTZ", "IP", "Analog"] as const;
const cameraBrands = ["Hikvision", "Dahua"] as const;

export function Catalog({
  locale,
  products,
  categories,
}: {
  locale: Locale;
  products: ProductConcept[];
  categories: typeof CategoryList;
}) {
  const d = dictionaries[locale];
  const params = useSearchParams();
  const query = params.get("q") || "";
  const requested = params.get("category") || "";
  const groupedCategories = [
    ...categories.filter((item) => !["audio", "digital"].includes(item.id)),
    {
      id: "audio-digital",
      name: { en: "Audio & digital", bn: "অডিও ও ডিজিটাল" },
      description: { en: "", bn: "" },
      children: categories.filter((item) => ["audio", "digital"].includes(item.id)),
    },
  ];
  const allCategories = flattenCategories(groupedCategories);
  const category = allCategories.some((item) => item.id === requested) ? requested : "";
  const selectedIds = categoryBranchIds(groupedCategories, category);
  const collections = ["featured", "new-arrivals", "new-designs"] as const;
  const collection = collections.includes(params.get("collection") as (typeof collections)[number])
    ? params.get("collection")!
    : "";
  const brand = cameraBrands.includes(params.get("brand") as (typeof cameraBrands)[number])
    ? params.get("brand")!
    : "";
  const cameraType = cameraTypes.map((item) => item.toLowerCase()).includes(params.get("type") || "")
    ? params.get("type")!
    : "";
  const isCctv = category === "security";
  const normalized = query.trim().toLocaleLowerCase(locale);
  const c = requestCopy(locale);
  const visible = products.filter(
    (p) =>
      (!category || selectedIds.includes(p.category)) &&
      (!isCctv || !brand || p.brand === brand) &&
      (!isCctv || !cameraType || p.cameraType?.toLowerCase() === cameraType) &&
      (!collection || p.collections?.includes(collection as "featured" | "new-arrivals" | "new-designs")) &&
      `${p.name[locale]} ${p.description[locale]} ${allCategories.find((item) => item.id === p.category)?.name[locale]}`
        .toLocaleLowerCase(locale)
        .includes(normalized),
  );

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "category" && value !== "security") {
      next.delete("brand");
      next.delete("type");
    }
    window.history.replaceState(null, "", `${window.location.pathname}${next.size ? `?${next}` : ""}`);
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
        {isCctv && <div className="catalog-collection-intro">
          <h2>{locale === "bn" ? "সিসিটিভি ক্যামেরা" : "CCTV Cameras"}</h2>
          <p>{locale === "bn" ? "Hikvision ও Dahua-এর নির্বাচিত মডেল দেখুন। নির্দিষ্ট লেন্স, সংস্করণ, প্রাপ্যতা ও ইনস্টলেশনের উপযোগিতা আমাদের দলের সঙ্গে নিশ্চিত করুন।" : "Browse selected Hikvision and Dahua models. Confirm the exact lens, revision, availability and installation suitability with our team."}</p>
        </div>}
        <label className="search-field">
          <span>{d.search}</span>
          <input type="search" value={query} onChange={(event) => update("q", event.target.value)} placeholder={d.searchPlaceholder} />
        </label>
        <p className="results-count" role="status">{d.results}: {new Intl.NumberFormat(locale).format(visible.length)}</p>
        <label className="collection-filter">
          {c.collections}
          <select value={collection} onChange={(event) => update("collection", event.target.value)}>
            <option value="">{c.allCollections}</option>
            <option value="featured">{c.featured}</option>
            <option value="new-arrivals">{c.newArrivals}</option>
            <option value="new-designs">{c.newDesigns}</option>
          </select>
        </label>
        {isCctv && <div className="catalog-camera-filters">
          <label className="collection-filter">
            {locale === "bn" ? "ব্র্যান্ড" : "Brand"}
            <select value={brand} onChange={(event) => update("brand", event.target.value)}>
              <option value="">{locale === "bn" ? "সব ব্র্যান্ড" : "All brands"}</option>
              {cameraBrands.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="collection-filter">
            {locale === "bn" ? "ধরন" : "Type"}
            <select value={cameraType} onChange={(event) => update("type", event.target.value)}>
              <option value="">{locale === "bn" ? "সব ধরন" : "All types"}</option>
              {cameraTypes.map((item) => <option key={item} value={item.toLowerCase()}>{item}</option>)}
            </select>
          </label>
        </div>}
        <div className="product-grid">
          {visible.map((product) => <ProductCard key={product.slug} product={product} locale={locale} onQuickView={() => update("product", product.slug)} />)}
        </div>
        {!visible.length && <div className="empty-state">
          <p>{d.noResults}</p>
          <button type="button" className="button button-outline" onClick={() => window.history.replaceState(null, "", window.location.pathname)}>{d.clear}</button>
        </div>}
      </div>
    </div>
  );
}
