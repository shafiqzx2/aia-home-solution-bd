"use client";
import Image from "next/image";
import { useId, useState } from "react";
import { dictionaries, type Locale } from "@/lib/i18n";
import type { Media } from "@/lib/public-content";

export function MediaGallery({
  images,
  locale,
}: {
  images: Media[];
  locale: Locale;
}) {
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState(false);
  const id = useId();
  if (!images.length) return null;
  const current = images[selected] || images[0];
  const external = /^https:\/\//.test(current.src);
  return (
    <div className="media-gallery">
      <div className="gallery-main" id={id}>
        {failed ? (
          <p style={{ padding: "2rem", textAlign: "center" }}>
            {locale === "bn" ? "ছবি সাময়িকভাবে পাওয়া যাচ্ছে না" : "Image temporarily unavailable"}
          </p>
        ) : external ? (
          <img
            src={current.src}
            alt={current.alt[locale]}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
          />
        ) : (
          <Image
            src={current.src}
            alt={current.alt[locale]}
            fill
            sizes="(max-width: 767px) 100vw, 60vw"
          />
        )}
      </div>
      {images.length > 1 && (
        <div
          className="gallery-thumbnails"
          role="group"
          aria-label={dictionaries[locale].gallery}
        >
          {images.map((item, index) => (
            <button
              key={`${item.src}-${index}`}
              type="button"
              aria-label={item.alt[locale]}
              aria-pressed={selected === index}
              aria-controls={id}
              onClick={() => { setSelected(index); setFailed(false); }}
            >
              {/^https:\/\//.test(item.src) ? (
                <img src={item.src} alt="" width={100} height={75} loading="lazy" />
              ) : (
                <Image src={item.src} alt="" width={100} height={75} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
