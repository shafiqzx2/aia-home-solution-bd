"use client";
import { useSyncExternalStore } from "react";
import { themeInitialization } from "@/lib/theme";
const subscribe = () => () => {};
// Initial HTML executes this before paint. Hydration matches that HTML, then
// removes the consumed script. Client-side locale navigation must not recreate it.
export function ThemeInitialization() {
  const initialHtml = useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  );
  return initialHtml ? (
    <script
      id="aia-theme-initialization"
      dangerouslySetInnerHTML={{ __html: themeInitialization }}
    />
  ) : null;
}
