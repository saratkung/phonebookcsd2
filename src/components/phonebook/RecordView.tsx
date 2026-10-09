"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export function RecordView({ id, name, position }: { id: string; name: string; position: string | null }) {
  const { addRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    addRecentlyViewed({ id, name, position });
    // Only record once per mount of this contact's detail page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return null;
}
