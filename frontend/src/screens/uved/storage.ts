import { useEffect, useState } from "react";
import type { UvedRouteSheetSlim } from "./types";

const KEY = "smartml.uved.routeSheets";
const CAP = 50;

function load(): UvedRouteSheetSlim[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as UvedRouteSheetSlim[];
  } catch {
    return [];
  }
}

function save(items: UvedRouteSheetSlim[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage full / disabled — ignore
  }
}

export function useUvedRouteSheets() {
  const [items, setItems] = useState<UvedRouteSheetSlim[]>(load);

  useEffect(() => {
    save(items);
  }, [items]);

  function add(item: UvedRouteSheetSlim) {
    setItems((prev) => {
      const filtered = prev.filter((x) => x.lookupCode !== item.lookupCode);
      return [item, ...filtered].slice(0, CAP);
    });
  }

  function patch(code: string, patchObj: Partial<UvedRouteSheetSlim>) {
    setItems((prev) =>
      prev.map((x) => (x.lookupCode === code ? { ...x, ...patchObj } : x))
    );
  }

  function remove(code: string) {
    setItems((prev) => prev.filter((x) => x.lookupCode !== code));
  }

  function has(code: string): boolean {
    return items.some((x) => x.lookupCode === code);
  }

  return { items, add, patch, remove, has };
}
