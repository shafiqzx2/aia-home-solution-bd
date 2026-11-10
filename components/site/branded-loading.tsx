"use client";
import { useParams } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { brandingDefaults } from "@/lib/branding";
import { dictionaries, isLocale, type Locale } from "@/lib/i18n";
import { BrandArtwork } from "./brand-artwork";

export function BrandedLoading({ locale, compact = false }: { locale?: Locale; compact?: boolean }) {
  const params = useParams();
  const language = locale ?? (typeof params.lang === "string" && isLocale(params.lang) ? params.lang : "en");
  const logo = brandingDefaults.loading;
  return (
    <div className={`branded-loading ${compact ? "branded-loading-compact" : ""}`}
      role="status" aria-live="polite" aria-busy="true" data-branded-loading>
      <span className="sr-only">{dictionaries[language].loading}</span>
      <span className="branded-loading-visual" aria-hidden="true">
        <BrandArtwork variants={logo} eager>
          {logo.edgeMask && <span className="brand-edge-light"
            style={{ "--brand-edge-mask": `url("${logo.edgeMask.src}")` } as CSSProperties} />}
        </BrandArtwork>
      </span>
    </div>
  );
}

export function RouteLoading() {
  return <main id="main-content" className="brand-loading-page" aria-busy="true"><Suspense fallback={null}><BrandedLoading /></Suspense></main>;
}
