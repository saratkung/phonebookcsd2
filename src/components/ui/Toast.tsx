"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";
import clsx from "clsx";

type ToastKind = "success" | "error" | "warning";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  show: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-20 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={clsx(
              "flex items-start gap-2 rounded-lg border px-4 py-3 shadow-lg text-sm",
              t.kind === "success" && "bg-white border-success/30 text-success",
              t.kind === "error" && "bg-white border-danger/30 text-danger",
              t.kind === "warning" && "bg-white border-warning/30 text-warning"
            )}
          >
            {t.kind === "success" && <CheckCircle2 className="size-5 shrink-0" aria-hidden />}
            {t.kind === "error" && <XCircle className="size-5 shrink-0" aria-hidden />}
            {t.kind === "warning" && <AlertTriangle className="size-5 shrink-0" aria-hidden />}
            <span className="flex-1 text-foreground">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="ปิดการแจ้งเตือน" className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast ต้องถูกใช้ภายใน ToastProvider");
  return ctx;
}
