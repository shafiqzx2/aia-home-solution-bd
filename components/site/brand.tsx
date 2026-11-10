"use client";
import {usePublished} from "./published-provider";
import Link from "next/link";

import { href, type Locale } from "@/lib/i18n";
import { BrandArtwork } from "./brand-artwork";
export function Brand({
  locale = "en",
  placement = "header",
  appearance = placement === "footer" ? "dark" : "theme",
}: {
  locale?: Locale;
  placement?: "header" | "footer";
  appearance?: "theme" | "light" | "dark";
}) {
  const {company}=usePublished();
  const logo = company.logos[placement];
  return (
    <Link
      href={href(locale)}
      aria-label={company.name}
      className={`brand brand-${placement}`}
    >
      <BrandArtwork variants={logo} appearance={appearance} eager={placement === "header"} />
    </Link>
  );
}
