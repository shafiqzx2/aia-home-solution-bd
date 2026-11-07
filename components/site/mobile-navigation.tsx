"use client";
import Link from "next/link";
import { useState } from "react";
import { dictionaries, href, type Locale } from "@/lib/i18n";
import { categories, navigation, publicServices } from "@/lib/public-content";
import { Icon } from "@/components/ui/icon";
import type { CategoryNode } from "./category-filter";
import { categoryNodes } from "@/lib/category-tree";

function ProductBranch({
  node,
  locale,
  close,
}: {
  node: CategoryNode;
  locale: Locale;
  close: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const d = dictionaries[locale],
    id = `mobile-category-${node.id}`;
  return (
    <li>
      <div className="menu-category-row">
        <Link
          href={`${href(locale, "products")}?${new URLSearchParams({ category: node.id })}`}
          onClick={close}
        >
          {node.label}
        </Link>
        {!!node.children?.length && (
          <button
            type="button"
            className="icon-button"
            aria-label={`${expanded ? d.collapseCategory : d.expandCategory}: ${node.label}`}
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => setExpanded(!expanded)}
          >
            <Icon name="plus" />
          </button>
        )}
      </div>
      {!!node.children?.length && (
        <ul id={id} hidden={!expanded}>
          {node.children.map((child) => (
            <ProductBranch
              key={child.id}
              node={child}
              locale={locale}
              close={close}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
export function MobileNavigation({
  locale,
  close,
}: {
  locale: Locale;
  close: () => void;
}) {
  const [group, setGroup] = useState<"products" | "services" | null>(null);
  const d = dictionaries[locale];
  const nodes = categoryNodes(categories, locale);
  return (
    <nav aria-label={d.mainNav}>
      {navigation.map((key) => {
        if (key !== "products" && key !== "services")
          return (
            <Link
              key={key}
              href={href(locale, key === "home" ? "" : key)}
              onClick={close}
            >
              {d[key]}
            </Link>
          );
        const expanded = group === key,
          id = `mobile-${key}`;
        return (
          <div className="mobile-nav-group" key={key}>
            <button
              type="button"
              className="menu-group-toggle"
              aria-expanded={expanded}
              aria-controls={id}
              onClick={() => setGroup(expanded ? null : key)}
            >
              <span>{d[key]}</span>
              <Icon name="plus" />
            </button>
            <div id={id} className="menu-group-content" hidden={!expanded}>
              <Link
                className="menu-overview"
                href={href(locale, key)}
                onClick={close}
              >
                {key === "products" ? d.allProducts : d.allServiceCategories}
              </Link>
              <ul>
                {key === "products"
                  ? nodes.map((node) => (
                      <ProductBranch
                        node={node}
                        key={node.id}
                        locale={locale}
                        close={close}
                      />
                    ))
                  : publicServices
                      .filter((service) => service.status === "published")
                      .map((service) => (
                        <li key={service.slug}>
                          <Link
                            href={href(locale, `services/${service.slug}`)}
                            onClick={close}
                          >
                            {service.name[locale]}
                          </Link>
                        </li>
                      ))}
              </ul>
            </div>
          </div>
        );
      })}
      <Link href={href(locale, "login")} onClick={close}>
        {d.login}
      </Link>
    </nav>
  );
}
