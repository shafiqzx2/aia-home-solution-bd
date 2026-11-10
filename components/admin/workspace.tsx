"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { BrandArtwork } from "@/components/site/brand-artwork";
import { company } from "@/lib/public-content";
import { currentCompanySnapshot } from "@/lib/business/company-settings";
import { calculateQuote } from "@/lib/business/finance";
import { emptyQuotation, type QuotationDraft } from "@/lib/business/documents";
import {
  createDemoDataset,
  demoSaleDraft,
  type DemoProduct,
} from "@/lib/business/demo-fixtures";
import {
  emptyMemo,
  quotationToMemo,
  type SalesDraft,
} from "@/lib/business/sales";
import { initialDemoRoles } from "@/lib/business/role-matrix";
import { moduleGroups, workspaceModules } from "@/lib/business/modules";
import { themeStorageKey } from "@/lib/theme";
import { Button, getFontCss } from "./ui";
import { LocalDraftProvider } from "./local-drafts";
import { Dashboard } from "./dashboard";
import { QuotationEditor } from "./quotation-editor";
import { DocumentStudio } from "./document-studio";
import { EmailCenter } from "./email-center";
import { Settings } from "./settings";
import { ProductManager } from "./product-manager";
import { RolesManager } from "./roles-manager";
import { MemoStudio } from "./memo-studio";
import { DemoRegister, PlannedModule } from "./module-pages";
import {type AccessProfile} from '@/lib/business/access';
import {canOpenModule,canonicalModule,connectedModules} from '@/lib/business/workspace-access';
import {ConnectedContent} from './connected-workspace';
import {authClient} from '@/lib/auth-client';

export function Workspace({
  locale,
  initialSection,
  actor,
}: {
  locale: "en" | "bn";
  initialSection: string;
  actor?: AccessProfile;
}) {
  const [section, setSection] = useState(initialSection),
    [collapsed, setCollapsed] = useState(false),
    [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState(""),
    [notice, setNotice] = useState(""),
    [accountOpen, setAccountOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([
    "overview",
    "sales",
    "catalog",
    "documents-group",
    "administration",
  ]);
  const [settings, setSettings] = useState(() =>
      currentCompanySnapshot(locale),
    ),
    [fontCss, setFontCss] = useState("");
  const [dataset] = useState(() => actor ? {sales:[],products:[],requests:[],quotations:[],customers:[],services:[],commercialDocuments:[]} : createDemoDataset()),
    [products, setProducts] = useState<DemoProduct[]>(
      () => actor ? [] : createDemoDataset().products,
    );
  const [roles, setRoles] = useState(initialDemoRoles),
    [quote, setQuote] = useState<QuotationDraft>(emptyQuotation);
  const [saved, setSaved] = useState<{ name: string; data: QuotationDraft }[]>(
      [],
    ),
    [quoteSource, setQuoteSource] = useState("");
  const [memo, setMemo] = useState<SalesDraft>(() => emptyMemo()),
    [savedMemos, setSavedMemos] = useState<SalesDraft[]>([]);
  const sidebar = useRef<HTMLElement>(null),
    navigationTrigger = useRef<HTMLButtonElement>(null);
  const active =
      workspaceModules.find((m) => m.id === section) || workspaceModules[0],
    group = moduleGroups.find((g) => g.modules.some((m) => m.id === section))!;
  function navigate(id: string) {
    if(actor&&!canOpenModule(actor,id))return;
    setSection(id);
    setMobileOpen(false);
    setSearch("");
    setNotice("");
    setAccountOpen(false);
    history.pushState({ module: id }, "", `/${locale}/${actor?'admin':'admin-preview'}/${id}`);
    window.scrollTo(0, 0);
    if (mobileOpen)
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(".a-content h1")
          ?.focus({ preventScroll: true }),
      );
  }
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);
  useEffect(() => {
    sidebar.current
      ?.closest(".a-workspace")
      ?.setAttribute("data-workspace-ready", "true");
    const pop = () => {
      const id =
        location.pathname.split("/").filter(Boolean).at(-1) || "dashboard";
      if (workspaceModules.some((m) => m.id === canonicalModule(id))&&(!actor||canOpenModule(actor,canonicalModule(id)))) setSection(canonicalModule(id));
      else setSection("dashboard");
    };
    function keys(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        event.key === "/" &&
        !target.closest("input,textarea,select,[contenteditable]")
      ) {
        const input =
          document.querySelector<HTMLInputElement>(".a-search input");
        if (input?.offsetParent) {
          event.preventDefault();
          input.focus();
        }
      }
      if (event.key === "Escape") {
        setAccountOpen(false);
        if (mobileOpen) {
          setMobileOpen(false);
          navigationTrigger.current?.focus();
        }
      }
      if (mobileOpen && event.key === "Tab") {
        const controls = Array.from(
          sidebar.current?.querySelectorAll<HTMLElement>("a,button,input") ||
            [],
        ).filter((el) => el.offsetParent);
        const first = controls[0],
          last = controls.at(-1);
        if (
          !sidebar.current?.contains(document.activeElement) ||
          (!event.shiftKey && document.activeElement === last)
        ) {
          event.preventDefault();
          first?.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
      }
    }
    document.addEventListener("keydown", keys);
    window.addEventListener("popstate", pop);
    return () => {
      document.removeEventListener("keydown", keys);
      window.removeEventListener("popstate", pop);
    };
  }, [mobileOpen,actor]);
  useEffect(() => {
    let mounted = true;
    void document.fonts.ready.then(() => {
      if (mounted) setFontCss(getFontCss());
    });
    return () => {
      mounted = false;
    };
  }, []);
  function toggleTheme() {
    const next =
      document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem(themeStorageKey, next);
    } catch {}
    window.dispatchEvent(new Event("aia-theme-change"));
  }
  function openQuote(id: string) {
    const q = dataset.quotations.find((q) => q.id === id);
    if (!q) return;
    setQuote(structuredClone(q.draft));
    setQuoteSource(q.id);
    navigate("quotations");
  }
  function convert(id: string) {
    try {
      const q = dataset.quotations.find((q) => q.id === id);
      if (!q) throw Error("Select an eligible demo quotation.");
      setMemo(quotationToMemo(q));
      navigate("memo-studio");
      setNotice(
        "Approved demonstration quotation copied to a new memo draft. No sale, payment or inventory event was created.",
      );
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  function openSale(id: string, kind: "MEMO" | "INVOICE" | "RECEIPT") {
    const sale = dataset.sales.find((s) => s.id === id);
    if (!sale) return;
    setMemo(demoSaleDraft(sale, kind));
    navigate("memo-studio");
  }
  function saveQuote() {
    try {
      calculateQuote(quote);
      if (
        !quote.client.trim() ||
        !quote.items.length ||
        quote.items.some((i) => !i.description.trim())
      )
        throw Error("Enter a client and at least one described item.");
      setSaved([
        ...saved,
        { name: quote.client, data: structuredClone(quote) },
      ]);
      setNotice(
        "Quotation draft saved locally in this tab. No approval or issue was recorded.",
      );
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  const description =
    actor ? (section==='dashboard'?'Sales, customer demand, collections, and the work ahead.':connectedModules.includes(section)?'Manage persisted records. Draft website changes remain private until published.':'This module is unavailable until its operational workflow is verified.') : active.state === "Planned"
      ? `Implementation scheduled for Phase ${active.phase}.`
      : section === "dashboard"
        ? "Sales, customer demand, collections, and the work ahead."
        : section === "memo-studio"
          ? "Create an independent sales memo, invoice, receipt or delivery draft."
          : section === "products"
            ? "Manage a private demonstration catalog without changing the public website."
            : section === "quotations"
              ? "Prepare a considered offer with precise pricing and a clean A4 document."
              : section === "roles" ||
                  section === "permissions" ||
                  section === "root-admin"
                ? "Review responsibilities and permissions before connecting real staff accounts."
                : "Review and prepare work in the isolated development sandbox.";
  const rolePage = [
    "root-admin",
    "users",
    "roles",
    "permissions",
    "staff",
  ].includes(section);
  const registerPage = [
    "customers",
    "requests",
    "quotation-register",
    "sales-memos",
    "invoices",
    "payments",
    "orders",
    "bookings",
    "site-visits",
    "operations",
    "categories",
    "services",
  ].includes(section);
  return (
    <LocalDraftProvider>
      <div
        className={`a-workspace ${collapsed ? "a-collapsed" : ""} ${mobileOpen ? "a-mobile-open" : ""}`}
      >
        {mobileOpen && (
          <button
            className="a-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside
          ref={sidebar}
          className="a-sidebar"
          aria-label="Business navigation"
        >
          <div className="a-sidebar-header">
            <Link
              className="a-brand"
              href={`/${locale}`}
              aria-label="AIA public website"
            >
              <BrandArtwork
                variants={company.logos.header}
                appearance="dark"
                eager
              />
              <span>
                HOME SOLUTIONS<small>BUSINESS WORKSPACE</small>
              </span>
            </Link>
            <button
              className="a-collapse"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              onClick={() => {
                setCollapsed(!collapsed);
                setMobileOpen(false);
              }}
            >
              <Icon name="menu" />
            </button>
          </div>
          <div className="a-sidebar-scroll">
            <nav>
              {moduleGroups.map((g) => {
                const matches = g.modules.filter((m) =>
                  (!actor||canOpenModule(actor,m.id))&&m.label.toLowerCase().includes(search.toLowerCase()),
                );
                if (!matches.length) return null;
                const open = !!search || expanded.includes(g.id);
                return (
                  <section className="a-nav-section" key={g.id}>
                    <button
                      className="a-nav-group"
                      aria-expanded={open}
                      title={g.label}
                      onClick={() =>
                        collapsed
                          ? navigate(matches[0].id)
                          : setExpanded(
                              open
                                ? expanded.filter((id) => id !== g.id)
                                : [...expanded, g.id],
                            )
                      }
                    >
                      <Icon name={g.icon} />
                      <span>{g.label}</span>
                      <Icon
                        name="chevron"
                        className={open ? "a-chevron-open" : ""}
                      />
                    </button>
                    {open && !collapsed && (
                      <div className="a-nav-items">
                        {matches.map((m) => (
                          <button
                            key={m.id}
                            className={section === m.id ? "a-nav-active" : ""}
                            aria-current={section === m.id ? "page" : undefined}
                            title={`${m.label} · ${m.state}`}
                            onClick={() => navigate(m.id)}
                          >
                            <Icon name={m.icon} />
                            <span>{m.label}</span>
                            {(actor?!connectedModules.includes(m.id):m.state === "Planned") && (
                              <small
                                className="a-nav-plan"
                                aria-label={actor?'Unavailable':'Planned'}
                              >
                                {actor?'—':'P'}
                              </small>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })}
            </nav>
            {search &&
              !workspaceModules.some((m) =>
                (!actor||canOpenModule(actor,m.id))&&m.label.toLowerCase().includes(search.toLowerCase()),
              ) && (
                <p className="a-nav-no-results">
                  No modules match this search.
                </p>
              )}
          </div>
          <div className="a-sidebar-bottom">
            <span className="a-chip">{actor?'AUTHENTICATED':'DEVELOPMENT'}</span>
            <p>{actor?'Permission-controlled workspace':'Local tools & fictional demo data'}</p>
            <Link href={`/${locale}`}>
              <Icon name="diagonal" />
              <span>Public website</span>
            </Link>
          </div>
        </aside>
        <div className="a-main">
          <header className="a-topbar">
            <button
              ref={navigationTrigger}
              className="a-mobile-toggle"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => {
                setCollapsed(false);
                setMobileOpen(!mobileOpen);
                if (!mobileOpen)
                  requestAnimationFrame(() =>
                    sidebar.current?.querySelector("a")?.focus(),
                  );
              }}
            >
              <Icon name="menu" />
            </button>
            <div className="a-breadcrumb">
              <span>{group?.label || "Workspace"}</span>
              <Icon name="chevron" />
              <strong>{active.label}</strong>
            </div>
            <label className="a-search">
              <Icon name="search" />
              <input
                aria-label="Search workspace modules"
                placeholder="Find a module…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (e.target.value) setCollapsed(false);
                }}
              />
              <kbd>/</kbd>
            </label>
            <div className="a-top-actions">
              <button aria-label="Toggle workspace theme" onClick={toggleTheme}>
                <Icon name="sun" />
              </button>
              <button
                aria-label="Notifications"
                disabled={!!actor&&!canOpenModule(actor,'notifications')}
                onClick={() => navigate("notifications")}
              >
                <Icon name="bell" />
              </button>
              <button
                className="a-avatar"
                aria-label="Account information"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen(!accountOpen)}
              >
                A
              </button>
            </div>
            {accountOpen && (
              <div className="a-popover">
                {actor?<><strong>{actor.root?'Root Admin':actor.roles.join(' · ')}</strong><p>Authenticated session. Access is checked on the server.</p><Link href={`/${locale}/security`}>Account security <Icon name="shield"/></Link><Button secondary onClick={()=>void authClient.signOut().then(result=>{if(result.error)setNotice('Sign out failed. Please retry.');else location.replace(new URL(`/${locale}/login`,location.origin).href);}).catch(()=>setNotice('Sign out failed. Please retry.'))}>Sign out</Button></>:<><strong>Development reviewer</strong>
                <p>
                  No authenticated staff session is active. Permission changes
                  are local simulations.
                </p>
                <Link href={`/${locale}/login`}>
                  Unified login <Icon name="arrow" />
                </Link></>}
              </div>
            )}
          </header>
          <div className="a-local-banner">
            <Icon name="shield" />
            <strong>{actor?'SECURE WORKSPACE':'DEMO SANDBOX'}</strong>
            <span>
              {actor?'PostgreSQL persistence · Server-authorized access · Unverified operations unavailable':'Fictional records · Local drafts reset on reload · No database, payment, or email actions'}
            </span>
          </div>
          <main id="main-content" className="a-content">
            <div className="a-page-heading">
              <div>
                <div className="a-heading-context">
                  <p className="a-overline">AIA BUSINESS PLATFORM</p>
                  <span
                    className={`a-state-tag ${(actor?!connectedModules.includes(section):active.state === "Planned") ? "state-planned" : ""}`}
                  >
                    {actor?(connectedModules.includes(section)?'Connected':'Unavailable'):active.state}
                  </span>
                </div>
                <h1 tabIndex={-1}>
                  {section === "dashboard"
                    ? "Executive overview"
                    : active.label}
                </h1>
                <p>{description}</p>
              </div>
              {section === "dashboard" && (
                <div className="a-heading-actions">
                  {(!actor||canOpenModule(actor,'products'))&&<Button secondary onClick={() => navigate("products")}>
                    <Icon name="box" />
                    Products
                  </Button>}
                  <Button disabled={!!actor&&!canOpenModule(actor,'memo-studio')} onClick={() => navigate("memo-studio")}>
                    <Icon name="plus" />
                    Create memo
                  </Button>
                </div>
              )}
            </div>
            {notice && (
              <div className="a-notice" role="status">
                <Icon name="clipboard" />
                <span>{notice}</span>
                <button
                  aria-label="Dismiss notice"
                  onClick={() => setNotice("")}
                >
                  <Icon name="close" />
                </button>
              </div>
            )}
            {actor ? <ConnectedContent actor={actor} section={section} notify={setNotice}/> : active.state === "Planned" ? (
              <PlannedModule module={active} />
            ) : (
              <>
                {[
                  "dashboard",
                  "sales-analytics",
                  "product-performance",
                ].includes(section) && (
                  <Dashboard
                    navigate={navigate}
                    dataset={dataset}
                    products={products}
                  />
                )}
                {["products", "inventory", "private-pricing"].includes(
                  section,
                ) && (
                  <ProductManager
                    products={products}
                    setProducts={setProducts}
                    mode={section}
                    notify={setNotice}
                  />
                )}
                {rolePage && (
                  <RolesManager
                    roles={roles}
                    setRoles={setRoles}
                    notify={setNotice}
                  />
                )}
                {registerPage && (
                  <DemoRegister
                    section={section}
                    dataset={dataset}
                    products={products}
                    openQuote={openQuote}
                    convert={convert}
                    openSale={openSale}
                  />
                )}
                {section === "memo-studio" && (
                  <MemoStudio
                    draft={memo}
                    setDraft={setMemo}
                    company={settings}
                    locale={locale}
                    fontCss={fontCss}
                    dataset={dataset}
                    products={products}
                    saved={savedMemos}
                    setSaved={setSavedMemos}
                    notify={setNotice}
                  />
                )}
                {section === "quotations" && (
                  <>
                    <div className="a-quotation-sources">
                      <label>
                        Review a demo quotation{" "}
                        <select
                          value={quoteSource}
                          onChange={(e) => {
                            const q = dataset.quotations.find(
                              (q) => q.id === e.target.value,
                            );
                            if (q) {
                              setQuote(structuredClone(q.draft));
                              setQuoteSource(q.id);
                            }
                          }}
                        >
                          <option value="">
                            Manual / external client draft
                          </option>
                          {dataset.quotations.map((q) => (
                            <option key={q.id} value={q.id}>
                              {q.id} · {q.status} · DEMO
                            </option>
                          ))}
                        </select>
                      </label>
                      {quoteSource && (
                        <Button
                          secondary
                          onClick={() => {
                            const q = dataset.quotations.find(
                              (q) => q.id === quoteSource,
                            );
                            if (
                              !q ||
                              JSON.stringify(quote) !== JSON.stringify(q.draft)
                            )
                              return setNotice(
                                "Local quotation edits have no approval. Reload an approved demo source before conversion.",
                              );
                            convert(quoteSource);
                          }}
                        >
                          <Icon name="swap" />
                          Create memo from source
                        </Button>
                      )}
                    </div>
                    <QuotationEditor
                      quote={quote}
                      setQuote={setQuote}
                      company={settings}
                      locale={locale}
                      fontCss={fontCss}
                      saved={saved}
                      save={saveQuote}
                      notify={setNotice}
                    />
                  </>
                )}
                {section === "documents" && (
                  <DocumentStudio
                    company={settings}
                    locale={locale}
                    fontCss={fontCss}
                    notify={setNotice}
                  />
                )}
                {section === "email" && (
                  <EmailCenter company={settings} notify={setNotice} />
                )}
                {section === "settings" && (
                  <Settings
                    settings={settings}
                    apply={(next) => {
                      setSettings(next);
                      setNotice(
                        "Company details applied to new previews in this tab. Historical issued documents and the public website are unchanged.",
                      );
                    }}
                  />
                )}
              </>
            )}
          </main>
          <footer className="a-workspace-footer">
            <span>AIA Home Solutions BD · Business workspace</span>
            <span>{actor?'Connected CMS · Restricted operations':'Phase A.1 · Local review'}</span>
          </footer>
        </div>
      </div>
    </LocalDraftProvider>
  );
}
