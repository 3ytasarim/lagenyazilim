import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "inverse-outline";
type Size = "md" | "lg" | "sm";

const base =
  "btn-shine arrow-nudge inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out-expo active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  // btn-induction: WebGL kenar arkları (components/ui/induction-button.tsx); WebGL yoksa bu CSS görünümü kalır
  primary: "btn-induction bg-brand text-on-brand hover:bg-brand-hover shadow-card",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink",
  ghost: "text-ink hover:bg-surface-2",
  inverse: "bg-on-deep text-deep hover:bg-white",
  "inverse-outline": "border border-on-deep/30 text-on-deep hover:border-on-deep hover:bg-on-deep/5",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[0.9375rem]",
  lg: "h-14 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
