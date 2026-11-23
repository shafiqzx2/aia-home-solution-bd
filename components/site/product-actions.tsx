"use client";
import Link from "next/link";
import { useState } from "react";
import { href, type Locale } from "@/lib/i18n";
import { requestCopy } from "@/lib/request-copy";
import { productConcepts } from "@/lib/public-content";
import { inquiryEmail, inquiryWhatsApp, contactText } from "@/lib/public-contact";
import { addToCart, useCart } from "@/lib/cart";

export function CartLink({ locale }: { locale: Locale }) {
  const { count } = useCart(),
    c = requestCopy(locale);
  return (
    <Link
      className="cart-link"
      href={href(locale, "cart")}
      aria-label={`${c.cart}: ${count}`}
    >
      {locale === "bn" ? "কার্ট" : "Cart"}{" "}
      <span aria-live="polite">
        {new Intl.NumberFormat(locale).format(count)}
      </span>
    </Link>
  );
}
export function ProductActions({
  locale,
  id,
  detail = false,
}: {
  locale: Locale;
  id: string;
  detail?: boolean;
}) {
  const c = requestCopy(locale);
  const product = productConcepts.find(p => p.slug === id);
  const message = locale === "bn" ? `AIA Home Solutions BD, ${product?.name[locale] || id} সম্পর্কে জানতে চাই।` : `Hello AIA Home Solutions BD, I would like to inquire about ${product?.name[locale] || id}.`;
  const [quantity, setQuantity] = useState(1),
    [added, setAdded] = useState(false);
  const { storageAvailable } = useCart();
  return (
    <div className="product-actions">
      {detail && (
        <label>
          {c.quantity}
          <input
            aria-label={c.quantity}
            type="number"
            min="1"
            max="99"
            value={quantity}
            onChange={(e) => {
              setQuantity(
                Math.max(
                  1,
                  Math.min(99, Math.trunc(Number(e.target.value) || 1)),
                ),
              );
              setAdded(false);
            }}
          />
        </label>
      )}
      <div className="action-row">
        <button
          type="button"
          className="product-action-primary"
          onClick={() => {
            addToCart(id, quantity);
            setAdded(true);
          }}
        >
          {c.add}
        </button>
        <a className="product-action-secondary" href={inquiryEmail(`${message} Quantity: ${quantity}`)}>{contactText(locale, "email")}</a>
        <a className="product-consultation" href={inquiryWhatsApp(`${message} Quantity: ${quantity}`) || inquiryEmail(message)} target="_blank" rel="noopener noreferrer">{contactText(locale, "whatsapp")}</a>
      </div>
      <span role="status" className="action-feedback">
        {added ? c.added : ""}
        {added && !storageAvailable ? ` ${c.storageNote}` : ""}
      </span>
    </div>
  );
}
