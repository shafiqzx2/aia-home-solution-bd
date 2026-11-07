"use client";
import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Catch-all pages share one route component, so Next's visibility heuristic can
// retain the previous page's scroll. Wait for the destination's DOM to commit.
export function NavigationScroll() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const historyNavigation = useRef(false);
  useLayoutEffect(() => {
    const pop = () => {
      historyNavigation.current = true;
    };
    window.addEventListener("popstate", pop);
    return () => window.removeEventListener("popstate", pop);
  }, []);
  useLayoutEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    if (historyNavigation.current) {
      historyNavigation.current = false;
      return;
    }
    let frame = 0;
    const settle = () => {
      const main = document.querySelector<HTMLElement>("main[data-page-path]");
      if (main?.dataset.pagePath !== pathname.replace(/\/$/, "")) return false;
      frame = requestAnimationFrame(() => {
        if (window.location.hash) {
          let id: string;
          try {
            id = decodeURIComponent(window.location.hash.slice(1));
          } catch {
            return;
          }
          document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
        } else window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      });
      return true;
    };
    if (settle()) return () => cancelAnimationFrame(frame);
    const observer = new MutationObserver(() => {
      if (settle()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return null;
}
