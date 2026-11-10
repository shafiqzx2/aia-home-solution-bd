"use client";
import { useLocalDraft } from "./local-drafts";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { amount, money } from "@/lib/business/finance";
import { demoCategories, type DemoProduct } from "@/lib/business/demo-fixtures";
import { Button, Field, download, useDialogFocus } from "./ui";

export function ProductManager({
  products,
  setProducts,
  mode = "products",
  notify,
}: {
  products: DemoProduct[];
  setProducts: (p: DemoProduct[]) => void;
  mode?: string;
  notify: (s: string) => void;
}) {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("all"),
    [status, setStatus] = useState("all"),
    [page, setPage] = useState(1);
  const [editing, setEditing] = useState<DemoProduct | null>(null),
    [error, setError] = useState(""),
    [adjust, setAdjust] = useState<DemoProduct | null>(null),
    [movements, setMovements] = useLocalDraft<
      { sku: string; delta: number; reason: string }[]
    >("inventory:movements", []);
  const editorDialog = useDialogFocus(!!editing),
    stockDialog = useDialogFocus(!!adjust);
  const rows = products.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      (category === "all" || p.category === category) &&
      `${p.name} ${p.sku} ${p.nameBn}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 6)),
    current = Math.min(page, pages),
    visible = rows.slice((current - 1) * 6, current * 6);
  function open(product?: DemoProduct) {
    setError("");
    setEditing(
      product
        ? structuredClone(product)
        : {
            id: crypto.randomUUID(),
            sku: "DEMO-",
            name: "",
            nameBn: "",
            category: demoCategories[0],
            price: "0",
            stock: 0,
            reorder: 5,
            status: "DRAFT",
            unit: "pcs",
            specifications: "",
            image: "",
            demo: true,
          },
    );
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    try {
      amount(editing.price);
      if (!editing.name.trim() || !/^DEMO-[A-Z0-9-]+$/.test(editing.sku))
        throw Error("Enter a product name and a unique DEMO-prefixed SKU.");
      if (products.some((p) => p.id !== editing.id && p.sku === editing.sku))
        throw Error("That SKU already exists in this local catalog.");
      if (
        !Number.isSafeInteger(editing.stock) ||
        editing.stock < 0 ||
        !Number.isSafeInteger(editing.reorder) ||
        editing.reorder < 0
      )
        throw Error(
          "Stock and reorder point must be non-negative whole numbers.",
        );
      setProducts(
        products.some((p) => p.id === editing.id)
          ? products.map((p) =>
              p.id === editing.id ? structuredClone(editing) : p,
            )
          : [structuredClone(editing), ...products],
      );
      setEditing(null);
      notify(
        "Product saved to the demo sandbox in this tab. The public catalog is unchanged.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function adjustStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adjust) return;
    const data = new FormData(event.currentTarget),
      delta = Number(data.get("delta")),
      reason = String(data.get("reason") || "").trim();
    if (
      !Number.isSafeInteger(delta) ||
      delta === 0 ||
      adjust.stock + delta < 0 ||
      reason.length < 5
    ) {
      setError(
        "Enter a non-zero whole-number adjustment, a reason, and a resulting stock of zero or more.",
      );
      return;
    }
    setProducts(
      products.map((p) =>
        p.id === adjust.id ? { ...p, stock: p.stock + delta } : p,
      ),
    );
    setMovements([...movements, { sku: adjust.sku, delta, reason }]);
    setAdjust(null);
    notify(
      "Demo stock adjustment recorded locally. No real inventory changed.",
    );
  }
  return (
    <>
      <div className="a-section-tools">
        <div>
          <span className="a-chip">DEMO CATALOG</span>
          <p>Private catalog preparation · local changes only</p>
        </div>
        <div>
          <Button
            secondary
            onClick={() =>
              download(
                "aia-demo-products.json",
                JSON.stringify({ demo: true, products }, null, 2),
              )
            }
          >
            <Icon name="download" />
            Export
          </Button>
          <Button onClick={() => open()}>
            <Icon name="plus" />
            Add product
          </Button>
        </div>
      </div>
      <div className="a-summary-row">
        <span>
          <strong>{products.length}</strong>Catalog entries
        </span>
        <span>
          <strong>
            {products.filter((p) => p.status === "PUBLISHED").length}
          </strong>
          Published in demo
        </span>
        <span>
          <strong>{products.filter((p) => p.stock <= p.reorder).length}</strong>
          At or below reorder
        </span>
        <span>
          <strong>{demoCategories.length}</strong>Categories
        </span>
      </div>
      <section className="a-panel">
        <div className="a-filters">
          <label className="a-search-field">
            <Icon name="search" />
            <input
              aria-label="Search demo products"
              placeholder="Search name, SKU or বাংলা…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            aria-label="Product category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All categories</option>
            {demoCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Product status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Product / SKU</th>
                <th>Category</th>
                <th>Private price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="a-product-cell">
                      <span
                        className={`a-product-thumb tone-${demoCategories.indexOf(p.category) % 5}`}
                      >
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt=""
                            width={42}
                            height={42}
                            unoptimized
                          />
                        ) : (
                          <Icon
                            name={
                              p.category.includes("lock")
                                ? "lock"
                                : p.category.includes("CCTV")
                                  ? "camera"
                                  : "box"
                            }
                          />
                        )}
                      </span>
                      <span>
                        <strong>{p.name}</strong>
                        <small>{p.sku}</small>
                      </span>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td className="a-money">BDT {money(p.price)}</td>
                  <td>
                    <span className={p.stock <= p.reorder ? "a-stock-low" : ""}>
                      {p.stock} {p.unit}
                    </span>
                    <small>Reorder at {p.reorder}</small>
                  </td>
                  <td>
                    <span
                      className={`a-status-label ${p.status === "PUBLISHED" ? "status-good" : p.status === "ARCHIVED" ? "status-muted" : "status-warn"}`}
                    >
                      {p.status.toLowerCase()}
                    </span>
                  </td>
                  <td>
                    <div className="a-row-actions">
                      <button
                        aria-label={`Edit ${p.sku}`}
                        onClick={() => open(p)}
                      >
                        <Icon name="edit" />
                      </button>
                      {mode === "inventory" ? (
                        <button
                          aria-label={`Adjust stock ${p.sku}`}
                          onClick={() => {
                            setAdjust(p);
                            setError("");
                          }}
                        >
                          <Icon name="swap" />
                        </button>
                      ) : (
                        <button
                          aria-label={`${p.status === "ARCHIVED" ? "Restore" : "Archive"} ${p.sku}`}
                          onClick={() => {
                            setProducts(
                              products.map((row) =>
                                row.id === p.id
                                  ? {
                                      ...row,
                                      status:
                                        p.status === "ARCHIVED"
                                          ? "DRAFT"
                                          : "ARCHIVED",
                                    }
                                  : row,
                              ),
                            );
                            notify(
                              "Catalog status changed locally in the demo sandbox.",
                            );
                          }}
                        >
                          <Icon name="folder" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && (
          <p className="a-table-empty">No products match these filters.</p>
        )}
        <footer className="a-pagination">
          <span>
            {rows.length} matching products · Page {current} of {pages}
          </span>
          <div>
            <Button
              secondary
              disabled={current === 1}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </Button>
            <Button
              secondary
              disabled={current === pages}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </footer>
      </section>
      {mode === "inventory" && (
        <section className="a-panel a-gap-top">
          <header className="a-panel-header">
            <h2>Local stock adjustments</h2>
            <span className="a-chip">DEMO ONLY</span>
          </header>
          {movements.length ? (
            <ul className="a-record-list">
              {movements.map((m, i) => (
                <li key={i}>
                  <strong>
                    {m.sku} · {m.delta > 0 ? "+" : ""}
                    {m.delta}
                  </strong>
                  <span>{m.reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="a-support a-pad">
              No adjustments in this tab. Quotes and draft memos never change
              stock.
            </p>
          )}
        </section>
      )}
      {editing && (
        <div
          className="a-modal-backdrop"
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(null);
          }}
        >
          <section
            {...editorDialog}
            className="a-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-title"
          >
            <header>
              <div>
                <span className="a-overline">DEMO PRODUCT</span>
                <h2 id="product-title">
                  {products.some((p) => p.id === editing.id)
                    ? "Edit product"
                    : "Add product"}
                </h2>
              </div>
              <button
                aria-label="Close product editor"
                onClick={() => setEditing(null)}
              >
                <Icon name="close" />
              </button>
            </header>
            <form onSubmit={save}>
              <div className="a-form-grid">
                <Field label="Product name" wide>
                  <input
                    autoFocus
                    required
                    maxLength={160}
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                  />
                </Field>
                <Field label="বাংলা নাম" wide>
                  <input
                    value={editing.nameBn}
                    onChange={(e) =>
                      setEditing({ ...editing, nameBn: e.target.value })
                    }
                  />
                </Field>
                <Field label="SKU">
                  <input
                    required
                    value={editing.sku}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        sku: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={editing.category}
                    onChange={(e) =>
                      setEditing({ ...editing, category: e.target.value })
                    }
                  >
                    {demoCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Private unit price · BDT">
                  <input
                    inputMode="decimal"
                    value={editing.price}
                    onChange={(e) =>
                      setEditing({ ...editing, price: e.target.value })
                    }
                  />
                </Field>
                <Field label="Initial demo stock">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editing.stock}
                    onChange={(e) =>
                      setEditing({ ...editing, stock: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Reorder point">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editing.reorder}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        reorder: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={editing.status}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        status: e.target.value as DemoProduct["status"],
                      })
                    }
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published in demo</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </Field>
                <Field label="Specifications" wide>
                  <textarea
                    rows={3}
                    value={editing.specifications}
                    onChange={(e) =>
                      setEditing({ ...editing, specifications: e.target.value })
                    }
                  />
                </Field>
                <Field label="Product image · local preview only" wide>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (
                        file.size > 2 * 1024 * 1024 ||
                        !["image/png", "image/jpeg", "image/webp"].includes(
                          file.type,
                        )
                      ) {
                        setError(
                          "Choose a PNG, JPEG or WebP image under 2 MB.",
                        );
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () =>
                        setEditing({
                          ...editing,
                          image: String(reader.result),
                        });
                      reader.readAsDataURL(file);
                    }}
                  />
                </Field>
                {editing.image && (
                  <Image
                    src={editing.image}
                    alt="Selected demo product"
                    width={180}
                    height={120}
                    unoptimized
                    style={{ objectFit: "contain" }}
                  />
                )}
                {editing.image && (
                  <p className="a-inline-note a-wide">
                    Image selected for this tab. Upload/storage validation will
                    be enforced by the future R2 service.
                  </p>
                )}
              </div>
              {error && (
                <p className="a-form-error" role="alert">
                  {error}
                </p>
              )}
              <footer className="a-modal-footer">
                <Button secondary onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <button className="a-button" type="submit">
                  Save local product
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {adjust && (
        <div className="a-modal-backdrop">
          <section
            {...stockDialog}
            onKeyDown={(e) => {
              stockDialog.onKeyDown(e);
              if (e.key === "Escape") setAdjust(null);
            }}
            className="a-modal a-modal-small"
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-title"
          >
            <header>
              <h2 id="stock-title">Adjust demo stock</h2>
              <button
                aria-label="Close stock adjustment"
                onClick={() => setAdjust(null)}
              >
                <Icon name="close" />
              </button>
            </header>
            <form onSubmit={adjustStock}>
              <div className="a-form-grid">
                <p className="a-wide">
                  {adjust.name} · Current {adjust.stock}
                </p>
                <Field label="Quantity change" wide>
                  <input
                    autoFocus
                    name="delta"
                    type="number"
                    step="1"
                    required
                    placeholder="e.g. 5 or -2"
                  />
                </Field>
                <Field label="Adjustment reason" wide>
                  <textarea name="reason" minLength={5} required rows={3} />
                </Field>
              </div>
              {error && (
                <p role="alert" className="a-form-error">
                  {error}
                </p>
              )}
              <footer className="a-modal-footer">
                <button type="submit" className="a-button">
                  Record demo adjustment
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
