"use client";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart, validateCart, type CartLine } from "@/lib/cart";
import { company, productConcepts, publicServices } from "@/lib/public-content";
import { dictionaries, href, type Locale } from "@/lib/i18n";
import {
  contactModes,
  requestCopy,
  requestPurposes,
  timeWindows,
} from "@/lib/request-copy";
import {
  dhakaToday,
  validPhone,
  validPreferredDate,
} from "@/lib/request-validation";
import {
  keepDraftForLanguage,
  consumeLanguageDraft,
  clearLanguageDraft,
  subscribeLanguageDraft,
  languageDraftRevision,
  type RequestDraft,
} from "@/lib/request-draft";
import { RequestDocument, type RequestDocumentData } from "./request-document";
import { BrandedLoading } from "./branded-loading";

const products = productConcepts.filter((p) => p.status === "published");
const services = publicServices.filter((s) => s.status === "published");
const subscribe = () => () => {};
export function RequestFlow({ locale }: { locale: Locale }) {
  const params = useSearchParams(),
    { items } = useCart();
  const pathname = usePathname();
  const query = params.toString();
  const [requestQuery, setRequestQuery] = useState(query);
  // Activity-cached forms still receive router context updates while hidden.
  // Only this locale's active request route may change the entry/form key;
  // another page's filters must not reset the customer's in-memory draft.
  const active = pathname === href(locale, "request");
  if (active && requestQuery !== query) setRequestQuery(query);
  const requestParams = new URLSearchParams(active ? query : requestQuery);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const languageRevision = useSyncExternalStore(
    subscribeLanguageDraft,
    () => languageDraftRevision(locale),
    () => 0,
  );
  if (!hydrated) return <BrandedLoading locale={locale} compact />;
  const entry = requestParams.get("entry") || "direct";
  const selectedService = services.find(
    (s) => s.slug === requestParams.get("service"),
  );
  const initialProducts =
    entry === "cart"
      ? items
      : entry === "product"
        ? validateCart([
            {
              id: requestParams.get("product"),
              quantity: Number(requestParams.get("quantity") || 1),
            },
          ])
        : [];
  const requested = requestParams.get("type") || "consultation";
  const purpose = Object.hasOwn(requestPurposes, requested)
    ? (requested as keyof typeof requestPurposes)
    : "consultation";
  const entryKey = requestParams.toString();
  return (
    <RequestForm
      key={locale + ":" + entryKey + ":" + languageRevision}
      locale={locale}
      entryKey={entryKey}
      initialProducts={initialProducts}
      initialServices={
        entry === "service" && selectedService ? [selectedService.slug] : []
      }
      initialCustom={entry === "service" && requestParams.get("service") === "others"}
      initialPurpose={purpose}
    />
  );
}
function RequestForm({
  locale,
  entryKey,
  initialProducts,
  initialServices,
  initialCustom,
  initialPurpose,
}: {
  locale: Locale;
  entryKey: string;
  initialProducts: CartLine[];
  initialServices: string[];
  initialCustom: boolean;
  initialPurpose: keyof typeof requestPurposes;
}) {
  const c = requestCopy(locale),
    d = dictionaries[locale];
  const [draft, setDraft] = useState<RequestDraft>(
    () =>
      consumeLanguageDraft(entryKey, locale) || {
        lines: initialProducts,
        services: initialServices,
        purpose: initialPurpose,
        mode:
          initialPurpose === "office"
            ? "office"
            : initialPurpose === "assessment"
              ? "onsite"
              : initialPurpose === "inquiry"
                ? "contact"
                : "phone",
        date: "",
        time: "flexible",
        alternative: "",
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
        custom: initialCustom,
        customDescription: "",
        position: 0,
      },
  );
  const [error, setError] = useState(false),
    [downloaded, setDownloaded] = useState(false);
  const [documentData, setDocumentData] = useState<RequestDocumentData | null>(
    null,
  );
  const form = useRef<HTMLFormElement>(null);
  const [submissionNotice, setSubmissionNotice] = useState(false);
  const latest = useRef(draft);
  useEffect(() => {
    latest.current = draft;
  }, [draft]);
  useEffect(() => {
    clearLanguageDraft(latest.current);
    const preserve = (event: Event) => {
      const target = (event as CustomEvent<{ locale: Locale }>).detail?.locale;
      if (target === "en" || target === "bn")
        keepDraftForLanguage(entryKey, latest.current, target);
    };
    window.addEventListener("aia:request-language-switch", preserve);
    return () =>
      window.removeEventListener("aia:request-language-switch", preserve);
  }, [entryKey]);
  const needsCustom = draft.custom || draft.purpose === "other";
  const patch = (values: Partial<RequestDraft>) => {
    setDraft((previous) => ({ ...previous, ...values }));
    setError(false);
    setSubmissionNotice(false);
    setDownloaded(false);
    setDocumentData(null);
  };
  function validDetails() {
    return (
      !!draft.name.trim() &&
      validPhone(draft.phone) &&
      (!draft.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email))
    );
  }
  function submitRequest(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    // No backend endpoint exists yet. Never report a submission or booking.
    setSubmissionNotice(true);
  }
  function validate() {
    if (!form.current?.reportValidity() || !finalValid()) {
      setError(true);
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return false;
    }
    setError(false);
    return true;
  }
  function finalValid() {
    return (
      validDetails() &&
      (draft.mode !== "onsite" || !!draft.address.trim()) &&
      (draft.mode === "contact" || validPreferredDate(draft.date)) &&
      (!needsCustom || draft.customDescription.trim().length >= 10)
    );
  }
  function rows() {
    return [
      { label: c.purpose, value: requestPurposes[draft.purpose][locale] },
      { label: c.mode, value: contactModes[draft.mode][locale] },
      ...(draft.mode !== "contact"
        ? [
            { label: c.date, value: draft.date },
            {
              label: c.time,
              value: timeWindows[draft.time][locale] + " · Asia/Dhaka",
            },
            { label: c.alternative, value: draft.alternative || c.notProvided },
          ]
        : []),
      { label: c.name, value: draft.name.trim() },
      { label: c.phone, value: draft.phone.trim() },
      { label: c.email, value: draft.email.trim() || c.notProvided },
      ...(draft.mode === "onsite"
        ? [{ label: c.address, value: draft.address.trim() }]
        : draft.mode === "office"
          ? [
              {
                label: c.office,
                value: company.contact.address?.[locale] || c.notProvided,
              },
            ]
          : []),
      ...(needsCustom
        ? [
            {
              label: c.customDescription,
              value: draft.customDescription.trim(),
            },
          ]
        : []),
      { label: c.notes, value: draft.notes.trim() || c.notProvided },
    ];
  }
  function documentSnapshot(): RequestDocumentData {
    return {
      locale,
      generatedAt: new Date().toISOString(),
      products: draft.lines.map((line) => ({
        name:
          products.find((p) => p.slug === line.id)!.name[locale] +
          (products.find((p) => p.slug === line.id)!.contentKind === "concept"
            ? " (" + d.illustration + ")"
            : ""),
        quantity: line.quantity,
      })),
      services: [
        ...draft.services.map(
          (id) => services.find((s) => s.slug === id)!.name[locale],
        ),
        ...(draft.custom ? [c.others] : []),
      ],
      rows: rows(),
    };
  }
  async function printPdf() {
    if (!validate()) return;
    setDocumentData(documentSnapshot());
    await document.fonts.ready;
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
  }
  function downloadText() {
    if (!validate()) return;
    const snapshot = documentSnapshot();
    const body = [
      company.name,
      c.documentTitle,
      c.draft,
      c.generated + ": " + snapshot.generatedAt,
      c.selections,
      ...snapshot.products.map((item) => item.name + " × " + item.quantity),
      ...snapshot.services,
      ...snapshot.rows.map((row) => row.label + ": " + row.value),
      c.scheduleNote,
      c.localOnly,
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", body], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "aia-request-brief-" + locale + ".txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }
  const customField = (
    <label>
      {c.customDescription} *
      <textarea
        name="customDescription"
        required
        minLength={10}
        maxLength={2000}
        rows={4}
        value={draft.customDescription}
        aria-invalid={
          (error && draft.customDescription.trim().length < 10) || undefined
        }
        onChange={(e) => patch({ customDescription: e.target.value })}
      />
      <small>
        {locale === "bn"
          ? "অন্তত ১০ অক্ষরে কাজের চাহিদা জানান।"
          : "Describe the requirement in at least 10 characters."}
      </small>
    </label>
  );
  const areas = new Set([
    ...draft.lines.map(
      (line) => products.find((p) => p.slug === line.id)!.category,
    ),
    ...draft.services.flatMap(
      (id) => services.find((s) => s.slug === id)!.areas,
    ),
  ]);
  const optionalProducts = [...products].sort(
    (a, b) => Number(areas.has(b.category)) - Number(areas.has(a.category)),
  );
  const optionalServices = [...services].sort(
    (a, b) =>
      Number(b.areas.some((area) => areas.has(area))) -
      Number(a.areas.some((area) => areas.has(area))),
  );
  return (
    <div className="request-flow">
      <p className="notice" id="request-boundary">
        {c.localOnly}
      </p>
      <form ref={form} onSubmit={submitRequest} onInvalid={() => setError(true)} className="request-form single-page-request">
        <fieldset className="request-group"><legend>{c.details}</legend><div className="request-field-grid">

            <label>
              {c.name} *
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                value={draft.name}
                aria-invalid={(error && !draft.name.trim()) || undefined}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </label>
            <label>
              {c.phone} *
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                maxLength={30}
                value={draft.phone}
                aria-invalid={(error && !validPhone(draft.phone)) || undefined}
                onChange={(e) => patch({ phone: e.target.value })}
              />
            </label>
            <label>
              {c.email}
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                value={draft.email}
                onChange={(e) => patch({ email: e.target.value })}
              />
            </label>
            <label>
              {c.notes}
              <textarea
                name="notes"
                rows={4}
                maxLength={3000}
                value={draft.notes}
                onChange={(e) => patch({ notes: e.target.value })}
              />
            </label>

        </div></fieldset>
        <fieldset className="request-group"><legend>{c.preferences}</legend><div className="request-field-grid">

            <label>
              {c.purpose}
              <select
                name="purpose"
                value={draft.purpose}
                onChange={(e) =>
                  patch({ purpose: e.target.value as RequestDraft["purpose"] })
                }
              >
                {Object.entries(requestPurposes).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label[locale]}
                  </option>
                ))}
              </select>
            </label>
            {needsCustom && customField}
            <label>
              {c.mode}
              <select
                name="mode"
                value={draft.mode}
                onChange={(e) =>
                  patch({ mode: e.target.value as RequestDraft["mode"] })
                }
              >
                {Object.entries(contactModes).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label[locale]}
                  </option>
                ))}
              </select>
            </label>
            {draft.mode === "office" && (
              <p>{company.contact.address?.[locale]}</p>
            )}
            {draft.mode === "onsite" && (
              <label>
                {c.address} *
                <textarea
                  name="address"
                  autoComplete="street-address"
                  required
                  aria-invalid={(error && !draft.address.trim()) || undefined}
                  maxLength={600}
                  value={draft.address}
                  onChange={(e) => patch({ address: e.target.value })}
                />
              </label>
            )}

        </div></fieldset>
        <fieldset className="request-group"><legend>{c.selections}</legend>

            {!draft.lines.length && !draft.services.length && !draft.custom && (
              <p className="selection-empty">{c.noItems}</p>
            )}
            {!!draft.lines.length && (
              <ul className="request-selected">
                {draft.lines.map((line) => (
                  <li key={line.id}>
                    <span>
                      {products.find((p) => p.slug === line.id)!.name[locale]}
                    </span>
                    <label>
                      {c.quantity}
                      <input
                        name={"quantity-" + line.id}
                        type="number"
                        min="1"
                        max="99"
                        required
                        value={line.quantity}
                        onChange={(e) =>
                          patch({
                            lines: validateCart(
                              draft.lines.map((item) =>
                                item.id === line.id
                                  ? {
                                      ...item,
                                      quantity: Math.max(
                                        1,
                                        Math.min(
                                          99,
                                          Math.trunc(
                                            Number(e.target.value) || 1,
                                          ),
                                        ),
                                      ),
                                    }
                                  : item,
                              ),
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() =>
                        patch({
                          lines: draft.lines.filter(
                            (item) => item.id !== line.id,
                          ),
                        })
                      }
                    >
                      {c.remove}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <details className="selection-disclosure">
              <summary>{c.optionalProducts}</summary>
              <div className="selection-options">
                {optionalProducts.map((product) => (
                  <label key={product.slug}>
                    <input
                      type="checkbox"
                      checked={draft.lines.some(
                        (line) => line.id === product.slug,
                      )}
                      onChange={(e) =>
                        patch({
                          lines: e.target.checked
                            ? [
                                ...draft.lines,
                                { id: product.slug, quantity: 1 },
                              ]
                            : draft.lines.filter(
                                (line) => line.id !== product.slug,
                              ),
                        })
                      }
                    />
                    <span>
                      {product.name[locale]}
                      <small>
                        {product.contentKind === "concept"
                          ? d.illustration
                          : ""}
                      </small>
                    </span>
                  </label>
                ))}
              </div>
            </details>
            <fieldset className="selection-options">
              <legend>{c.optionalServices}</legend>
              {optionalServices.map((service) => (
                <label key={service.slug}>
                  <input
                    type="checkbox"
                    checked={draft.services.includes(service.slug)}
                    onChange={(e) =>
                      patch({
                        services: e.target.checked
                          ? [...draft.services, service.slug]
                          : draft.services.filter((id) => id !== service.slug),
                      })
                    }
                  />
                  <span>{service.name[locale]}</span>
                </label>
              ))}
              <label>
                <input
                  name="customService"
                  type="checkbox"
                  checked={draft.custom}
                  onChange={(e) => patch({ custom: e.target.checked })}
                />
                <span>{c.others}</span>
              </label>
            </fieldset>

        </fieldset>
        <fieldset className="request-group"><legend>{c.schedule}</legend>
          {draft.mode === "contact" ? <p>{c.noSchedule}</p> : <>
            <p>{c.scheduleNote}</p>
            <div className="request-field-grid">
              <label>{c.date} *<input name="date" type="date" required min={dhakaToday()} value={draft.date}
                aria-invalid={(error && !validPreferredDate(draft.date)) || undefined} onChange={(e) => patch({date: e.target.value})} /></label>
              <label>{c.time}<select name="time" value={draft.time} onChange={(e) => patch({time: e.target.value as RequestDraft["time"]})}>
                {Object.entries(timeWindows).map(([id,label]) => <option key={id} value={id}>{label[locale]}</option>)}
              </select></label>
              <label>{c.alternative}<input name="alternative" maxLength={300} value={draft.alternative} onChange={(e) => patch({alternative: e.target.value})} /></label>
            </div>
          </>}
        </fieldset>
        <div className="request-download-actions">
<p id="pdf-instructions">{c.pdfNote}</p>
            <button
              type="button"
              className="button button-outline"
              onClick={printPdf}
              aria-describedby="pdf-instructions"
            >
              {c.printPdf}
            </button>
            <button
              type="submit"
              className="button button-gold"
              aria-describedby="request-boundary"
            >
              {locale === "bn" ? "অনুরোধ জমা দিন" : "Submit Request"}
            </button>
            <p>
              <button
                type="button"
                className="text-link"
                onClick={downloadText}
              >
                {c.download}
              </button>
            </p>
            {downloaded && <p role="status">{c.downloaded}</p>}
            <p>
              <a className="text-link" href={"tel:" + company.contact.phone}>
                {company.contact.phone}
              </a>{" "}
              ·{" "}
              <a className="text-link" href={"mailto:" + company.contact.email}>
                {company.contact.email}
              </a>
            </p>
            <Link className="text-link" href={href(locale, "privacy")}>
              {c.privacy}
            </Link>

        </div>
        {submissionNotice && <p role="alert" className="notice" data-submission-unavailable>
          {locale === "bn" ? "অনলাইনে জমা দেওয়া এখনো চালু হয়নি। আপনার অনুরোধ পাঠানো হয়নি। PDF সংরক্ষণ করে AIA-এর সঙ্গে যোগাযোগ করুন।" : "Online submission is not connected yet. Your request has not been sent. Save the PDF and contact AIA directly."}
        </p>}
        {error && <p role="alert" className="form-error">{c.validation}</p>}
      </form>
      {documentData && <RequestDocument data={documentData} />}
    </div>
  );
}
