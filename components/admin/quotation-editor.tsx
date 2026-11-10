"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { productConcepts, publicServices } from "@/lib/public-content";
import type { CompanySnapshot } from "@/lib/business/company-settings";
import { calculateQuote, money, type QuoteLine } from "@/lib/business/finance";
import { renderQuotation, type QuotationDraft } from "@/lib/business/documents";
import { Button, Field, Empty, DocumentPreview, download } from "./ui";

export function QuotationEditor({
  quote: q,
  setQuote,
  company,
  locale,
  fontCss,
  saved,
  save,
  notify,
  connected,
}: {
  quote: QuotationDraft;
  setQuote: (q: QuotationDraft) => void;
  company: CompanySnapshot;
  locale: "en" | "bn";
  fontCss: string;
  saved: { name: string; data: QuotationDraft }[];
  save: () => void;
  notify: (s: string) => void;
  connected?: {canSave:boolean;busy:boolean;onNew:(draft:QuotationDraft)=>void};
}) {
  const [catalog, setCatalog] = useState(""),
    [showCatalog, setShowCatalog] = useState(false);
  const [previewLocale, setPreviewLocale] = useState(locale);
  function change(key: keyof QuotationDraft, value: string) {
    setQuote({ ...q, [key]: value });
  }
  function line(id: string, key: keyof QuoteLine, value: string) {
    setQuote({
      ...q,
      items: q.items.map((l) => (l.id === id ? { ...l, [key]: value } : l)),
    });
  }
  function add(description = "", code = "") {
    setQuote({
      ...q,
      items: [
        ...q.items,
        {
          id: crypto.randomUUID(),
          code,
          description,
          unit: "pcs",
          quantity: "1",
          unitPrice: "0",
        },
      ],
    });
  }
  let html = "",
    error = "",
    totals: ReturnType<typeof calculateQuote> | null = null;
  try {
    totals = calculateQuote(q);
    html = renderQuotation(q, company, previewLocale, fontCss);
  } catch (e) {
    error = (e as Error).message;
  }
  return (
    <>
      <div className="a-editor-toolbar">
        <div className="a-status">
          <span />
          Draft{" "}
          <span className="a-toolbar-note">
            Manual quotation · No customer request required
          </span>
        </div>
        <div>
          <Button
            secondary
            onClick={() => {
              if(connected){connected.onNew(structuredClone(q));return;}
              setQuote(structuredClone(q));
              notify(
                "Draft duplicated into the editor. Save it as a separate tab-local draft when ready.",
              );
            }}
          >
            Duplicate
          </Button>
          <Button
            secondary
            onClick={() => {
              if (error) return notify(error);
              download(
                "aia-quotation-draft.json",
                JSON.stringify(
                  { kind: "UNAPPROVED_LOCAL_DRAFT", draft: q },
                  null,
                  2,
                ),
              );
            }}
          >
            Export draft
          </Button>
          <Button disabled={!!connected&&(!connected.canSave||connected.busy)} onClick={save}>{connected?'Save to PostgreSQL':'Save draft locally'}</Button>
        </div>
      </div>
      {saved.length > 0 && (
        <div className="a-saved-drafts">
          <strong>Tab-local drafts</strong>
          {saved.map((d, i) => (
            <button key={i} onClick={() => setQuote(structuredClone(d.data))}>
              {d.name} · #{i + 1}
            </button>
          ))}
        </div>
      )}
      <div className="a-editor-grid">
        <div className="a-editor-fields">
          <section className="a-panel">
            <header className="a-panel-header">
              <div>
                <p className="a-overline">01 / THE CLIENT</p>
                <h2>Prepared for</h2>
              </div>
              <Icon name="user" />
            </header>
            <div className="a-form-grid">
              <Field label="Client / organization" wide>
                <input
                  value={q.client}
                  onChange={(e) => change("client", e.target.value)}
                  placeholder="Enter a client or external company"
                  maxLength={200}
                />
              </Field>
              <Field label="Attention / contact person">
                <input
                  value={q.attention}
                  onChange={(e) => change("attention", e.target.value)}
                  maxLength={160}
                />
              </Field>
              <Field label="Recipient email">
                <input
                  type="email"
                  value={q.email}
                  onChange={(e) => change("email", e.target.value)}
                  maxLength={254}
                />
              </Field>
              <Field label="Client address" wide>
                <textarea
                  value={q.address}
                  onChange={(e) => change("address", e.target.value)}
                  rows={2}
                  maxLength={1000}
                />
              </Field>
              <Field label="Project / site" wide>
                <input
                  value={q.project}
                  onChange={(e) => change("project", e.target.value)}
                  maxLength={500}
                />
              </Field>
              <Field label="Document date">
                <input
                  type="date"
                  value={q.date}
                  onChange={(e) => change("date", e.target.value)}
                />
              </Field>
              <Field label="Valid until">
                <input
                  type="date"
                  min={q.date}
                  value={q.validUntil}
                  onChange={(e) => change("validUntil", e.target.value)}
                />
              </Field>
            </div>
            <p className="a-inline-note">
              External recipients do not need an account. Portal access requires
              a separate verified authorization.
            </p>
          </section>
          <section className="a-panel">
            <header className="a-panel-header">
              <div>
                <p className="a-overline">02 / THE SOLUTION</p>
                <h2>Items & services</h2>
              </div>
              <button
                className="a-text-button"
                onClick={() => setShowCatalog(!showCatalog)}
              >
                Catalog <Icon name="plus" />
              </button>
            </header>
            {showCatalog && (
              <div className="a-catalog-picker">
                <input
                  aria-label="Search catalog items"
                  placeholder="Find a product or service…"
                  value={catalog}
                  onChange={(e) => setCatalog(e.target.value)}
                />
                <div>
                  {(connected?[]:[...productConcepts, ...publicServices])
                    .filter(
                      (p) =>
                        p.status === "published" &&
                        p.name[locale]
                          .toLowerCase()
                          .includes(catalog.toLowerCase()),
                    )
                    .map((p) => (
                      <button
                        key={p.slug}
                        onClick={() => {
                          add(p.name[locale], p.slug);
                          setShowCatalog(false);
                        }}
                      >
                        <span>
                          {p.name[locale]}
                          <small>
                            {"contentKind" in p
                              ? "Catalog concept · Enter an authorized private price"
                              : "Service · Enter an authorized private price"}
                          </small>
                        </span>
                        <Icon name="plus" />
                      </button>
                    ))}
                </div>
              </div>
            )}
            {!q.items.length && (
              <Empty icon="box" title="Shape the proposal">
                Choose an existing catalog entry or add a custom product,
                service, installation, or delivery item.
              </Empty>
            )}
            <div className="a-lines">
              {q.items.map((item, i) => (
                <div className="a-line" key={item.id}>
                  <header>
                    <span className="a-line-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <strong>Line item</strong>
                    <button
                      aria-label={`Remove item ${i + 1}`}
                      onClick={() =>
                        setQuote({
                          ...q,
                          items: q.items.filter((l) => l.id !== item.id),
                        })
                      }
                    >
                      <Icon name="close" />
                    </button>
                  </header>
                  <Field label={`Description · item ${i + 1}`} wide>
                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        line(item.id, "description", e.target.value)
                      }
                      maxLength={4000}
                      rows={2}
                    />
                  </Field>
                  <div className="a-line-fields">
                    <Field label="Code">
                      <input
                        value={item.code}
                        onChange={(e) => line(item.id, "code", e.target.value)}
                        maxLength={80}
                      />
                    </Field>
                    <Field label="Unit">
                      <input
                        value={item.unit}
                        onChange={(e) => line(item.id, "unit", e.target.value)}
                        maxLength={20}
                      />
                    </Field>
                    <Field label="Quantity">
                      <input
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(e) =>
                          line(item.id, "quantity", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Unit price · BDT">
                      <input
                        inputMode="decimal"
                        value={item.unitPrice}
                        onChange={(e) =>
                          line(item.id, "unitPrice", e.target.value)
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <div className="a-panel-bottom">
              <Button
                secondary
                onClick={() => add()}
                disabled={q.items.length >= 200}
              >
                <Icon name="plus" /> Add custom line
              </Button>
            </div>
          </section>
          <section className="a-panel">
            <header className="a-panel-header">
              <div>
                <p className="a-overline">03 / THE DETAILS</p>
                <h2>Value & terms</h2>
              </div>
              <span className="a-badge">BDT</span>
            </header>
            <div className="a-form-grid">
              <Field label="Discount · fixed BDT">
                <input
                  inputMode="decimal"
                  value={q.discount}
                  onChange={(e) => change("discount", e.target.value)}
                />
              </Field>
              <Field label="Tax percentage">
                <input
                  inputMode="decimal"
                  value={q.taxPercent}
                  onChange={(e) => change("taxPercent", e.target.value)}
                />
              </Field>
              <Field label="Service / delivery charges · BDT" wide>
                <input
                  inputMode="decimal"
                  value={q.charges}
                  onChange={(e) => change("charges", e.target.value)}
                />
              </Field>
              <Field label="Terms & validity" wide>
                <textarea
                  rows={3}
                  value={q.terms}
                  onChange={(e) => change("terms", e.target.value)}
                  maxLength={4000}
                />
              </Field>
              <Field label="Payment terms" wide>
                <textarea
                  rows={2}
                  value={q.paymentTerms}
                  onChange={(e) => change("paymentTerms", e.target.value)}
                  maxLength={2000}
                />
              </Field>
              <Field label="Delivery & installation" wide>
                <textarea
                  rows={2}
                  value={q.deliveryTerms}
                  onChange={(e) => change("deliveryTerms", e.target.value)}
                  maxLength={2000}
                />
              </Field>
              <Field label="Notes" wide>
                <textarea
                  rows={2}
                  value={q.notes}
                  onChange={(e) => change("notes", e.target.value)}
                  maxLength={2000}
                />
              </Field>
            </div>
            <p className="a-inline-note">
              Half-up rounding per line. Tax applies after the fixed discount;
              additional charges are outside the tax base. Review tax policy
              before official use.
            </p>
            {totals && (
              <div className="a-editor-total">
                <span>Draft total</span>
                <strong>BDT {money(totals.total)}</strong>
              </div>
            )}
          </section>
          <div className="a-locked-actions">
            <Icon name="lock" />
            <p>
              Approval, issue, revision history, official PDF download, and
              email dispatch require authenticated, durable records. No
              financial approval is created here.
            </p>
          </div>
        </div>
        <div className="a-preview-column">
          <label className="a-preview-language">
            Document language{" "}
            <select
              value={previewLocale}
              onChange={(e) => setPreviewLocale(e.target.value as "en" | "bn")}
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
          </label>
          {error ? (
            <div className="a-validation" role="alert">
              {error}
            </div>
          ) : (
            <DocumentPreview html={html} label="Quotation preview" presentation={connected?'draft':'review'}/>
          )}
        </div>
      </div>
    </>
  );
}
