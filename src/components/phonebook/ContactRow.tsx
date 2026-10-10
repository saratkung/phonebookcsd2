"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Phone, Copy, Star, Lock, Building2 } from "lucide-react";
import clsx from "clsx";
import { useToast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import type { Contact } from "@/lib/supabase/types";

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function ContactRow({
  contact,
  departmentName,
  isFavorite,
  onToggleFavorite,
  canFavorite = true,
}: {
  contact: Contact;
  departmentName: string | null;
  isFavorite: boolean;
  onToggleFavorite?: (contactId: string, next: boolean) => void;
  canFavorite?: boolean;
}) {
  const { show } = useToast();
  const [favorite, setFavorite] = useState(isFavorite);
  const [pending, startTransition] = useTransition();

  const fullName = [contact.prefix, contact.first_name, contact.last_name].filter(Boolean).join(" ");

  function copy(value: string, label: string) {
    navigator.clipboard
      .writeText(value)
      .then(() => show("success", `คัดลอก${label}แล้ว`))
      .catch(() => show("error", "คัดลอกไม่สำเร็จ"));
  }

  function handleToggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    onToggleFavorite?.(contact.id, next);
    startTransition(async () => {
      const result = await toggleFavoriteAction(contact.id);
      if (!result.success) {
        setFavorite(!next);
        show("error", result.error ?? "ดำเนินการไม่สำเร็จ");
      }
    });
  }

  return (
    <div
      className={clsx(
        "flex items-start gap-3 border-b border-border px-4 py-3.5 last:border-b-0",
        !contact.is_active && "opacity-60"
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-bg text-sm font-semibold text-white">
        {contact.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={contact.photo_url} alt="" className="size-full object-cover" />
        ) : (
          initials(contact.first_name, contact.last_name)
        )}
      </div>

      <div className="min-w-0 flex-1">
        <Link href={`/contacts/${contact.id}`} className="block">
          <p className="truncate font-medium text-foreground hover:text-accent">
            {fullName}
            {contact.nickname && <span className="ml-1.5 text-muted-foreground">({contact.nickname})</span>}
          </p>
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          {[contact.rank, contact.position].filter(Boolean).join(" · ") || "—"}
        </p>
        {departmentName && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Building2 className="size-3" aria-hidden /> {departmentName}
          </p>
        )}
        {!contact.is_active && (
          <Badge tone="warning" className="mt-1">
            ปิดใช้งาน
          </Badge>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {contact.mobile_phone ? (
            <PhoneChip number={contact.mobile_phone} label="เบอร์มือถือ" onCopy={copy} />
          ) : contact.mobile_visibility === "private" ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="size-3" /> เบอร์มือถือถูกจำกัดการแสดงผล
            </span>
          ) : null}
          {contact.office_phone && <PhoneChip number={contact.office_phone} label="เบอร์สำนักงาน" onCopy={copy} />}
          {contact.extension && (
            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs text-foreground">
              ภายใน {contact.extension}
            </span>
          )}
        </div>
      </div>

      {canFavorite && (
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={pending}
          aria-pressed={favorite}
          aria-label={favorite ? "เอาออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-surface-muted disabled:opacity-50"
        >
          <Star className={clsx("size-5", favorite && "fill-accent text-accent")} aria-hidden />
        </button>
      )}
    </div>
  );
}

function PhoneChip({ number, label, onCopy }: { number: string; label: string; onCopy: (v: string, l: string) => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-surface-muted pl-2.5 pr-1 py-1 text-xs text-foreground">
      <a href={`tel:${number}`} className="flex items-center gap-1 hover:text-accent" aria-label={`โทร ${label} ${number}`}>
        <Phone className="size-3" aria-hidden /> {number}
      </a>
      <button
        type="button"
        onClick={() => onCopy(number, label)}
        aria-label={`คัดลอก${label}`}
        className="rounded p-1 hover:bg-white"
      >
        <Copy className="size-3" aria-hidden />
      </button>
    </span>
  );
}
