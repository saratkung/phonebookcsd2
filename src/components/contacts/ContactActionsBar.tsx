"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Star, Pencil, EyeOff, Eye } from "lucide-react";
import clsx from "clsx";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { setContactActiveState } from "@/lib/actions/contacts";

export function ContactActionsBar({
  contactId,
  fullName,
  isFavorite,
  isActive,
  canEdit,
  canFavorite = true,
}: {
  contactId: string;
  fullName: string;
  isFavorite: boolean;
  isActive: boolean;
  canEdit: boolean;
  canFavorite?: boolean;
}) {
  const router = useRouter();
  const { show } = useToast();
  const [favorite, setFavorite] = useState(isFavorite);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleToggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await toggleFavoriteAction(contactId);
      if (!result.success) {
        setFavorite(!next);
        show("error", result.error ?? "ดำเนินการไม่สำเร็จ");
      }
    });
  }

  function handleToggleActive() {
    startTransition(async () => {
      const result = await setContactActiveState(contactId, !isActive);
      setConfirmOpen(false);
      if (result.success) {
        show("success", isActive ? `ปิดใช้งาน "${fullName}" แล้ว` : `เปิดใช้งาน "${fullName}" แล้ว`);
        router.refresh();
      } else {
        show("error", result.error ?? "ดำเนินการไม่สำเร็จ");
      }
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> ย้อนกลับ
        </button>

        <div className="flex items-center gap-2">
          {canFavorite && (
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-pressed={favorite}
              aria-label={favorite ? "เอาออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
              className="rounded-full p-2 text-muted-foreground hover:bg-surface-muted"
            >
              <Star className={clsx("size-5", favorite && "fill-accent text-accent")} aria-hidden />
            </button>
          )}

          {canEdit && (
            <>
              <Link href={`/contacts/${contactId}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="size-4" /> แก้ไข
                </Button>
              </Link>
              <Button variant={isActive ? "danger" : "primary"} size="sm" onClick={() => setConfirmOpen(true)}>
                {isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={isActive ? `ปิดใช้งานรายชื่อ "${fullName}"?` : `เปิดใช้งานรายชื่อ "${fullName}" อีกครั้ง?`}
        description={
          isActive
            ? "รายชื่อนี้จะไม่แสดงผลในสมุดโทรศัพท์สำหรับผู้ใช้งานทั่วไป ประวัติข้อมูลจะไม่ถูกลบและสามารถเปิดใช้งานใหม่ได้ภายหลัง"
            : "รายชื่อนี้จะกลับมาแสดงผลในสมุดโทรศัพท์ตามปกติ"
        }
        confirmLabel={isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
        danger={isActive}
        loading={pending}
        onConfirm={handleToggleActive}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
