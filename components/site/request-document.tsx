"use client";
import { createPortal } from "react-dom";
import { useLayoutEffect, useState } from "react";
import Image from "next/image";
import { company } from "@/lib/public-content";
import type { Locale } from "@/lib/i18n";
import { requestCopy } from "@/lib/request-copy";
export type RequestDocumentData = {
  locale: Locale;
  products: { name: string; quantity: number }[];
  services: string[];
  rows: { label: string; value: string }[];
  generatedAt: string;
};
export function RequestDocument({ data }: { data: RequestDocumentData }) {
  const [container] = useState(() => {
    if (typeof document === "undefined") return null;
    const node = document.createElement("div");
    node.id = "aia-print-root";
    node.className = "print-request";
    node.lang = data.locale;
    return node;
  });
  useLayoutEffect(() => {
    if (!container) return;
    document.body.appendChild(container);
    // Activity-cached routes must not leave their old document in the print tree.
    return () => container.remove();
  }, [container, data.locale]);
  if (!container) return null;
  const c = requestCopy(data.locale),
    logo = company.logos.header.light;
  return createPortal(
    <article>
      <header>
        <div>
          <h1>{company.name}</h1>
          <p>{company.contact.address?.[data.locale]}</p>
          <p>
            {company.contact.phone} · {company.contact.email}
          </p>
        </div>
        {/* The approved logo slot is shared with the public header. */}
        {logo && (
          <Image
            src={logo.src}
            alt={company.name}
            width={logo.width}
            height={logo.height}
            unoptimized
            style={{ width: 112, height: "auto" }}
          />
        )}
      </header>
      <h2>{c.documentTitle}</h2>
      <p>
        {c.generated}:{" "}
        {new Intl.DateTimeFormat(data.locale, {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "Asia/Dhaka",
        }).format(new Date(data.generatedAt))}{" "}
        · Asia/Dhaka
      </p>
      <p className="print-status">{c.draft}</p>
      <h3>{c.selections}</h3>
      {!data.products.length && !data.services.length && <p>{c.noItems}</p>}
      {!!data.products.length && (
        <table>
          <thead>
            <tr>
              <th>{data.locale === "bn" ? "পণ্য" : "Product"}</th>
              <th>{c.quantity}</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>
                  {new Intl.NumberFormat(data.locale).format(item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!!data.services.length && (
        <ul>
          {data.services.map((service) => (
            <li key={service}>{service}</li>
          ))}
        </ul>
      )}
      <h3>{c.details}</h3>
      <table>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer>
        <p>{c.scheduleNote}</p>
        <p>
          {data.locale === "bn"
            ? "এটি মূল্যবিহীন অনুরোধের নথি। প্রিন্ট বা PDF সংরক্ষণ করলে নথি AIA-কে পাঠানো হয় না। কাজের পরিধি, প্রাপ্যতা ও সময় সরাসরি নিশ্চিত করতে হবে।"
            : "This is an unpriced request document. Printing or saving a PDF does not send it to AIA. Scope, availability, and appointments require direct confirmation."}
        </p>
      </footer>
    </article>,
    container,
  );
}
