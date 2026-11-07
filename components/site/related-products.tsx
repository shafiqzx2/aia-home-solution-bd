import Link from "next/link";
import { categories } from "@/lib/public-content";
import { href, type Locale } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";
export function RelatedProducts({ locale, areas }: { locale: Locale; areas: string[] }) {
  const related = categories.filter((category) => areas.includes(category.id));
  if (!related.length) return null;
  return <section className="section-space related-products"><div className="shell">
    <h2>{locale === "bn" ? "সম্পর্কিত পণ্যের বিভাগ" : "Explore related categories"}</h2>
    <div className="related-categories">{related.map((category) => <Link key={category.id}
      className="button button-outline" href={href(locale, "products") + "?category=" + category.id}>
      {category.name[locale]} <Icon name="arrow" />
    </Link>)}</div>
  </div></section>;
}
