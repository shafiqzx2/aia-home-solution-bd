"use client";

import { useRef, useState } from "react";
import { collections, products, type Collection } from "@/lib/site-content";
import { Icon } from "@/components/ui/icon";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductArt } from "./product-art";

export function ProductShowcase() {
  const [filter, setFilter] = useState<Collection>("All lighting");
  const [selected, setSelected] = useState(products[0]);
  const dialog = useRef<HTMLDialogElement>(null);
  const visible = products.filter(
    (product) => filter === "All lighting" || product.category === filter,
  );

  function viewProduct(product: (typeof products)[number]) {
    setSelected(product);
    dialog.current?.showModal();
  }
  function chooseCollection(value: Collection) {
    setFilter(value);
    document.getElementById("products")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <>
      <section id="collections" className="section-space collections-section">
        <div className="shell">
          <div className="section-topline">
            <SectionHeading
              eyebrow="The collections"
              title={
                <>
                  Different expressions.
                  <br />
                  <em>One beautiful purpose.</em>
                </>
              }
            />
            <p className="topline-note">
              From a quiet architectural detail
              <br />
              to a statement that starts a conversation.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {collections.map((collection) => (
              <button
                type="button"
                key={collection.name}
                className={`collection-card collection-${collection.name.toLowerCase()}`}
                onClick={() => chooseCollection(collection.name)}
              >
                <ProductArt shape={collection.shape} />
                <span className="collection-number">
                  {collection.number} / COLLECTION
                </span>
                <span className="collection-caption">
                  <span>
                    <strong>{collection.name} lighting</strong>
                    <small>{collection.description}</small>
                  </span>
                  <span className="round-arrow">
                    <Icon name="diagonal" />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <section id="products" className="section-space featured-section">
        <div className="shell">
          <div className="section-topline">
            <SectionHeading
              eyebrow="Considered selections"
              title={
                <>
                  Objects of light.
                  <br />
                  <em>Designed to belong.</em>
                </>
              }
            />
            <p className="topline-note">
              A glimpse into the possibilities.
              <br />
              Explore a form. Imagine it in your space.
            </p>
          </div>
          <div className="product-toolbar">
            <div
              className="filter-list"
              role="group"
              aria-label="Filter product concepts"
            >
              {(
                [
                  "All lighting",
                  "Architectural",
                  "Decorative",
                  "Outdoor",
                ] as Collection[]
              ).map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <span className="product-count" aria-live="polite">
              {visible.length}{" "}
              {visible.length === 1 ? "selection" : "selections"}
            </span>
          </div>
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((product) => (
              <article className="product-card" key={product.id}>
                <button
                  type="button"
                  className="product-image-button"
                  onClick={() => viewProduct(product)}
                  aria-label={`View ${product.name} concept`}
                >
                  <ProductArt shape={product.shape} />
                  <span className="product-visual-label">DESIGN REFERENCE</span>
                  <span className="product-view">
                    <Icon name="plus" />
                  </span>
                </button>
                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3>
                    <button type="button" onClick={() => viewProduct(product)}>
                      {product.name}
                    </button>
                  </h3>
                  <p>{product.description}</p>
                </div>
              </article>
            ))}
          </div>
          {visible.length === 0 && (
            <p role="status" className="empty-state">
              There are no selections in this collection yet. Please explore
              another category.
            </p>
          )}
          <p className="catalogue-note">
            Illustrative design selections, not a live inventory. Final
            products, finishes, specifications, and availability are confirmed
            during consultation. No public prices.
          </p>
        </div>
      </section>
      <dialog
        ref={dialog}
        className="product-dialog"
        aria-labelledby="product-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className="product-dialog-inner">
          <button
            type="button"
            className="icon-button dialog-close"
            onClick={() => dialog.current?.close()}
            aria-label="Close product details"
          >
            <Icon name="close" />
          </button>
          <ProductArt shape={selected.shape} />
          <div className="product-dialog-copy">
            <p className="eyebrow">{selected.category} · Design reference</p>
            <h2 id="product-dialog-title" className="display-heading">
              {selected.name}
            </h2>
            <p>{selected.detail}</p>
            <dl>
              <dt>Visual finish</dt>
              <dd>{selected.finish}</dd>
            </dl>
            <p className="fine-print">
              This is a concept, not a purchasable product listing. Final
              details are confirmed with our team.
            </p>
            <a
              href="#contact"
              className="button button-dark"
              onClick={() => dialog.current?.close()}
            >
              Plan a similar look <Icon name="diagonal" />
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
