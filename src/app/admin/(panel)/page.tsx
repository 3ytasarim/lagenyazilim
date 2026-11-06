import Link from "next/link";
import { ArrowRight, BookOpen, FileClock, Inbox, LayoutList, MapPinned, SearchCheck, Trophy } from "lucide-react";
import { AdminPage, Card, fmtDateTime } from "@/components/admin/ui";
import { auditLabel } from "@/lib/audit-labels";
import { can } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { dashboardStats, recentActivity, recentLeads } from "@/server/queries/admin";

export const metadata = { title: "Panel" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ yetki?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [s, activity, leads] = await Promise.all([dashboardStats(), can(user.role, "audit") ? recentActivity() : Promise.resolve([]), can(user.role, "crm") ? recentLeads() : Promise.resolve([])]);
  const conversion = s.quotesClosed > 0 ? Math.round((s.quotesWon / s.quotesClosed) * 100) : null;

  const kpis = [
    can(user.role, "crm") && { label: "Teklif (arşiv hariç)", value: s.quotesTotal, icon: Inbox, href: "/admin/teklifler/" },
    can(user.role, "crm") && { label: "Yeni teklif", value: s.quotesNew, icon: Inbox, href: "/admin/teklifler/?durum=new" },
    can(user.role, "crm") && { label: "Kazanılan / sonuçlanan", value: conversion === null ? "—" : `%${conversion}`, icon: Trophy, href: null, hint: conversion === null ? "Henüz sonuçlanan teklif yok" : `${s.quotesWon} / ${s.quotesClosed}` },
    can(user.role, "crm") && { label: "SEO analizi talebi", value: s.seoAudits, icon: SearchCheck, href: "/admin/basvurular/?kaynak=seo_audit" },
    can(user.role, "content") && { label: "Yayındaki yazı", value: s.postsLive, icon: BookOpen, href: "/admin/blog/" },
    can(user.role, "content") && { label: "Taslak / incelemede", value: s.postsDraft, icon: FileClock, href: "/admin/blog/?durum=draft" },
    can(user.role, "content") && { label: "Yayındaki hizmet", value: s.servicesLive, icon: LayoutList, href: "/admin/hizmetler/" },
    can(user.role, "seo") && { label: "Yayındaki bölge sayfası", value: s.regionPagesLive, icon: MapPinned, href: null },
  ].filter(Boolean) as { label: string; value: number | string; icon: typeof Inbox; href: string | null; hint?: string }[];

  return (
    <AdminPage title={`Merhaba, ${user.name.split(" ")[0]}`} description="Tüm sayılar veritabanındaki gerçek kayıtlardan hesaplanır.">
      {sp.yetki === "yok" ? (
        <p role="alert" className="mb-6 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
          Bu sayfaya erişim yetkiniz yok.
        </p>
      ) : null}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const body = (
            <>
              <k.icon aria-hidden className="size-5 text-brand" strokeWidth={1.8} />
              <p className="mt-4 font-display text-3xl font-semibold tabular-nums">{k.value}</p>
              <p className="mt-1 text-sm text-ink-muted">{k.label}</p>
              {k.hint ? <p className="mt-1 text-xs text-ink-soft">{k.hint}</p> : null}
            </>
          );
          return (
            <li key={k.label}>
              {k.href ? (
                <Link href={k.href} className="block rounded-lg border border-line bg-surface p-5 transition-colors hover:border-brand">
                  {body}
                </Link>
              ) : (
                <div className="rounded-lg border border-line bg-surface p-5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        {can(user.role, "crm") ? (
          <Card title="Son başvurular" description="İletişim ve ücretsiz SEO analizi talepleri">
            {leads.length === 0 ? (
              <p className="text-sm text-ink-muted">Henüz başvuru yok.</p>
            ) : (
              <ul className="divide-y divide-line text-[0.9375rem]">
                {leads.map((l) => (
                  <li key={l.id} className="flex justify-between gap-3 py-2.5">
                    <Link href={`/admin/basvurular/${l.id}/`} className="hover:text-brand">{l.name}</Link>
                    <span className="text-sm text-ink-soft">
                      {l.source === "seo_audit" ? "SEO analizi" : "İletişim"} · {fmtDateTime(l.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}
        {can(user.role, "audit") ? (
          <Card
            title="Son yönetim aktiviteleri"
            actions={
              <Link href="/admin/islem-kaydi/" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                Tümü <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            }
          >
            {activity.length === 0 ? (
              <p className="text-sm text-ink-muted">Kayıt yok.</p>
            ) : (
              <ul className="divide-y divide-line text-[0.9375rem]">
                {activity.map((a) => (
                  <li key={a.id} className="flex justify-between gap-3 py-2.5">
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{a.actor ?? "Sistem"}</span> <span className="text-ink-muted">{auditLabel(a.action)}</span>
                    </span>
                    <span className="shrink-0 text-sm text-ink-soft">{fmtDateTime(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}
      </div>
    </AdminPage>
  );
}
