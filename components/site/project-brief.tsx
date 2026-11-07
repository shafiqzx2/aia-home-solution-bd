"use client";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { dictionaries, type Locale } from "@/lib/i18n";
import { flattenCategories } from "@/lib/category-tree";
import {
  categories,
  company,
  productConcepts,
  publicServices,
} from "@/lib/public-content";

const allCategories = flattenCategories(categories);

export function ProjectBrief({ locale = "en" }: { locale?: Locale }) {
  const d = dictionaries[locale],
    params = useSearchParams();
  const requested = params.get("solution");
  const requestedItem = [...productConcepts, ...publicServices].find(
    (item) => item.slug === requested && item.status === "published",
  );
  const initialCategory =
    requestedItem &&
    ("category" in requestedItem
      ? requestedItem.category
      : requestedItem.areas[0]);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  function download(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = form.elements.namedItem("message") as HTMLTextAreaElement;
    message.setCustomValidity(
      message.value.trim().length < 10 ? d.validation : "",
    );
    if (!form.reportValidity()) {
      setFailed(true);
      setStatus(d.validation);
      return;
    }
    try {
      const values = new FormData(form);
      const labels: Record<string, string> = {
        name: d.name,
        email: d.email,
        phone: d.phone,
        project: d.projectType,
        category: d.solution,
        location: d.projectLocation,
        message: d.message,
      };
      const lines = Array.from(
        values.entries(),
        ([key, value]) =>
          `${labels[key] || key}: ${String(value).trim() || d.notProvided}`,
      );
      const file = `${company.name}\n${d.formTitle}\n\n${requestedItem ? requestedItem.name[locale] + "\n\n" : ""}${lines.join("\n\n")}\n\n${d.downloadReady}\n`;
      const url = URL.createObjectURL(
        new Blob(["\uFEFF", file], { type: "text/plain;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `aia-project-brief-${locale}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setFailed(false);
      setStatus(d.downloadReady);
    } catch {
      setFailed(true);
      setStatus(d.downloadFailed);
    }
  }
  return (
    <form
      className="quotation-form"
      onSubmit={download}
      noValidate
      aria-labelledby="brief-title"
    >
      <h2 id="brief-title">{d.formTitle}</h2>
      {requestedItem && (
        <p className="selected-solution">{requestedItem.name[locale]}</p>
      )}
      <p className="notice" id="form-availability">
        {d.formNotice}
      </p>
      <div className="form-grid">
        <label className="field">
          <span>{d.name} *</span>
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={120}
            onChange={(e) =>
              e.currentTarget.setCustomValidity(
                e.currentTarget.value.trim() ? "" : d.validation,
              )
            }
          />
        </label>
        <label className="field">
          <span>{d.email} *</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <label className="field">
          <span>{d.phone}</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
        </label>
        <label className="field">
          <span>{d.projectType}</span>
          <select name="project" defaultValue={d.residential}>
            {[d.residential, d.commercial, d.hospitality, d.other].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </select>
        </label>
        <label className="field full">
          <span>{d.solution} *</span>
          <select
            key={initialCategory || "none"}
            name="category"
            required
            defaultValue={
              initialCategory
                ? allCategories.find((c) => c.id === initialCategory)?.name[
                    locale
                  ]
                : ""
            }
          >
            <option value="">{d.choose}</option>
            {allCategories.map((category) => (
              <option key={category.id} value={category.name[locale]}>
                {category.name[locale]}
              </option>
            ))}
          </select>
        </label>
        <label className="field full">
          <span>{d.projectLocation}</span>
          <input
            name="location"
            autoComplete="address-level2"
            maxLength={180}
          />
        </label>
        <label className="field full">
          <span>{d.message} *</span>
          <textarea
            name="message"
            rows={5}
            minLength={10}
            maxLength={5000}
            required
            aria-describedby="message-hint"
            onChange={(e) => e.currentTarget.setCustomValidity("")}
          />
          <small id="message-hint">{d.messageHint}</small>
        </label>
      </div>
      <div className="form-actions">
        <button type="submit" className="button button-gold">
          {d.download}
        </button>
        <button
          type="button"
          className="button button-outline"
          disabled
          aria-describedby="form-availability"
        >
          {d.submitUnavailable}
        </button>
      </div>
      <p className="content-note">{d.privacy}</p>
      <p
        className={failed ? "form-status form-failed" : "form-status"}
        role="status"
        aria-live="polite"
      >
        {status}
      </p>
    </form>
  );
}
