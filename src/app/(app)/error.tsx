"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="size-7 text-danger" aria-hidden />
      </div>
      <div>
        <p className="font-medium text-foreground">เกิดข้อผิดพลาดบางอย่าง</p>
        <p className="mt-1 text-sm text-muted-foreground">กรุณาลองใหม่อีกครั้ง หากยังพบปัญหากรุณาติดต่อผู้ดูแลระบบ</p>
      </div>
      <Button onClick={reset}>ลองใหม่อีกครั้ง</Button>
    </div>
  );
}
