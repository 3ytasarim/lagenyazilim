import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Sunucu tarafı sayfalama. `hrefFor(1)` parametresiz URL döndürmeli (kopya ilk sayfa olmasın). */
export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);
  const item = "inline-flex size-11 items-center justify-center rounded-full text-[0.9375rem] font-medium";
  return (
    <nav aria-label="Sayfalar" className="mt-16 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" aria-label="Önceki sayfa" className={cn(item, "hover:bg-surface-2")}>
          <ChevronLeft aria-hidden className="size-4" />
        </Link>
      ) : null}
      {pages.map((p, i) => (
        <span key={p} className="contents">
          {i > 0 && p - (pages[i - 1] ?? p) > 1 ? <span className="px-1 text-ink-soft">…</span> : null}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(item, p === page ? "bg-ink text-bg" : "hover:bg-surface-2")}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" aria-label="Sonraki sayfa" className={cn(item, "hover:bg-surface-2")}>
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
