"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { Icon, type IconName } from "@/components/ui/icon";

export function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`a-button ${secondary ? "a-button-secondary" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`a-field ${wide ? "a-wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function useDialogFocus(open: boolean) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current
      ?.querySelector<HTMLElement>("input,textarea,select,button")
      ?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);
  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "Tab") return;
    const nodes = Array.from(
      ref.current?.querySelectorAll<HTMLElement>(
        "button,input,textarea,select,a[href]",
      ) || [],
    ).filter((el) => el.offsetParent && !el.hasAttribute("disabled"));
    const first = nodes[0],
      last = nodes.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  return { ref, onKeyDown };
}

export function Empty({
  icon = "layers",
  title,
  children,
  action,
}: {
  icon?: IconName;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="a-empty">
      <span className="a-empty-icon">
        <Icon name={icon} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function getFontCss() {
  const rules: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSFontFaceRule)
          rules.push(
            rule.cssText.replace(
              /url\(["']?([^)'" ]+)["']?\)/g,
              (_, url) =>
                `url("${new URL(url, sheet.href || location.href).href}")`,
            ),
          );
      }
    } catch {
      /* External stylesheets are not read. */
    }
  }
  return rules.join("\n");
}

export function download(
  name: string,
  text: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DocumentPreview({
  html,
  label,
  presentation='review',
}: {
  html: string;
  label: string;
  presentation?: 'review'|'draft'|'issued';
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setScale(Math.min(1, entries[0].contentRect.width / 794)),
    );
    if (holder.current) observer.observe(holder.current);
    return () => observer.disconnect();
  }, []);
  return (
    <section className="a-preview">
      <header>
        <div>
          <span className="a-overline">DOCUMENT PREVIEW</span>
          <h3>{label}</h3>
        </div>
        <Button secondary onClick={() => frame.current?.contentWindow?.print()}>
          <Icon name="download" /> Print / Save PDF
        </Button>
      </header>
      <div className="a-paper-frame">
        <div ref={holder} style={{ height: 1123 * scale, overflow: "hidden" }}>
          <iframe
            ref={frame}
            title={label}
            srcDoc={html}
            sandbox="allow-same-origin allow-modals"
            style={{
              width: 794,
              height: 1123,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>
      <p className="a-caption">
        {presentation==='issued'?'White A4 · Persisted issued snapshot · Print or save as PDF.':presentation==='draft'?'White A4 · Unapproved draft · Print or save as PDF.':'White A4 · Local draft or DEMO specimen · Print or save as PDF.'}
      </p>
    </section>
  );
}
