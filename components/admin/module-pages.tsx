"use client";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { calculateQuote, money } from "@/lib/business/finance";
import { paymentSummary } from "@/lib/business/sales";
import type { DemoDataset, DemoProduct } from "@/lib/business/demo-fixtures";
import type { WorkspaceModule } from "@/lib/business/modules";
import { Button } from "./ui";

export function PlannedModule({ module }: { module: WorkspaceModule }) {
  return (
    <section className="a-panel a-roadmap">
      <span className="a-roadmap-icon">
        <Icon name={module.icon} />
      </span>
      <div>
        <span className="a-chip">PLANNED · PHASE {module.phase}</span>
        <h2>{module.label}</h2>
        <p>
          This module is part of the platform architecture. It is not connected
          or represented as a completed feature.
        </p>
      </div>
      <div className="a-roadmap-steps">
        <div>
          <Icon name="shield" />
          <strong>Authorization first</strong>
          <p>Verified staff session and scoped server permissions.</p>
        </div>
        <div>
          <Icon name="file" />
          <strong>Durable records</strong>
          <p>Reviewed schema, audit history, and real persistence.</p>
        </div>
        <div>
          <Icon name="clipboard" />
          <strong>Tested operations</strong>
          <p>
            Ownership, validation, filters, and provider evidence where
            relevant.
          </p>
        </div>
      </div>
    </section>
  );
}
export function DemoRegister({
  section,
  dataset,
  products,
  openQuote,
  convert,
  openSale,
}: {
  section: string;
  dataset: DemoDataset;
  products: DemoProduct[];
  openQuote: (id: string) => void;
  convert: (id: string) => void;
  openSale: (id: string, kind: "MEMO" | "INVOICE" | "RECEIPT") => void;
}) {
  const [query, setQuery] = useState("");
  let columns: string[] = [],
    rows: {
      id: string;
      cells: string[];
      action?: () => void;
      secondary?: () => void;
    }[] = [];
  if (section === "quotation-register") {
    columns = ["Quotation", "Client", "Date", "Value · BDT", "Offer status"];
    rows = dataset.quotations.map((q) => ({
      id: q.id,
      cells: [
        q.id,
        q.draft.client,
        q.draft.date,
        money(calculateQuote(q.draft).total),
        q.status,
      ],
      action: () => openQuote(q.id),
      secondary: q.status !== "DRAFT" ? () => convert(q.id) : undefined,
    }));
  } else if (section === "orders") {
    columns = [
      "Sale reference",
      "Customer",
      "Date",
      "Total · BDT",
      "Balance · BDT",
      "Payment state",
    ];
    rows = dataset.sales
      .filter((s) => s.status === "COMMITTED")
      .slice(0, 18)
      .map((s) => {
        const total = calculateQuote(s),
          p = paymentSummary(total.total, s.payments);
        return {
          id: s.id,
          cells: [
            s.id,
            s.customer,
            s.date,
            money(total.total),
            money(p.balance),
            p.status,
          ],
          action: () => openSale(s.id, "MEMO"),
        };
      });
  } else if (section === "sales-memos" || section === "invoices") {
    columns = [
      "Document number",
      "Customer",
      "Date",
      "Billed - BDT",
      "Balance - BDT",
      "Document status",
    ];
    rows = dataset.commercialDocuments
      .filter((d) => d.kind === (section === "invoices" ? "INVOICE" : "MEMO"))
      .map((d) => {
        const s = dataset.sales.find((s) => s.id === d.saleId)!;
        const total = calculateQuote(s),
          p = paymentSummary(total.total, s.payments);
        return {
          id: d.id,
          cells: [
            d.id,
            s.customer,
            s.date,
            money(total.total),
            money(p.balance),
            d.status + " / DEMO",
          ],
          action: () => openSale(s.id, d.kind),
        };
      });
  } else if (section === "payments") {
    columns = [
      "Payment reference",
      "Customer / sale",
      "Payment date",
      "Paid - BDT",
      "Method",
      "Record status",
    ];
    rows = dataset.sales
      .filter((s) => s.status === "COMMITTED")
      .flatMap((s) =>
        s.payments.map((p) => ({
          id: p.id,
          cells: [
            p.id,
            s.customer + " / " + s.id,
            p.date,
            money(p.amount),
            p.method.replaceAll("_", " "),
            p.state + " / DEMO",
          ],
          action:
            p.state === "POSTED" ? () => openSale(s.id, "RECEIPT") : undefined,
        })),
      );
  } else if (section === "customers") {
    columns = [
      "Customer",
      "Fictional organization",
      "Service area",
      "Synthetic contact",
    ];
    rows = dataset.customers.map((c) => ({
      id: c.id,
      cells: [c.name, c.organization, c.area, c.email],
    }));
  } else if (
    ["requests", "bookings", "site-visits", "operations"].includes(section)
  ) {
    columns = ["Request", "Customer", "Type", "State", "Area / assigned staff"];
    rows = dataset.requests
      .filter(
        (r) =>
          section === "requests" ||
          section === "operations" ||
          r.type ===
            (section === "bookings" ? "Service booking" : "Site visit"),
      )
      .map((r) => ({
        id: r.id,
        cells: [
          r.id,
          r.customer,
          r.type,
          r.status,
          `${r.area} / ${r.assignee}`,
        ],
      }));
  } else if (section === "categories") {
    columns = ["Category", "Demo products", "Published", "Low stock"];
    rows = [...new Set(products.map((p) => p.category))].map((c) => ({
      id: c,
      cells: [
        c,
        String(products.filter((p) => p.category === c).length),
        String(
          products.filter((p) => p.category === c && p.status === "PUBLISHED")
            .length,
        ),
        String(
          products.filter((p) => p.category === c && p.stock <= p.reorder)
            .length,
        ),
      ],
    }));
  } else {
    columns = ["Service", "Category", "Publication state"];
    rows = dataset.services.map((s) => ({
      id: s.id,
      cells: [s.name, s.category, s.status],
    }));
  }
  const filtered = rows.filter((r) =>
    r.cells.join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <section className="a-panel">
        <header className="a-panel-header">
          <div>
            <p className="a-overline">FICTIONAL BANGLADESH DATA</p>
            <h2>
              {section === "payments"
                ? "Recorded demo payments"
                : section === "operations"
                  ? "Authorized location list · demo areas only"
                  : "Demonstration register"}
            </h2>
          </div>
          <span className="a-chip">DEMO · READ ONLY</span>
        </header>
        <div className="a-filters">
          <label className="a-search-field">
            <Icon name="search" />
            <input
              aria-label="Search demo register"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this register…"
            />
          </label>
          <span className="a-support">{filtered.length} example records</span>
        </div>
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
                {rows.some((r) => r.action) && <th>Local workflow</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  {r.cells.map((c, i) => (
                    <td key={i}>{i === 0 ? <strong>{c}</strong> : c}</td>
                  ))}
                  {rows.some((row) => row.action) && (
                    <td>
                      <div className="a-register-actions">
                        {r.action && (
                          <Button secondary onClick={r.action}>
                            {section === "quotation-register"
                              ? "Open quotation"
                              : "Preview document"}
                          </Button>
                        )}
                        {r.secondary && (
                          <button
                            className="a-text-button"
                            onClick={r.secondary}
                          >
                            Create memo
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <p className="a-table-empty">
            No demonstration records match this search.
          </p>
        )}
        <footer className="a-panel-footnote">
          No records in this register are live customers, sales or payment
          confirmations.
        </footer>
      </section>
      {section === "operations" && (
        <div className="a-connection-note">
          <Icon name="pin" />
          <span>
            No coordinates or geocoding provider are configured. The location
            list uses fictional service areas, without invented map pins.
          </span>
        </div>
      )}
    </>
  );
}
