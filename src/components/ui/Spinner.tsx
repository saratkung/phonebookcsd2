import { Loader2 } from "lucide-react";
import clsx from "clsx";

export function Spinner({ className, label = "กำลังโหลด..." }: { className?: string; label?: string }) {
  return (
    <div className={clsx("flex items-center justify-center gap-2 py-10 text-muted-foreground", className)} role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}
