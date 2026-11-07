"use client";
import { useId, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { useMediaQuery } from "./use-media-query";

export function FooterLinks({ title, label, children }: {
  title: string;
  label: string;
  children: ReactNode;
}) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="footer-link-group">
      <h2>{title}</h2>
      <button type="button" className="footer-link-toggle" aria-expanded={open}
        aria-controls={id} onClick={() => setOpen(!open)}>
        {title}<Icon name={open ? "close" : "plus"} />
      </button>
      <nav id={id} aria-label={label} hidden={!desktop && !open}>{children}</nav>
    </div>
  );
}
