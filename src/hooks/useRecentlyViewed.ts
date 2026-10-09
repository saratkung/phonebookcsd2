"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "phonebook:recently_viewed";
const MAX_ITEMS = 8;

export interface RecentlyViewedEntry {
  id: string;
  name: string;
  position: string | null;
  viewedAt: number;
}

function readStore(): RecentlyViewedEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedEntry[]>([]);

  useEffect(() => {
    // localStorage is only available client-side; reading it in the
    // initial useState() would desync server/client render output, so this
    // one-time sync-on-mount is intentional rather than a derived value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readStore());
  }, []);

  const addRecentlyViewed = useCallback((entry: Omit<RecentlyViewedEntry, "viewedAt">) => {
    try {
      const current = readStore().filter((i) => i.id !== entry.id);
      const next = [{ ...entry, viewedAt: Date.now() }, ...current].slice(0, MAX_ITEMS);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next);
    } catch {
      // localStorage unavailable (private browsing, etc.) — feature degrades silently.
    }
  }, []);

  return { items, addRecentlyViewed };
}
