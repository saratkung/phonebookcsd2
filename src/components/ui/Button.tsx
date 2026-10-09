import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:bg-accent-hover disabled:opacity-50",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-muted disabled:opacity-50",
  ghost: "bg-transparent text-foreground hover:bg-surface-muted disabled:opacity-50",
  danger: "bg-danger text-white hover:opacity-90 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
