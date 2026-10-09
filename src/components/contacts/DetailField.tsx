"use client";

import { Copy, Phone, Mail } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function DetailField({
  label,
  value,
  type = "text",
}: {
  label: string;
  value: string | null;
  type?: "text" | "phone" | "email";
}) {
  const { show } = useToast();

  if (!value) return null;

  function copy() {
    navigator.clipboard
      .writeText(value!)
      .then(() => show("success", `คัดลอก${label}แล้ว`))
      .catch(() => show("error", "คัดลอกไม่สำเร็จ"));
  }

  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {type === "phone" ? (
          <a href={`tel:${value}`} className="break-all text-sm font-medium text-foreground hover:text-accent">
            {value}
          </a>
        ) : type === "email" ? (
          <a href={`mailto:${value}`} className="break-all text-sm font-medium text-foreground hover:text-accent">
            {value}
          </a>
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm font-medium text-foreground">{value}</p>
        )}
      </div>
      {(type === "phone" || type === "email") && (
        <div className="flex shrink-0 items-center gap-1">
          {type === "phone" && (
            <a
              href={`tel:${value}`}
              aria-label={`โทร ${label}`}
              className="rounded-full p-2 text-muted-foreground hover:bg-surface-muted hover:text-accent"
            >
              <Phone className="size-4" />
            </a>
          )}
          {type === "email" && (
            <a
              href={`mailto:${value}`}
              aria-label={`ส่งอีเมลถึง ${label}`}
              className="rounded-full p-2 text-muted-foreground hover:bg-surface-muted hover:text-accent"
            >
              <Mail className="size-4" />
            </a>
          )}
          <button
            type="button"
            onClick={copy}
            aria-label={`คัดลอก${label}`}
            className="rounded-full p-2 text-muted-foreground hover:bg-surface-muted hover:text-accent"
          >
            <Copy className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
