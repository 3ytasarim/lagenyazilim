import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Açık tema: lacivert yazılı renkli logo; koyu tema ve koyu bölümler: beyaz logo.
 * Kaynak: müşterinin verdiği JPEG'lerden üretilen saydam WebP'ler (public/brand).
 */
export function Logo({ className, priority = false, tone = "auto", size = "md" }: { className?: string; priority?: boolean; tone?: "auto" | "light"; size?: "md" | "lg" }) {
  const h = size === "lg" ? "h-12" : "h-11";
  const common = { width: 705, height: 240, priority, sizes: size === "lg" ? "141px" : "130px" } as const;
  return (
    <Link href="/" aria-label="Lagen Yazılım ana sayfa" className={cn("inline-flex shrink-0 items-center", className)}>
      {tone === "light" ? (
        <Image src="/brand/lagen-logo-dark.webp" alt="" {...common} className={cn(h, "w-auto")} />
      ) : (
        <>
          <Image src="/brand/lagen-logo.webp" alt="" {...common} className={cn(h, "w-auto dark:hidden")} />
          <Image src="/brand/lagen-logo-dark.webp" alt="" {...common} className={cn(h, "hidden w-auto dark:block")} />
        </>
      )}
    </Link>
  );
}
