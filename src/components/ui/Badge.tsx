import clsx from "clsx";

type Tone = "neutral" | "success" | "danger" | "warning" | "accent";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-muted text-foreground",
  success: "bg-green-100 text-success",
  danger: "bg-red-100 text-danger",
  warning: "bg-amber-100 text-warning",
  accent: "bg-accent/10 text-accent",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
