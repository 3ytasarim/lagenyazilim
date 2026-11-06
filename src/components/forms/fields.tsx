import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Erişilebilir form alanları: label her zaman görünür, hata aria-describedby ile bağlanır. */

export const inputClass =
  "block w-full rounded-md border border-line-strong bg-surface px-4 text-ink placeholder:text-ink-soft transition-colors hover:border-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-danger";

export function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <label htmlFor={id} className="text-[0.9375rem] font-semibold text-ink">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-ink-soft">(isteğe bağlı)</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(inputClass, "h-12", className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea">>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(inputClass, "min-h-32 py-3 leading-relaxed", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select">>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(inputClass, "h-12 appearance-none bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-10", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7088' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...props}>
      {children}
    </select>
  );
});

/** Kart görünümlü checkbox / radio. Gerçek input görünmez değil, yalnızca görsel olarak gizli — klavye ile çalışır. */
export const ChoiceCard = forwardRef<
  HTMLInputElement,
  Omit<ComponentProps<"input">, "type"> & { type: "checkbox" | "radio"; label: string; description?: string }
>(function ChoiceCard({ type, label, description, className, ...props }, ref) {
  return (
    <label
      className={cn(
        "relative flex min-h-14 cursor-pointer items-start gap-3 rounded-md border border-line-strong bg-surface p-4 transition-colors hover:border-ink-soft has-[:checked]:border-brand has-[:checked]:bg-brand-tint has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30",
        className,
      )}
    >
      <input ref={ref} type={type} className="peer mt-0.5 size-[18px] shrink-0 accent-[var(--brand)]" {...props} />
      <span>
        <span className="block font-semibold text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-sm text-ink-muted">{description}</span> : null}
      </span>
    </label>
  );
});
