"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import type { CompanySnapshot } from "@/lib/business/company-settings";
import { calculateQuote, money } from "@/lib/business/finance";
import { renderSalesDocument } from "@/lib/business/documents";
import {
  emptyMemo,
  paymentSummary,
  quotationToMemo,
  validateMemo,
  type SalesDraft,
  type PaymentEntry,
} from "@/lib/business/sales";
import {
  demoToday,
  type DemoDataset,
  type DemoProduct,
} from "@/lib/business/demo-fixtures";
import { Button, Field, DocumentPreview, download } from "./ui";

export function MemoStudio({
  draft,
  setDraft,
  company,
  locale,
  fontCss,
  dataset,
  products,
  saved,
  setSaved,
  notify,
  connected,
}: {
  draft: SalesDraft;
  setDraft: (d: SalesDraft) => void;
  company: CompanySnapshot;
  locale: "en" | "bn";
  fontCss: string;
  dataset: DemoDataset;
  products: DemoProduct[];
  saved: SalesDraft[];
  setSaved: (d: SalesDraft[]) => void;
  notify: (s: string) => void;
  connected?: {canSave:boolean;busy:boolean;persisted:boolean;save:()=>void;onNew:(draft:SalesDraft)=>void};
}) {
  const [source, setSource] = useState(dataset.quotations[0]?.id||''),
    [previewMode, setPreviewMode] = useState("draft"),
    [documentLocale, setDocumentLocale] = useState(locale);
  const [selectedProduct, setSelectedProduct] = useState(""),
    [paymentAmount, setPaymentAmount] = useState(""),
    [method, setMethod] = useState<PaymentEntry["method"]>("CASH"),
    [error, setError] = useState("");
  const titles = {
    MEMO: "Sales memo",
    INVOICE: "Invoice",
    RECEIPT: "Payment receipt",
    CHALLAN: "Delivery challan",
  };
  const update = (key: keyof SalesDraft, value: string) =>
    setDraft({ ...draft, [key]: value });
  let html = "",
    validation = "",
    total: ReturnType<typeof calculateQuote> | null = null,
    summary: ReturnType<typeof paymentSummary> | null = null;
  try {
    total = calculateQuote(draft);
    summary = paymentSummary(total.total, draft.payments);
    html = renderSalesDocument(
      draft,
      company,
      documentLocale,
      fontCss,
      previewMode === "draft"
        ? { mode: "draft" }
        : { mode: "demo-issued", number: `DEMO-${draft.kind}-2026-PREVIEW` },
    );
  } catch (e) {
    validation = (e as Error).message;
  }
  function addLine() {
    const product = products.find((p) => p.id === selectedProduct);
    setDraft({
      ...draft,
      items: [
        ...draft.items,
        {
          id: crypto.randomUUID(),
          code: product?.sku || "",
          description: product?.name || "",
          unit: product?.unit || "pcs",
          quantity: "1",
          unitPrice: product?.price || "0",
        },
      ],
    });
    setSelectedProduct("");
  }
  function recordPayment() {
    try {
      const payment: PaymentEntry = {
        id: `DEMO-PAY-${crypto.randomUUID()}`,
        amount: paymentAmount,
        method,
        state: "POSTED",
        date: draft.date || demoToday,
        reference: "DEMO · local payment entry",
        demo: true,
      };
      paymentSummary(calculateQuote(draft).total, [...draft.payments, payment]);
      setDraft({ ...draft, payments: [...draft.payments, payment] });
      setPaymentAmount("");
      setError("");
      notify(
        "Demonstration payment added locally. No money was collected or transferred.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function save() {
    if(connected){connected.save();return;}
    try {
      validateMemo(draft);
      setSaved([...saved, structuredClone(draft)]);
      notify(
        "Memo saved as a local demo draft. No sale, invoice issue, inventory movement or payment collection was created.",
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <div className="a-studio-toolbar">
        <div>
          <span className="a-chip">{connected?'DATABASE DRAFT':'LOCAL DRAFT'}</span>
          <span>
            {draft.sourceQuotation
              ? `From ${draft.sourceQuotation}`
              : "Custom document · no quotation required"}
          </span>
        </div>
        <div>
          <Button
            secondary
            onClick={() => {
              if(connected){connected.onNew({...emptyMemo(),demo:false,date:new Date().toISOString().slice(0,10)});return;}
              if (draft.items.length || draft.client)
                setSaved([...saved, structuredClone(draft)]);
              setDraft(emptyMemo());
              setPreviewMode("draft");
              setError("");
              notify(
                "New custom memo opened. The previous populated draft is retained in the local draft list.",
              );
            }}
          >
            <Icon name="plus" />
            New custom memo
          </Button>
          <Button disabled={!!connected&&(!connected.canSave||connected.busy)} onClick={save}>{connected?'Save to PostgreSQL':'Save local draft'}</Button>
        </div>
      </div>
      {!connected&&<section className="a-conversion-bar">
        <div>
          <Icon name="swap" />
          <span>
            <strong>Start from an approved offer</strong>
            <small>
              Creates an independent editable memo. The quotation stays
              unchanged.
            </small>
          </span>
        </div>
        <select
          aria-label="Source quotation"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          {dataset.quotations
            .filter((q) => q.status !== "DRAFT")
            .map((q) => (
              <option key={q.id} value={q.id}>
                {q.id} · {q.draft.client}
              </option>
            ))}
        </select>
        <Button
          secondary
          onClick={() => {
            const q = dataset.quotations.find((q) => q.id === source);
            if (!q) return;
            setDraft(quotationToMemo(q));
            setError("");
            setPreviewMode("draft");
            notify(
              "Quotation copied into a new memo draft. No sale or payment was recorded.",
            );
          }}
        >
          Create memo from quotation
        </Button>
      </section>}
      {saved.length > 0 && (
        <div className="a-saved-drafts">
          <strong>Local demo drafts</strong>
          {saved.map((d, i) => (
            <button
              key={i}
              onClick={() => {
                setDraft(structuredClone(d));
                setError("");
              }}
            >
              {titles[d.kind]} · {d.client || "Untitled"} · {i + 1}
            </button>
          ))}
        </div>
      )}
      <div className="a-editor-grid">
        <div className="a-editor-fields">
          <section className="a-panel">
            <header className="a-panel-header">
              <div>
                <p className="a-overline">CUSTOMER & DOCUMENT</p>
                <h2>{titles[draft.kind]} details</h2>
              </div>
              <Icon name="receipt" />
            </header>
            <div className="a-form-grid">
              <Field label="Document type">
                <select
                  value={draft.kind}
                  disabled={!!connected?.persisted}
                  onChange={(e) => update("kind", e.target.value)}
                >
                  <option value="MEMO">Sales memo</option>
                  <option value="INVOICE">Invoice</option>
                  {!connected&&<><option value="RECEIPT">Payment receipt</option>
                  <option value="CHALLAN">Delivery challan</option></>}
                </select>
              </Field>
              <Field label="Document date">
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => update("date", e.target.value)}
                />
              </Field>
              {!connected&&<Field label="Choose demo customer" wide>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const c = dataset.customers.find(
                      (c) => c.id === e.target.value,
                    );
                    if (c)
                      setDraft({
                        ...draft,
                        client: c.name,
                        email: c.email,
                        address: c.area + " · Demo area",
                      });
                  }}
                >
                  <option value="">
                    Or enter external client details below
                  </option>
                  {dataset.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>}
              <Field label="Client / company" wide>
                <input
                  value={draft.client}
                  maxLength={200}
                  onChange={(e) => update("client", e.target.value)}
                  placeholder="Customer or external company"
                />
              </Field>
              <Field label="Client email">
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Contact person">
                <input
                  value={draft.attention}
                  onChange={(e) => update("attention", e.target.value)}
                />
              </Field>
              <Field label="Client / site address" wide>
                <textarea
                  rows={2}
                  value={draft.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </Field>
              <Field label="Project / site" wide>
                <input
                  value={draft.project}
                  onChange={(e) => update("project", e.target.value)}
                />
              </Field>
            </div>
          </section>
          <section className="a-panel">
            <header className="a-panel-header">
              <div>
                <p className="a-overline">PRODUCTS & SERVICES</p>
                <h2>Document items</h2>
              </div>
              <span className="a-chip">PRIVATE BDT</span>
            </header>
            <div className="a-item-picker">
              <select
                aria-label={connected?"Add catalog product":"Add demo catalog product"}
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
              >
                <option value="">Custom product / service line</option>
                {products
                  .filter((p) => p.status !== "ARCHIVED")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.sku}
                    </option>
                  ))}
              </select>
              <Button
                secondary
                disabled={draft.items.length >= 200}
                onClick={addLine}
              >
                <Icon name="plus" />
                Add item
              </Button>
            </div>
            <div className="a-lines">
              {draft.items.length === 0 && (
                <p className="a-table-empty">
                  Select a catalog product or add a custom line.
                </p>
              )}
              {draft.items.map((item, i) => (
                <div className="a-line" key={item.id}>
                  <header>
                    <span className="a-line-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <strong>{item.code || "Custom line"}</strong>
                    <button
                      aria-label={`Remove memo item ${i + 1}`}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          items: draft.items.filter((l) => l.id !== item.id),
                        })
                      }
                    >
                      <Icon name="close" />
                    </button>
                  </header>
                  <Field label={`Memo item ${i + 1} description`} wide>
                    <textarea
                      rows={2}
                      maxLength={4000}
                      value={item.description}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          items: draft.items.map((l) =>
                            l.id === item.id
                              ? { ...l, description: e.target.value }
                              : l,
                          ),
                        })
                      }
                    />
                  </Field>
                  <div className="a-line-fields">
                    {(
                      [
                        ["quantity", "Quantity"],
                        ["unit", "Unit"],
                        ["unitPrice", "Unit price · BDT"],
                        ["code", "Code"],
                      ] as const
                    ).map(([key, label]) => (
                      <Field label={`Item ${i + 1} ${label}`} key={key}>
                        <input
                          value={item[key]}
                          inputMode={
                            key === "quantity" || key === "unitPrice"
                              ? "decimal"
                              : "text"
                          }
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              items: draft.items.map((l) =>
                                l.id === item.id
                                  ? { ...l, [key]: e.target.value }
                                  : l,
                              ),
                            })
                          }
                        />
                      </Field>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="a-panel">
            <header className="a-panel-header">
              <h2>Totals & terms</h2>
            </header>
            <div className="a-form-grid">
              {(
                [
                  ["discount", "Memo discount · BDT"],
                  ["taxPercent", "Memo tax percentage"],
                  ["charges", "Memo service / delivery · BDT"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    inputMode="decimal"
                    value={draft[key]}
                    onChange={(e) => update(key, e.target.value)}
                  />
                </Field>
              ))}
              <Field label="Issuer / prepared by">
                <input
                  value={draft.issuer}
                  onChange={(e) => update("issuer", e.target.value)}
                />
              </Field>
              <Field label="Memo payment terms" wide>
                <textarea
                  rows={2}
                  value={draft.paymentTerms}
                  onChange={(e) => update("paymentTerms", e.target.value)}
                />
              </Field>
              <Field label="Memo notes" wide>
                <textarea
                  rows={2}
                  value={draft.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </Field>
            </div>
            {total && (
              <div className="a-editor-total">
                <span>Grand total</span>
                <strong>BDT {money(total.total)}</strong>
              </div>
            )}
          </section>
          {!connected&&<section className="a-panel">
            <header className="a-panel-header">
              <div>
                <p className="a-overline">PAYMENT SIMULATION</p>
                <h2>Demo payment records</h2>
              </div>
              <Icon name="wallet" />
            </header>
            {summary && (
              <div className="a-payment-cards">
                <span>
                  Paid<strong>BDT {money(summary.paid)}</strong>
                </span>
                <span>
                  Balance<strong>BDT {money(summary.balance)}</strong>
                </span>
                <span>
                  Status<strong>{summary.status}</strong>
                </span>
              </div>
            )}
            <div className="a-form-grid">
              <Field label="Demo payment amount">
                <input
                  inputMode="decimal"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </Field>
              <Field label="Demo payment method">
                <select
                  value={method}
                  onChange={(e) =>
                    setMethod(e.target.value as PaymentEntry["method"])
                  }
                >
                  <option value="CASH">Cash record</option>
                  <option value="BANK_TRANSFER">Bank transfer record</option>
                  <option value="MOBILE_FINANCE">Mobile finance record</option>
                </select>
              </Field>
            </div>
            <div className="a-panel-bottom">
              <Button secondary onClick={recordPayment}>
                Add demo payment record
              </Button>
            </div>
            {draft.payments.length > 0 && (
              <ul className="a-record-list">
                {draft.payments.map((p) => (
                  <li key={p.id}>
                    <span>
                      {p.method.replaceAll("_", " ")} · BDT {money(p.amount)} ·
                      DEMO
                    </span>
                    <button
                      className="a-text-button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          payments: draft.payments.filter(
                            (row) => row.id !== p.id,
                          ),
                        })
                      }
                    >
                      Remove local entry
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="a-inline-note">
              Simulation only. No payment collection, sale commitment, receipt
              issue, or stock movement occurs here.
            </p>
          </section>}
          {error && (
            <div className="a-validation" role="alert">
              {error}
            </div>
          )}
          <div className="a-panel-bottom">
            <Button
              secondary
              onClick={() =>
                download(
                  connected?"aia-memo-draft.json":"aia-demo-memo-draft.json",
                  JSON.stringify({ demo: !connected, draft }, null, 2),
                )
              }
            >
              Export local draft
            </Button>
            <Button
              secondary
              onClick={() => {
                if(connected){connected.onNew({...structuredClone(draft),sourceQuotation:null,payments:[],demo:false});return;}
                setSaved([...saved, structuredClone(draft)]);
                setDraft({
                  ...structuredClone(draft),
                  sourceQuotation: null,
                  payments: [],
                });
                notify(
                  "Independent duplicate opened with no payment entries. Original draft retained locally.",
                );
              }}
            >
              Duplicate
            </Button>
          </div>
        </div>
        <div className="a-preview-column">
          <div className="a-preview-controls">
            <label>
              Layout{" "}
              <select
                value={previewMode}
                onChange={(e) => setPreviewMode(e.target.value)}
              >
                <option value="draft">Draft</option>
                {!connected&&<option value="demo-issued">
                  Issued layout · DEMO specimen
                </option>}
              </select>
            </label>
            <label>
              Language{" "}
              <select
                value={documentLocale}
                onChange={(e) =>
                  setDocumentLocale(e.target.value as "en" | "bn")
                }
              >
                <option value="en">English</option>
                <option value="bn">বাংলা</option>
              </select>
            </label>
          </div>
          {validation ? (
            <div className="a-validation" role="alert">
              {validation}
            </div>
          ) : (
            <DocumentPreview
              presentation={connected?'draft':'review'}
              html={html}
              label={`${titles[draft.kind]} preview`}
            />
          )}
        </div>
      </div>
    </>
  );
}
