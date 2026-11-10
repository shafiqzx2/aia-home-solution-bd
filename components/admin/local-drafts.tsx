"use client";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";

// In-memory only. Survives module navigation, never reloads, and never writes
// customer details to localStorage, a server, or an external provider.
const DraftContext = createContext<
  | [Record<string, unknown>, Dispatch<SetStateAction<Record<string, unknown>>>]
  | null
>(null);
export function LocalDraftProvider({ children }: { children: ReactNode }) {
  const state = useState<Record<string, unknown>>({});
  return (
    <DraftContext.Provider value={state}>{children}</DraftContext.Provider>
  );
}
export function useLocalDraft<T>(
  key: string,
  initial: T | (() => T),
): [T, Dispatch<SetStateAction<T>>] {
  const context = useContext(DraftContext);
  const [fallback] = useState(initial);
  if (!context)
    throw Error("Local draft tools require their development workspace.");
  const [values, setValues] = context;
  const value = Object.hasOwn(values, key) ? (values[key] as T) : fallback;
  const set: Dispatch<SetStateAction<T>> = (next) =>
    setValues((previous) => {
      const current = Object.hasOwn(previous, key)
        ? (previous[key] as T)
        : fallback;
      return {
        ...previous,
        [key]:
          typeof next === "function" ? (next as (v: T) => T)(current) : next,
      };
    });
  return [value, set];
}
