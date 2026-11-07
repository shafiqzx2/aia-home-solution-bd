"use client";
import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { brandName, brandingDefaults, type BrandVariants } from "@/lib/branding";

export function BrandArtwork({
  variants,
  appearance = "theme",
  eager = false,
  children,
}: {
  variants: BrandVariants;
  appearance?: "theme" | "light" | "dark";
  eager?: boolean;
  children?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);
  const displayed = failed ? brandingDefaults.header : variants;
  return (
    <span className={`brand-artwork brand-appearance-${appearance}`}
      style={{ "--brand-ratio": `${displayed.light.width} / ${displayed.light.height}` } as CSSProperties}>
      {fallbackFailed ? <span className="brand-image-fallback">{brandName}</span> : <>
        {(["light", "dark"] as const).filter(tone => appearance === "theme" || appearance === tone).map(tone => (
          <Image key={tone} className={`brand-logo-image brand-on-${tone}`}
            src={displayed[tone].src} width={displayed[tone].width} height={displayed[tone].height}
            alt="" aria-hidden="true" unoptimized
            loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"}
            onError={() => displayed[tone].src === brandingDefaults.header[tone].src
              ? setFallbackFailed(true) : setFailed(true)} />
        ))}
        {children}
      </>}
    </span>
  );
}
