"use client";
import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { amount, calculateQuote, decimal, money } from "@/lib/business/finance";
import {
  aggregateSales,
  paymentSummary,
  type DemoSale,
} from "@/lib/business/sales";
import {
  daysBefore,
  demoToday,
  type DemoDataset,
  type DemoProduct,
} from "@/lib/business/demo-fixtures";
import { Button, download } from "./ui";

export type LiveDashboardData = {source:"POSTGRESQL"; financial:boolean;salesCount:number|null;salesTotal:string|null;paid:string|null;balance:string|null; requests:number|null; products:number|null; categories:number|null; projects:number|null};

function RevenueChart({
  sales,
  days,
  metric,
  live = false,
}: {
  live?: boolean;
  sales: DemoSale[];
  days: number;
  metric: "sales" | "payments";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const buckets = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const day = Math.round((days - 1) * (1 - i / (Math.min(days, 30) - 1)));
    const date = daysBefore(day);
    const previous =
      i === 0
        ? daysBefore(days - 1)
        : daysBefore(
            Math.round((days - 1) * (1 - (i - 1) / (Math.min(days, 30) - 1))) -
              1,
          );
    const a = aggregateSales(sales, previous, date);
    return { date, value: metric === "sales" ? a.total : a.paid };
  });
  const values = buckets.map((p) => Number(p.value)),
    max = Math.max(...values, 1),
    points = values
      .map(
        (v, i) =>
          `${40 + (i * 610) / (values.length - 1)},${210 - (v / max) * 160}`,
      )
      .join(" ");
  return (
    <div className="a-revenue-chart">
      <svg
        viewBox="0 0 690 250"
        role="img"
        aria-label={live?"Sales chart unavailable pending operational verification":`Demonstration ${metric} by date in BDT`}
      >
        <defs>
          <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b59a62" stopOpacity=".3" />
            <stop offset="100%" stopColor="#b59a62" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <line
              x1="40"
              x2="660"
              y1={50 + i * 53.3}
              y2={50 + i * 53.3}
              className="a-chart-gridline"
            />
            <text x="4" y={54 + i * 53.3} className="a-chart-axis">
              {live?'':`${Math.round((max * (1 - i / 3)) / 1000)}k`}
            </text>
          </g>
        ))}
        {!live&&<><polygon
          points={`40,210 ${points} 650,210`}
          fill="url(#revenue-fill)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="var(--a-chart-line)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {buckets.map((p, i) => (
          <g key={p.date}>
            <circle
              tabIndex={0}
              aria-label={`${p.date}: BDT ${money(p.value)} demo`}
              cx={40 + (i * 610) / (values.length - 1)}
              cy={210 - (values[i] / max) * 160}
              r={hover === i ? 5 : 3}
              fill="var(--a-chart-line)"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onMouseLeave={() => setHover(null)}
            />
            {hover === i && (
              <line
                x1={40 + (i * 610) / (values.length - 1)}
                x2={40 + (i * 610) / (values.length - 1)}
                y1="40"
                y2="210"
                stroke="var(--a-gold)"
                strokeDasharray="3 4"
              />
            )}
          </g>
        ))}
        </>}
        <text x="40" y="242" className="a-chart-axis">
          {live?"":buckets[0].date.slice(5)}
        </text>
        <text x="615" y="242" className="a-chart-axis">
          {live?"":"08 Nov"}
        </text>
      </svg>
      {live&&<div className="a-chart-empty"><strong>Time series unavailable</strong><p>The trend chart is not connected. Use the recorded totals above.</p></div>}
      <div className="a-chart-tooltip" aria-live="polite">
        {live ? "Operational integration pending" : hover === null ? (
          <>
            <span className="a-legend-dot" />{" "}
            {metric === "sales" ? "Recorded sales" : "Recorded payments"} · DEMO
            · BDT
          </>
        ) : (
          <>
            {buckets[hover].date} · BDT {money(buckets[hover].value)}
          </>
        )}
      </div>
    </div>
  );
}

export function Dashboard({
  navigate,
  dataset,
  products,
  live,
}: {
  navigate: (id: string) => void;
  dataset: DemoDataset;
  products: DemoProduct[];
  live?: LiveDashboardData;
}) {
  const [period, setPeriod] = useState("30"),
    [metric, setMetric] = useState<"sales" | "payments">("sales"),
    [source, setSource] = useState("demo"),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("all");
  const days = Number(period),
    start = daysBefore(days - 1),
    current = aggregateSales(dataset.sales, start, demoToday),
    previous = aggregateSales(
      dataset.sales,
      daysBefore(days * 2 - 1),
      daysBefore(days),
    );
  const today = aggregateSales(dataset.sales, demoToday, demoToday),
    yesterday = aggregateSales(dataset.sales, daysBefore(1), daysBefore(1));
  const sales = dataset.sales.filter(
      (s) => s.status === "COMMITTED" && s.date >= start,
    ),
    lowStock = products.filter(
      (p) => p.stock <= p.reorder && p.status !== "ARCHIVED",
    );
  const filtered = sales
    .filter(
      (s) =>
        s.customer.toLowerCase().includes(query.toLowerCase()) ||
        s.id.toLowerCase().includes(query.toLowerCase()),
    )
    .filter(
      (s) =>
        status === "all" ||
        paymentSummary(calculateQuote(s).total, s.payments).status === status,
    );
  const counts = ["PAID", "PARTIAL", "UNPAID"].map(
    (state) =>
      sales.filter(
        (s) =>
          paymentSummary(calculateQuote(s).total, s.payments).status === state,
      ).length,
  );
  const totalCount = Math.max(sales.length, 1),
    paidDeg = (counts[0] / totalCount) * 360,
    partialDeg = (counts[1] / totalCount) * 360;
  const offered = decimal(
    dataset.quotations.reduce(
      (s, q) => s + amount(calculateQuote(q.draft).total),
      BigInt(0),
    ),
  );
  const demoKpis: {
    label: string;
    value: string;
    note: string;
    icon: IconName;
    emphasis?: boolean;
  }[] = [
    {
      label: "Recorded sales",
      value: `${money(current.total)}`,
      note: `${current.count} committed demo sales`,
      icon: "receipt",
      emphasis: true,
    },
    {
      label: "Recorded payments",
      value: money(current.paid),
      note: "Allocated demo payment records",
      icon: "wallet",
    },
    {
      label: "Outstanding balance",
      value: money(current.outstanding),
      note: "Sale totals less recorded payments",
      icon: "clock",
    },
    {
      label: "Customer requests",
      value: String(dataset.requests.filter((r) => r.date >= start).length),
      note: "Guest + consultation demo requests",
      icon: "users",
    },
  ];
  const kpis = live ? [
    ...(live.financial ? [
      {label:'Recorded sales',value:money(live.salesTotal||'0'),note:`${live.salesCount} committed records`,icon:'receipt' as const,emphasis:true},
      {label:'Recorded payments',value:money(live.paid||'0'),note:'Posted payment allocations',icon:'wallet' as const},
      {label:'Outstanding balance',value:money(live.balance||'0'),note:'Committed totals less posted payments',icon:'clock' as const},
    ] : []),
    ...(live.requests!==null?[{label:'Customer requests',value:String(live.requests),note:'Persisted inquiries and consultations',icon:'users' as const}]:[]),
    ...(!live.financial&&live.products!==null?[{label:'Products',value:String(live.products),note:'Active catalog records',icon:'box' as const,emphasis:true}]:[]),
    ...(!live.financial&&live.categories!==null?[{label:'Categories',value:String(live.categories),note:'Active catalog categories',icon:'folder' as const}]:[]),
    ...(!live.financial&&live.projects!==null?[{label:'Projects',value:String(live.projects),note:'Persisted portfolio entries',icon:'architecture' as const}]:[]),
  ] : demoKpis;
  const growth =
    amount(previous.total) > BigInt(0)
      ? Number(
          ((amount(current.total) - amount(previous.total)) * BigInt(1000)) /
            amount(previous.total),
        ) / 10
      : null;
  function exportRows() {
    download(
      "aia-demo-sales.csv",
      [
        "DEMO ONLY — NOT LIVE BUSINESS DATA",
        "Reference,Customer,Date,Total BDT,Paid BDT,Balance BDT",
        ...sales.map((s) => {
          const t = calculateQuote(s),
            p = paymentSummary(t.total, s.payments);
          return [s.id, s.customer, s.date, t.total, p.paid, p.balance]
            .map((v) => '"' + v.replaceAll('"', '""') + '"')
            .join(",");
        }),
      ].join("\n"),
      "text/csv;charset=utf-8",
    );
  }
  return (
    <>
      <div className="a-dashboard-controls">
        <div className="a-data-source">
          <span className="a-chip">
            {live ? "POSTGRESQL RECORDS" : source === "demo"
              ? "FICTIONAL DEMO DATA"
              : "LIVE DATA DISCONNECTED"}
          </span>
          <span>{live?'All authorized records · Verification data excluded':'Fixed review period · ending 08 Nov 2026'}</span>
        </div>
        <div>
          {live&&<><select aria-label="Dashboard data source" disabled value="postgresql"><option value="postgresql">PostgreSQL</option></select><select aria-label="Dashboard date range" disabled value="all"><option value="all">All records</option></select><Button secondary disabled><Icon name="download"/>Export unavailable</Button></>}
          {!live&&<><select
            aria-label="Dashboard data source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="demo">Demo sandbox</option>
            <option value="live">Live · not connected</option>
          </select>
          <select
            aria-label="Dashboard date range"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Last 7 demo days</option>
            <option value="30">Last 30 demo days</option>
            <option value="90">Last 90 demo days</option>
          </select>
          <Button secondary disabled={source !== "demo"} onClick={exportRows}>
            <Icon name="download" />
            Export demo
          </Button></>}
        </div>
      </div>
      {!live&&source !== "demo" ? (
        <section className="a-panel a-disconnected">
          <Icon name="lock" />
          <h2>No live business database is connected.</h2>
          <p>
            Sales, customer, and inventory figures are unavailable. Return to
            Demo sandbox to review the interface with isolated fictional
            records.
          </p>
        </section>
      ) : (
        <>
          {live&&!kpis.length&&<section className="a-panel"><h2>No dashboard indicators assigned</h2><p>Your current permissions do not include dashboard data. Contact your administrator to request access.</p></section>}
          <section
            className="a-kpi-grid"
            aria-label={live?"Authorized executive indicators":"Demonstration executive indicators"}
          >
            {kpis.map((k) => (
              <article
                className={`a-kpi ${k.emphasis ? "a-kpi-featured" : ""}`}
                key={k.label}
              >
                <div>
                  <span>{k.label}</span>
                  <Icon name={k.icon} />
                </div>
                <small className="a-kpi-currency">
                  {live ? (k.icon==='users'?'REQUESTS':k.icon==='box'||k.icon==='folder'||k.icon==='architecture'?'RECORDS':'BDT') : k.icon !== "users" ? "BDT" : "REQUESTS"}
                </small>
                <strong>{k.value}</strong>
                <p>{k.note}</p>
                {live&&live.financial&&k.emphasis&&<span className="a-growth">Current persisted records</span>}
                {!live && k.emphasis && growth !== null && (
                  <span className="a-growth">
                    {growth > 0 ? "+" : ""}
                    {growth}% vs previous demo period
                  </span>
                )}
              </article>
            ))}
          </section>
          {!live&&<div className="a-insight-strip">
            <button onClick={() => navigate("orders")}>
              <Icon name="receipt" />
              <span>
                Today <strong>BDT {money(today.total)}</strong>
              </span>
              <small>Yesterday: {money(yesterday.total)}</small>
            </button>
            <button onClick={() => navigate("quotation-register")}>
              <Icon name="file" />
              <span>
                Offer pipeline <strong>BDT {money(offered)}</strong>
              </span>
              <small>Separate from recorded sales</small>
            </button>
            <button onClick={() => navigate("inventory")}>
              <Icon name="box" />
              <span>
                Stock attention <strong>{lowStock.length} products</strong>
              </span>
              <small>At or below reorder point</small>
            </button>
          </div>
          }
          {live&&<div className="a-insight-strip">{([['Products',live.products,'products'],['Categories',live.categories,'categories'],['Projects',live.projects,'projects']] as const).filter(([,value])=>value!==null).map(([label,value,id])=><button key={id} onClick={()=>navigate(id)}><Icon name="box"/><span>{label}<strong>{value} records</strong></span><small>PostgreSQL</small></button>)}</div>}
          <div className="a-dashboard-grid">
            {(!live||live.financial)&&<><section className="a-panel a-revenue-panel">
              <header className="a-panel-header">
                <div>
                  <p className="a-overline">SALES PERFORMANCE</p>
                  <h2>Business over time</h2>
                  <p className="a-support">
                    {live?"Recorded totals are shown above. Time-series analysis is unavailable.":"Committed sale records and their allocated payments."}
                  </p>
                </div>
                <div className="a-tabs">
                  <button
                    aria-pressed={metric === "sales"}
                    onClick={() => setMetric("sales")}
                  >
                    Sales
                  </button>
                  <button
                    aria-pressed={metric === "payments"}
                    onClick={() => setMetric("payments")}
                  >
                    Payments
                  </button>
                </div>
              </header>
              <RevenueChart sales={dataset.sales} days={days} metric={metric} live={!!live}/>
              <footer className="a-chart-foot">
                <span>{live?"Totals come from committed PostgreSQL records.":"Quotes are excluded from this chart."}</span>
                <button
                  className="a-text-button"
                  disabled={!!live}
                  onClick={() => navigate("sales-analytics")}
                >
                  Sales analysis <Icon name="arrow" />
                </button>
              </footer>
            </section>
            <section className="a-panel">
              <header className="a-panel-header">
                <div>
                  <p className="a-overline">PAYMENT POSITION</p>
                  <h2>Collection status</h2>
                </div>
                <Icon name="wallet" />
              </header>
              <div className="a-donut-layout">
                <div
                  className="a-donut"
                  role="img"
                  aria-label={live?"Payment collection unavailable":`${counts[0]} paid, ${counts[1]} partially paid, ${counts[2]} unpaid demo sales`}
                  style={{
                    background: live?"var(--a-border)":`conic-gradient(var(--a-green) 0deg ${paidDeg}deg,var(--a-gold) ${paidDeg}deg ${paidDeg + partialDeg}deg,var(--a-slate) ${paidDeg + partialDeg}deg 360deg)`,
                  }}
                >
                  <span>
                    <strong>{live?"\u2014":sales.length}</strong>
                    <small>{live?"UNAVAILABLE":"DEMO SALES"}</small>
                  </span>
                </div>
                <ul className="a-chart-legend">
                  {["Paid", "Partially paid", "Unpaid"].map((label, i) => (
                    <li key={label}>
                      <span className={`legend-${i}`} />
                      <strong>{label}</strong>
                      <b>{live?"\u2014":counts[i]}</b>
                    </li>
                  ))}
                </ul>
              </div>
              <footer className="a-chart-foot">
                <span>{live?"No verified collection records displayed.":"Counts, not quotation interest."}</span>
                <button
                  className="a-text-button"
                  disabled={!!live}
                  onClick={() => navigate("payments")}
                >
                  Payments <Icon name="arrow" />
                </button>
              </footer>
            </section>
            </>}
            {!live&&<><section className="a-panel a-recent-sales">
              <header className="a-panel-header">
                <div>
                  <p className="a-overline">SALES REGISTER</p>
                  <h2>Recent recorded sales</h2>
                </div>
                <button
                  className="a-text-button"
                  onClick={() => navigate("orders")}
                >
                  View register <Icon name="arrow" />
                </button>
              </header>
              <div className="a-filters a-filters-compact">
                <label className="a-search-field">
                  <Icon name="search" />
                  <input
                    aria-label="Search recent demo sales"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Customer or reference"
                  />
                </label>
                <select
                  aria-label="Recent sale payment status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">All payment states</option>
                  <option value="PAID">Paid</option>
                  <option value="PARTIAL">Partially paid</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>
              <div className="a-table-wrap">
                <table className="a-table">
                  <thead>
                    <tr>
                      <th>Sale / customer</th>
                      <th>Date</th>
                      <th>Total · BDT</th>
                      <th>Balance · BDT</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 5).map((s) => {
                      const total = calculateQuote(s),
                        p = paymentSummary(total.total, s.payments);
                      return (
                        <tr key={s.id}>
                          <td>
                            <strong>{s.customer}</strong>
                            <small>{s.id}</small>
                          </td>
                          <td>{s.date.slice(5)}</td>
                          <td className="a-money">{money(total.total)}</td>
                          <td className="a-money">{money(p.balance)}</td>
                          <td>
                            <span
                              className={`a-status-label ${p.status === "PAID" ? "status-good" : p.status === "PARTIAL" ? "status-warn" : "status-muted"}`}
                            >
                              {p.status === "PARTIAL"
                                ? "Partially paid"
                                : p.status.toLowerCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!filtered.length && (
                <p className="a-table-empty">
                  No demo sales match this filter.
                </p>
              )}
            </section>
            <section className="a-panel">
              <header className="a-panel-header">
                <div>
                  <p className="a-overline">PRODUCT PERFORMANCE</p>
                  <h2>Best-selling solutions</h2>
                </div>
                <Icon name="chart" />
              </header>
              <div className="a-product-ranking">
                {current.products.slice(0, 5).map((p, i) => (
                  <button
                    key={p.code}
                    onClick={() => navigate("product-performance")}
                  >
                    <span className="a-rank-number">{i + 1}</span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {p.quantity} units · {p.code}
                      </small>
                      <i
                        style={{
                          width: `${Number((amount(p.value) * BigInt(100)) / amount(current.products[0].value))}%`,
                        }}
                      />
                    </span>
                    <b>BDT {money(p.value)}</b>
                  </button>
                ))}
              </div>
              <footer className="a-panel-footnote">
                Ranked by demo line value before document-level charges.
              </footer>
            </section>
            <section className="a-panel">
              <header className="a-panel-header">
                <div>
                  <p className="a-overline">OPERATIONS DESK</p>
                  <h2>Visits & customer follow-up</h2>
                </div>
                <button
                  className="a-text-button"
                  onClick={() => navigate("site-visits")}
                >
                  Site visits <Icon name="arrow" />
                </button>
              </header>
              <ul className="a-appointment-list">
                {dataset.requests
                  .filter((r) => r.type === "Site visit")
                  .slice(0, 3)
                  .map((r) => (
                    <li key={r.id}>
                      <span className="a-date-tile">
                        <strong>{r.date.slice(8)}</strong>
                        <small>NOV</small>
                      </span>
                      <span>
                        <strong>{r.customer}</strong>
                        <small>
                          {r.area} · {r.assignee}
                        </small>
                      </span>
                      <span className="a-status-label status-warn">
                        {r.status}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
            <section className="a-panel">
              <header className="a-panel-header">
                <div>
                  <p className="a-overline">OFFER WORKFLOW</p>
                  <h2>Quotation pipeline</h2>
                </div>
                <Icon name="file" />
              </header>
              <div className="a-funnel">
                {[
                  {
                    label: "All demo offers",
                    count: dataset.quotations.length,
                  },
                  {
                    label: "Approved or issued",
                    count: dataset.quotations.filter(
                      (q) => q.status !== "DRAFT",
                    ).length,
                  },
                  {
                    label: "Issued demo offers",
                    count: dataset.quotations.filter(
                      (q) => q.status === "ISSUED",
                    ).length,
                  },
                ].map((p, i) => (
                  <div key={p.label}>
                    <span>
                      {p.label}
                      <b>{p.count}</b>
                    </span>
                    <i
                      style={{
                        width: `${(p.count / dataset.quotations.length) * 100}%`,
                        opacity: 1 - i * 0.18,
                      }}
                    />
                  </div>
                ))}
              </div>
              <footer className="a-panel-footnote">
                An offer is not a sale or payment. No conversion is inferred.
              </footer>
            </section>
            </>}
          </div>
          {!live&&<details className="a-panel a-more-indicators">
            <summary>
              All executive indicators{" "}
              <span>View the complete demo overview</span>
            </summary>
            <div className="a-indicator-grid">
              {[
                ["Total requests", dataset.requests.length],
                [
                  "Today's demo requests",
                  dataset.requests.filter((r) => r.date === demoToday).length,
                ],
                [
                  "Pending inquiries",
                  dataset.requests.filter((r) => r.status === "Pending Review")
                    .length,
                ],
                [
                  "Approved quotations",
                  dataset.quotations.filter((q) => q.status === "APPROVED")
                    .length,
                ],
                [
                  "Issued quotations",
                  dataset.quotations.filter((q) => q.status === "ISSUED")
                    .length,
                ],
                [
                  "Scheduled visits",
                  dataset.requests.filter((r) => r.type === "Site visit")
                    .length,
                ],
                [
                  "Completed demo requests",
                  dataset.requests.filter((r) => r.status === "Completed")
                    .length,
                ],
                ["Total customers", dataset.customers.length],
                [
                  "Published demo products",
                  products.filter((p) => p.status === "PUBLISHED").length,
                ],
                ["Active demo services", dataset.services.length],
                ["Low stock products", lowStock.length],
                ["Committed demo sales", current.count],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </details>}
        </>
      )}
    </>
  );
}
