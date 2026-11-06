import Link from "next/link";
import { AlertCircle, AlertTriangle, ExternalLink, Info } from "lucide-react";
import { AdminPage, Card } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import { runSeoAudit, type Issue } from "@/server/queries/seo-audit";

export const metadata = { title: "SEO kontrol merkezi" };
export const dynamic = "force-dynamic";

const SEV = {
  error: { icon: AlertCircle, cls: "text-danger", label: "Hata" },
  warning: { icon: AlertTriangle, cls: "text-warning", label: "Uyarı" },
  info: { icon: Info, cls: "text-ink-soft", label: "Bilgi" },
} as const;

export default async function SeoCenter({ searchParams }: { searchParams: Promise<{ seviye?: string }> }) {
  await requireUser("seo");
  const { seviye } = await searchParams;
  const { issues, sitemap, counts, drafts } = await runSeoAudit();
  const shown = seviye && seviye in SEV ? issues.filter((i) => i.severity === seviye) : issues;
  const order: Record<Issue["severity"], number> = { error: 0, warning: 1, info: 2 };
  shown.sort((a, b) => order[a.severity] - order[b.severity]);

  return (
    <AdminPage
      title="SEO kontrol merkezi"
      description="Sitenin kendi verisinden hesaplanan teknik kontroller. Google sıralaması veya trafik verisi burada gösterilmez — bunlar için Search Console kullanılmalıdır."
      actions={
        <Link href="/admin/seo/yonlendirmeler/" className="inline-flex h-10 items-center rounded-full border border-line-strong px-4 text-sm font-semibold hover:border-ink">
          Yönlendirmeler
        </Link>
      }
    >
      <ul className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { l: "Yayındaki içerik", v: counts.published },
          { l: "Taslak / incelemede", v: counts.drafts },
          { l: "Hata", v: counts.errors, cls: counts.errors ? "text-danger" : "" },
          { l: "Uyarı", v: counts.warnings, cls: counts.warnings ? "text-warning" : "" },
          { l: "Medya", v: counts.mediaTotal },
        ].map((k) => (
          <li key={k.l} className="rounded-lg border border-line bg-surface p-5">
            <p className={cn("font-display text-3xl font-semibold tabular-nums", k.cls)}>{k.v}</p>
            <p className="mt-1 text-sm text-ink-muted">{k.l}</p>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title={`Bulgular (${shown.length})`} actions={
          <div className="flex gap-1 text-sm">
            {[["", "Tümü"], ["error", "Hata"], ["warning", "Uyarı"], ["info", "Bilgi"]].map(([k, l]) => (
              <Link key={k} href={k ? `?seviye=${k}` : "?"} className={cn("rounded-full px-2.5 py-1", (seviye ?? "") === k ? "bg-ink text-bg" : "hover:bg-surface-2")}>
                {l}
              </Link>
            ))}
          </div>
        }>
          {shown.length === 0 ? (
            <p className="text-sm text-success">Bu filtrede bulgu yok.</p>
          ) : (
            <ul className="divide-y divide-line">
              {shown.map((i, n) => {
                const S = SEV[i.severity];
                return (
                  <li key={n} className="flex gap-3 py-3">
                    <S.icon aria-label={S.label} className={cn("mt-0.5 size-4 shrink-0", S.cls)} />
                    <div className="min-w-0 flex-1 text-[0.9375rem]">
                      <p>{i.message}</p>
                      {i.item ? (
                        <p className="mt-0.5 text-sm text-ink-soft">
                          {i.item.type} ·{" "}
                          <Link href={i.item.editHref} className="text-brand hover:underline">
                            {i.item.label}
                          </Link>
                          {i.item.path ? <span className="ml-1 break-all">{i.item.path}</span> : null}
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="grid min-w-0 content-start gap-6">
          <Card title="Sitemap" description="Yalnızca yayında ve indekslenebilir sayfalar.">
            <ul className="grid gap-2 text-[0.9375rem]">
              {sitemap.map((s) => (
                <li key={s.type} className="flex justify-between">
                  {s.count > 0 ? (
                    <a href={`/sitemaps/${s.type}.xml`} target="_blank" className="inline-flex items-center gap-1 text-brand hover:underline">
                      {s.type}.xml <ExternalLink aria-hidden className="size-3" />
                    </a>
                  ) : (
                    <span className="text-ink-soft">{s.type}.xml</span>
                  )}
                  <span className="tabular-nums">{s.count} URL</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-3 text-sm">
              <a href="/sitemap.xml" target="_blank" className="text-brand hover:underline">
                sitemap.xml
              </a>
              <a href="/robots.txt" target="_blank" className="text-brand hover:underline">
                robots.txt
              </a>
              <a href="/llms.txt" target="_blank" className="text-brand hover:underline">
                llms.txt
              </a>
            </div>
          </Card>
          <Card title={`Yayında olmayanlar (${drafts.length})`} description="Taslak ve incelemedeki içerikler noindex'tir ve sitemap'te yoktur.">
            {drafts.length === 0 ? (
              <p className="text-sm text-ink-muted">Yok.</p>
            ) : (
              <ul className="grid gap-1.5 text-sm">
                {drafts.slice(0, 30).map((d) => (
                  <li key={d.editHref}>
                    <span className="text-ink-soft">{d.type}:</span>{" "}
                    <Link href={d.editHref} className="hover:text-brand">
                      {d.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
