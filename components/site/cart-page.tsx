"use client";
import Link from "next/link";
import { clearCart, setCartQuantity, useCart } from "@/lib/cart";
import { productConcepts } from "@/lib/public-content";
import { dictionaries, href, type Locale } from "@/lib/i18n";
import { requestCopy } from "@/lib/request-copy";
export function CartPage({ locale }: { locale: Locale }) {
  const { items, storageAvailable } = useCart(),
    c = requestCopy(locale);
  return (
    <section className="section-space">
      <div className="shell request-shell">
        <div className="page-intro">
          <h1>{c.cart}</h1>
          <p>{c.cartNote}</p>
        </div>
        {!storageAvailable && <p role="status">{c.storageNote}</p>}
        {!items.length ? (
          <p className="empty-state">{c.empty}</p>
        ) : (
          <>
            <ul className="cart-lines">
              {items.map((line) => {
                const product = productConcepts.find(
                  (p) => p.slug === line.id,
                )!;
                return (
                  <li key={line.id}>
                    <div>
                      <Link href={href(locale, "products") + "?product=" + encodeURIComponent(line.id)}>
                        {product.name[locale]}
                      </Link>
                      <p className="content-note">
                        {product.contentKind === "concept"
                          ? dictionaries[locale].illustration
                          : ""}
                      </p>
                    </div>
                    <div className="quantity-controls">
                      <button
                        type="button"
                        disabled={line.quantity <= 1}
                        aria-label={`${locale === "bn" ? "পরিমাণ কমান" : "Decrease quantity"}: ${product.name[locale]}`}
                        onClick={() =>
                          setCartQuantity(line.id, line.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <label>
                        {c.quantity}
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={line.quantity}
                          onChange={(e) =>
                            setCartQuantity(
                              line.id,
                              Math.max(
                                1,
                                Math.min(
                                  99,
                                  Math.trunc(Number(e.target.value) || 1),
                                ),
                              ),
                            )
                          }
                        />
                      </label>
                      <button
                        type="button"
                        disabled={line.quantity >= 99}
                        aria-label={`${locale === "bn" ? "পরিমাণ বাড়ান" : "Increase quantity"}: ${product.name[locale]}`}
                        onClick={() =>
                          setCartQuantity(line.id, line.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-link"
                      aria-label={`${c.remove}: ${product.name[locale]}`}
                      onClick={() => setCartQuantity(line.id, 0)}
                    >
                      {c.remove}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="action-row">
              <Link
                className="button button-gold"
                href={`${href(locale, "request")}?entry=cart&type=quotation`}
              >
                {c.proceed}
              </Link>
              <button type="button" className="text-link" onClick={clearCart}>
                {c.clear}
              </button>
              <Link
                className="text-link"
                href={`${href(locale, "request")}?entry=cart&type=consultation`}
              >
                {c.consultation}
              </Link>
              <Link
                className="text-link"
                href={`${href(locale, "request")}?entry=cart&type=service`}
              >
                {c.book}
              </Link>
            </div>
          </>
        )}
        <div className="action-row">
          <Link className="text-link" href={href(locale, "products")}>
            {c.browse}
          </Link>
          <Link
            className="text-link"
            href={`${href(locale, "request")}?entry=direct&type=consultation`}
          >
            {c.consultation}
          </Link>
        </div>
      </div>
    </section>
  );
}
