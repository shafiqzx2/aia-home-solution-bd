"use client";
import Image from "next/image";
import { useEffect, useId, useRef } from "react";
import { dictionaries, type Locale } from "@/lib/i18n";
import type { ProductConcept } from "@/lib/public-content";
import { Icon } from "@/components/ui/icon";
import { SolutionArt } from "./solution-art";
import { MediaGallery } from "./media-gallery";
import { ProductActions } from "./product-actions";

export function ProductCard({ product, locale, onQuickView }: {
  product: ProductConcept; locale: Locale; onQuickView: () => void;
}) {
  const d = dictionaries[locale];
  return (
    <article className="product-card" data-product-id={product.slug}>
      <button type="button" className="product-visual" onClick={onQuickView}
        aria-label={`${locale === "bn" ? "এক নজরে দেখুন" : "Quick View"}: ${product.name[locale]}`}>
        {product.images[0] ? <Image src={product.images[0].src} alt={product.images[0].alt[locale]}
          fill sizes="(max-width: 599px) 100vw, (max-width: 1100px) 50vw, 33vw" />
          : <SolutionArt shape={product.illustration} />}
      </button>
      <div className="card-copy">
        {product.contentKind === "concept" && <p className="card-type">{d.illustration}</p>}
        <h2>{product.name[locale]}</h2>
        <p>{product.description[locale]}</p>
        <button type="button" className="text-link quick-view-trigger" onClick={onQuickView}>
          {locale === "bn" ? "এক নজরে দেখুন" : "Quick View"} <Icon name="plus" />
        </button>
      </div>
      <ProductActions locale={locale} id={product.slug} />
    </article>
  );
}

export function ProductQuickView({ product, locale, onClose }: {
  product: ProductConcept | undefined; locale: Locale; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const d = dictionaries[locale];
  useEffect(() => {
    const node = dialog.current;
    if (!product || !node) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, [product]);
  return (
    <dialog ref={dialog} className="product-quick-view" aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      {product && <div className="quick-view-content">
        <button type="button" className="quick-view-close" onClick={onClose}
          aria-label={locale === "bn" ? "বন্ধ করুন" : "Close Quick View"} autoFocus><Icon name="close" /></button>
        {product.images.length ? <MediaGallery images={product.images} locale={locale} /> : <SolutionArt shape={product.illustration} />}
        <div>
          <p className="section-label">{locale === "bn" ? "পণ্যের বিবরণ" : "Product details"}</p>
          <h2 id={titleId}>{product.name[locale]}</h2>
          <p>{product.description[locale]}</p>
          {product.contentKind === "concept" && <p className="notice">{d.catalogNotice}</p>}
          <h3>{d.specifications}</h3>
          {product.specifications.length ? <dl className="specifications">
            {product.specifications.map((spec) => <div key={spec.label.en}><dt>{spec.label[locale]}</dt><dd>{spec.value[locale]}</dd></div>)}
          </dl> : <p>{d.specificationPending}</p>}
          <p>{d.availability}: {d.confirmation}</p>
          <ProductActions key={product.slug} locale={locale} id={product.slug} detail />
        </div>
      </div>}
    </dialog>
  );
}
