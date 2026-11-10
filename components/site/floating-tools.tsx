"use client";
import {usePublished,useSiteCopy} from "./published-provider";
import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { href, isLocale } from "@/lib/i18n";

import { themeStorageKey } from "@/lib/theme";
import { whatsappUrl } from "@/lib/whatsapp";
import { Icon } from "@/components/ui/icon";

function applyPreference() {
  let preference: string | null = null;
  try {
    preference = localStorage.getItem(themeStorageKey);
  } catch {}
  const theme =
    preference === "dark" || preference === "light"
      ? preference
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
function subscribeTheme(notify: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const changed = () => {
    applyPreference();
    notify();
  };
  const storage = (event: StorageEvent) => {
    if (event.key === themeStorageKey || event.key === null) changed();
  };
  window.addEventListener("aia-theme-change", notify);
  window.addEventListener("storage", storage);
  media.addEventListener("change", changed);
  return () => {
    window.removeEventListener("aia-theme-change", notify);
    window.removeEventListener("storage", storage);
    media.removeEventListener("change", changed);
  };
}
function themeSnapshot() {
  return document.documentElement.dataset.theme || "system";
}
function serverTheme() {
  return "system";
}
export function FloatingTools() {
  const params = useParams();
  const locale =
    typeof params.lang === "string" && isLocale(params.lang)
      ? params.lang
      : "en";
  const {company}=usePublished();
  const d = useSiteCopy(locale);
  const theme = useSyncExternalStore(
    subscribeTheme,
    themeSnapshot,
    serverTheme,
  );
  const [contactOpen, setContactOpen] = useState(false);
  const contactTrigger = useRef<HTMLButtonElement>(null);
  function closeContact() {
    setContactOpen(false);
    contactTrigger.current?.focus();
  }
  const chat = whatsappUrl(
    company.contact.whatsapp,
    company.contact.whatsappMessage[locale],
  );
  function toggleTheme() {
    const selected = themeSnapshot() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = selected;
    document.documentElement.style.colorScheme = selected;
    try {
      localStorage.setItem(themeStorageKey, selected);
    } catch {}
    window.dispatchEvent(new Event("aia-theme-change"));
  }
  const whatsappIcon = (
    <>
      <span className="whatsapp-rays" aria-hidden="true" />
      <span className="whatsapp-center">
        <Icon name="whatsapp" />
      </span>
    </>
  );
  return (
    <aside
      className="floating-tools"
      aria-label={d.quickActions}
      onKeyDown={(event) => {
        if (event.key === "Escape" && contactOpen) {
          closeContact();
          event.stopPropagation();
        }
      }}
    >
      <span className="quick-tools-label">{d.quickActions}</span>
      <button
        type="button"
        className="theme-toggle floating-button"
        onClick={toggleTheme}
        aria-label={theme === "light" ? d.switchDark : d.switchLight}
        title={theme === "light" ? d.switchDark : d.switchLight}
      >
        <Icon name={theme === "light" ? "moon" : "sun"} />
      </button>
      {chat ? (
        <a
          className="whatsapp-button floating-button"
          href={chat}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={d.whatsappChat}
          title={d.whatsappChat}
        >
          {whatsappIcon}
        </a>
      ) : (
        <button
          ref={contactTrigger}
          type="button"
          className="whatsapp-button floating-button"
          aria-label={d.whatsappInfo}
          aria-expanded={contactOpen}
          aria-controls="whatsapp-availability"
          onClick={() => setContactOpen(!contactOpen)}
        >
          {whatsappIcon}
        </button>
      )}
      {!chat && (
        <div
          className="whatsapp-notice"
          id="whatsapp-availability"
          hidden={!contactOpen}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeContact();
              event.stopPropagation();
            }
          }}
        >
          <button
            type="button"
            className="icon-button"
            aria-label={d.closeMenu}
            onClick={closeContact}
          >
            <Icon name="close" />
          </button>
          <p>{d.whatsappPending}</p>
          <Link
            className="text-link"
            href={href(locale, "contact")}
            onClick={() => setContactOpen(false)}
          >
            {d.contact}
          </Link>
        </div>
      )}
    </aside>
  );
}
