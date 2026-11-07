"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { dictionaries, href, type Locale } from "@/lib/i18n";
import { media } from "@/lib/public-content";
import { Icon } from "@/components/ui/icon";
import { requestCopy } from "@/lib/request-copy";
// Traced from the luminous band in the original 1536 × 1024 artwork.
const fixturePath =
  "M725 0 L725 91 Q724 116 751 129 L1467 360 L939 466 L1480 535 L1300 577 L1478 609 L1395 625 L1480 635";
export function Hero({
  locale = "en",
  verifiedBadges = [],
}: {
  locale?: Locale;
  verifiedBadges?: { id: string; label: string; value: string }[];
}) {
  const [paused, setPaused] = useState(false);
  const d = dictionaries[locale];
  const c = requestCopy(locale);
  return (
    <section
      className={`hero ${paused ? "motion-paused" : ""}`}
      aria-labelledby="hero-heading"
    >
      <div className="hero-scene" aria-hidden="true">
        <div className="fixture-canvas">
          <Image
            src={media.hero.src}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="hero-image"
          />
        </div>
        <div className="hero-shade" />
        <div className="fixture-canvas fixture-overlay">
          {/* Shared image coordinates and cover crop keep this light on the fixture. */}
          <svg
            className="fixture-light"
            viewBox="0 0 1536 1024"
            preserveAspectRatio="xMidYMid slice"
          >
            <path
              className="fixture-glow"
              pathLength="1000"
              d={fixturePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinejoin="round"
            />
            <path
              className="fixture-highlight"
              pathLength="1000"
              d={fixturePath}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      <div className="shell hero-content">
        <p className="hero-intro">{d.intro}</p>
        <h1 id="hero-heading" lang="en">
          {d.heroTitle}
          <br />
          <em>{d.heroAccent}</em>
        </h1>
        <p className="hero-description">{d.heroDescription}</p>
        <div className="hero-actions">
          <Link
            className="button button-gold"
            href={`${href(locale, "request")}?entry=direct&type=consultation`}
          >
            {c.consultation}
          </Link>
          <Link className="text-link" href={href(locale, "products")}>
            {locale === "bn" ? "পণ্য দেখুন" : "Explore Products"}
            <Icon name="arrow" />
          </Link>
          <Link className="text-link" href={href(locale, "services")}>
            {c.book}
          </Link>
        </div>
        <ul className="hero-indicators">
          <li>
            <Icon name="architecture" />
            {locale === "bn"
              ? "আবাসিক ও বাণিজ্যিক"
              : "Residential & Commercial"}
          </li>
          <li>
            <Icon name="layers" />
            {locale === "bn"
              ? "পরামর্শ ও পরিকল্পনা"
              : "Consultation & Planning"}
          </li>
          <li>
            <Icon name="pin" />
            {locale === "bn" ? "সাইট পরিদর্শনের অনুরোধ" : "Site Visit Requests"}
          </li>
        </ul>
        {!!verifiedBadges.length && (
          <ul className="hero-indicators hero-verified">
            {verifiedBadges.map((item) => (
              <li key={item.id}>
                <Icon name="check" />
                <span>
                  {item.value} · {item.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="shell hero-bottom">
        <p>{d.conceptVisual}</p>
        <button
          type="button"
          className="motion-control"
          aria-pressed={paused}
          aria-label={paused ? d.resume : d.pause}
          onClick={() => setPaused(!paused)}
        >
          <Icon name={paused ? "play" : "pause"} />
        </button>
      </div>
    </section>
  );
}
