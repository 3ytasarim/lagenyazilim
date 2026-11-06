import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatDate } from "@/lib/utils";

type LegalPageData = { slug: string; title: string; h1: string; html: string; requiresLegalReview: boolean; version: string | null; updatedAt: string };

/** Yasal sayfa gövdesi; hukuki onay bekleyen metinlerde uyarı bandı gösterilir. */
export function LegalPage({ page }: { page: LegalPageData }) {
  return (
    <>
      <PageHeader crumbs={[{ name: page.title, path: `/${page.slug}/` }]} eyebrow="Yasal" title={page.h1} />
      <div className="container-site py-14 md:py-20">
        {page.requiresLegalReview ? (
          <p role="note" className="mb-12 flex max-w-[68ch] gap-3 rounded-md border border-warning/40 bg-warning/10 p-4 text-[0.9375rem] text-ink">
            <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
            Bu metin hukuki incelemesi tamamlanmamış bir taslaktır; köşeli parantez içindeki alanlar güncellenecektir.
          </p>
        ) : null}
        <div className="prose prose-site" dangerouslySetInnerHTML={{ __html: page.html }} />
        <p className="mt-10 text-sm text-ink-soft">
          {page.version ? `Sürüm: ${page.version} · ` : ""}Son güncelleme: <time dateTime={page.updatedAt}>{formatDate(page.updatedAt)}</time>
        </p>
      </div>
    </>
  );
}
