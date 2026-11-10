"use client";
import { useSyncExternalStore } from "react";


export type CartLine = { id: string; quantity: number };
export const CART_KEY = "aia-consultation-cart-v1";
export function validateCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const quantities = new Map<string, number>();
  for (const item of value.slice(0, 100)) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.id !== "string" ||
      !/^[a-z0-9][a-z0-9-]{0,100}$/.test(item.id) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    )
      continue;
    quantities.set(
      item.id,
      Math.min(99, (quantities.get(item.id) || 0) + item.quantity),
    );
  }
  return [...quantities].map(([id, quantity]) => ({ id, quantity }));
}
const empty: CartLine[] = [];
let lines = empty;
let loaded = false;
let storageAvailable = true;
const listeners = new Set<() => void>();
function read() {
  try {
    lines = validateCart(JSON.parse(localStorage.getItem(CART_KEY) || "[]"));
  } catch {
    lines = [];
  }
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}
function emit() {
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!loaded) {
    loaded = true;
    read();
    emit();
  }
  function storage(event: StorageEvent) {
    if (event.key === CART_KEY || event.key === null) {
      read();
      emit();
    }
  }
  window.addEventListener("storage", storage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", storage);
  };
}
function write(value: CartLine[]) {
  lines = validateCart(value);
  loaded = true;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  emit();
}
export function addToCart(id: string, quantity: number) {
  if (!loaded) read();
  write([...lines, { id, quantity }]);
}
export function setCartQuantity(id: string, quantity: number) {
  write(
    lines
      .map((line) => (line.id === id ? { id, quantity } : line))
      .filter((line) => line.quantity > 0),
  );
}
export const clearCart = () => write([]);
export function useCart() {
  const items = useSyncExternalStore(
    subscribe,
    () => lines,
    () => empty,
  );
  return {
    items,
    count: items.reduce((total, line) => total + line.quantity, 0),
    storageAvailable,
  };
}
