import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

const fieldClasses =
  "w-full h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:bg-surface-muted";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={clsx(fieldClasses, error && "border-danger focus-visible:ring-danger", className)}
      {...props}
    />
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, children, ...props },
  ref
) {
  return (
    <select
      ref={ref}
      className={clsx(fieldClasses, "cursor-pointer", error && "border-danger focus-visible:ring-danger", className)}
      {...props}
    >
      {children}
    </select>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        "w-full min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50",
        error && "border-danger focus-visible:ring-danger",
        className
      )}
      {...props}
    />
  );
});

export function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
