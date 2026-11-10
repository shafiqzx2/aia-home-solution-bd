"use client";
import {usePublished,useSiteCopy} from "./published-provider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { navigation } from "@/lib/public-content";
import { href, type Locale } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";
import { Brand } from "./brand";
import { MobileNavigation } from "./mobile-navigation";
import { CartLink } from "./product-actions";
import { requestCopy } from "@/lib/request-copy";
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const other = locale === "en" ? "bn" : "en";
  const equivalent = pathname.replace(/^\/(en|bn)(?=\/|$)/, "");
  return (
    <Link
      className="language-switch"
      href={href(other, equivalent)}
      hrefLang={other}
      lang={other}
      aria-label={other === "bn" ? "বাংলায় দেখুন" : "View in English"}
      onClick={(event) => {
        const destination =
          href(other, equivalent) +
          window.location.search +
          window.location.hash;
        event.currentTarget.href = destination;
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        window.dispatchEvent(
          new CustomEvent("aia:request-language-switch", {
            detail: { locale: other },
          }),
        );
        router.push(destination);
      }}
    >
      {other === "bn" ? "বাংলা" : "English"}
    </Link>
  );
}
export function Header({ locale = "en" }: { locale?: Locale }) {
  const {company}=usePublished();
  const d = useSiteCopy(locale),
    pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => dialog.current?.close();
  const links = navigation.map((key) => {
    const url = href(locale, key === "home" ? "" : key);
    const active =
      key === "home"
        ? pathname === url
        : pathname === url || pathname.startsWith(`${url}/`);
    return (
      <Link
        href={url}
        key={key}
        aria-current={active ? "page" : undefined}
        onClick={close}
      >
        {d[key]}
      </Link>
    );
  });
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand locale={locale} />
        <nav className="desktop-nav" aria-label={d.mainNav}>
          {links}
        </nav>
        <div className="header-actions">
          <CartLink locale={locale} />
          <LanguageSwitcher locale={locale} />
          <Link
            className="header-login"
            href={href(locale, "login")}
            aria-label={d.login}
          >
            <Icon name="user" />
            <span>{d.login}</span>
          </Link>
          <Link
            className="header-contact"
            href={`${href(locale, "request")}?entry=direct&type=consultation`}
          >
            {requestCopy(locale).consultation}
          </Link>
          <button
            ref={trigger}
            className="icon-button menu-trigger"
            type="button"
            aria-label={d.openMenu}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => {
              dialog.current?.showModal();
              setOpen(true);
            }}
          >
            <Icon name="menu" />
          </button>
        </div>
        <dialog
          id="mobile-navigation"
          ref={dialog}
          className="mobile-menu"
          aria-labelledby="menu-title"
          onClose={() => {
            setOpen(false);
            trigger.current?.focus({ preventScroll: true });
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const controls = event.currentTarget.querySelectorAll<HTMLElement>(
              "a[href], button:not(:disabled)",
            );
            const first = controls[0],
              last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }}
        >
          <div className="mobile-menu-inner">
            <div className="menu-top">
              <p id="menu-title">{company.name}</p>
              <button
                type="button"
                className="icon-button"
                aria-label={d.closeMenu}
                onClick={close}
              >
                <Icon name="close" />
              </button>
            </div>
            {open && <MobileNavigation locale={locale} close={close} />}
            <Link
              className="button button-gold"
              href={`${href(locale, "request")}?entry=direct&type=consultation`}
              onClick={close}
            >
              {requestCopy(locale).consultation}
            </Link>
          </div>
        </dialog>
      </div>
    </header>
  );
}
