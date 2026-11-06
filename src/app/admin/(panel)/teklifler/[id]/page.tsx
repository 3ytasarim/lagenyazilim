import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { Download, FileText, Mail, MessageCircle, Phone } from "lucide-react";
import { QuoteMetaForm, QuoteNoteForm, QuoteStatusForm } from "@/components/admin/forms/QuoteActions";
import { QuoteStatusBadge } from "@/components/admin/QuoteStatusBadge";
import { AdminPage, Card, fmtDateTime } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { CONTACT_LABEL, NOTE_KIND_LABEL, QUOTE_STATUS_LABEL, type QuoteStatus } from "@/lib/crm";
import { db } from "@/lib/db";
import { notifications, quoteAttachments, quoteNotes, quoteRequests, quoteServiceOptions, quoteStatusHistory, users } from "@/lib/db/schema";
import { formatBytes } from "@/lib/utils";
import { crmAssignees } from "@/server/queries/crm";

export const metadata = { title: "Teklif" };

const wa = (phone: string) => phone.replace(/\D/g, "").replace(/^0/, "90").replace(/^(?!90)/, "90");

export default async function QuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("crm");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [q] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id)).limit(1);
  if (!q) notFound();

  const [options, attachments, history, notes, notifs, assignees] = await Promise.all([
    db.select({ key: quoteServiceOptions.key, label: quoteServiceOptions.label, extraFields: quoteServiceOptions.extraFields }).from(quoteServiceOptions).where(inArray(quoteServiceOptions.key, q.serviceKeys)),
    db.select().from(quoteAttachments).where(eq(quoteAttachments.quoteId, q.id)).orderBy(asc(quoteAttachments.createdAt)),
    db.select({ h: quoteStatusHistory, by: users.name }).from(quoteStatusHistory).leftJoin(users, eq(quoteStatusHistory.changedById, users.id)).where(eq(quoteStatusHistory.quoteId, q.id)),
    db.select({ n: quoteNotes, by: users.name }).from(quoteNotes).leftJoin(users, eq(quoteNotes.authorId, users.id)).where(eq(quoteNotes.quoteId, q.id)),
    db.select().from(notifications).where(eq(notifications.relatedId, q.id)).orderBy(desc(notifications.createdAt)),
    crmAssignees(),
  ]);
  const extraLabel = new Map(options.flatMap((o) => o.extraFields.map((f) => [f.key, f.label] as const)));

  const timeline = [
    ...history.map(({ h, by }) => ({ at: h.createdAt, kind: "status" as const, by, title: h.fromStatus ? `${QUOTE_STATUS_LABEL[h.fromStatus as QuoteStatus]} → ${QUOTE_STATUS_LABEL[h.toStatus as QuoteStatus]}` : "Talep oluşturuldu", body: h.note })),
    ...notes.map(({ n, by }) => ({ at: n.createdAt, kind: "note" as const, by, title: NOTE_KIND_LABEL[n.kind] ?? "Not", body: n.body })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  const rows: [string, string | null][] = [
    ["Hizmetler", options.map((o) => o.label).join(", ")],
    ["Firma", q.companyName],
    ["Proje adı", q.projectName],
    ["Mevcut site", q.currentWebsite],
    ["Sektör", q.sector],
    ["Projenin amacı", q.goal],
    ["İstenen özellikler", q.features.join("\n")],
    ["Referans siteler", q.referenceSites.join("\n")],
    ...Object.entries(q.extra).map(([k, v]) => [extraLabel.get(k) ?? k, Array.isArray(v) ? v.join(", ") : v] as [string, string]),
    ["Bütçe", q.budgetLabel],
    ["Başlangıç", q.startTiming],
    ["Hedef tarih", q.targetDate],
    ["Öncelik", q.priority],
  ];

  return (
    <AdminPage
      title={q.number}
      crumbs={[{ href: "/admin/teklifler/", label: "Teklifler" }]}
      description={`${fmtDateTime(q.createdAt)} · ${q.sourcePath ?? "web sitesi"}`}
      actions={<QuoteStatusBadge status={q.status} />}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card title="İhtiyaç">
            <p className="whitespace-pre-line text-[0.9375rem]">{q.needs}</p>
          </Card>
          <Card title="Proje bilgileri">
            <dl className="grid gap-x-6 gap-y-3 text-[0.9375rem] sm:grid-cols-[180px_1fr]">
              {rows
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-ink-soft">{k}</dt>
                    <dd className="whitespace-pre-line break-words">{v}</dd>
                  </div>
                ))}
            </dl>
          </Card>
          <Card title={`Ekler (${attachments.length})`}>
            {attachments.length === 0 ? (
              <p className="text-sm text-ink-muted">Dosya eklenmemiş.</p>
            ) : (
              <ul className="grid gap-2">
                {attachments.map((a) => (
                  <li key={a.id}>
                    <a href={`/admin/teklifler/${q.id}/ek/${a.id}/`} className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5 text-sm hover:border-brand">
                      <FileText aria-hidden className="size-4 text-ink-soft" />
                      <span className="min-w-0 flex-1 truncate">{a.originalName}</span>
                      <span className="text-ink-soft tabular-nums">{formatBytes(a.sizeBytes)}</span>
                      <Download aria-hidden className="size-4 text-brand" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Not / görüşme ekle">
            <QuoteNoteForm csrf={user.csrfToken} id={q.id} />
          </Card>
          <Card title="Geçmiş">
            <ol className="relative grid gap-5 border-l border-line pl-5">
              {timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span aria-hidden className={`absolute top-1.5 -left-[25px] size-2.5 rounded-full ${t.kind === "status" ? "bg-brand" : "bg-ink-soft"}`} />
                  <p className="text-sm">
                    <span className="font-semibold">{t.title}</span> <span className="text-ink-soft">· {t.by ?? "Sistem"} · {fmtDateTime(t.at)}</span>
                  </p>
                  {t.body ? <p className="mt-1 whitespace-pre-line text-[0.9375rem] text-ink-muted">{t.body}</p> : null}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-6">
          <Card title="İletişim">
            <p className="font-semibold">{q.contactName}</p>
            {q.contactCompany ? <p className="text-sm text-ink-muted">{q.contactCompany}</p> : null}
            <p className="mt-1 text-sm text-ink-soft">
              {[q.city, q.district].filter(Boolean).join(" / ") || "Konum belirtilmedi"} · tercih: {CONTACT_LABEL[q.preferredContact] ?? q.preferredContact}
            </p>
            <ul className="mt-4 grid gap-2 text-[0.9375rem]">
              <li>
                <a href={`mailto:${q.email}?subject=${encodeURIComponent(`${q.number} teklif talebiniz`)}`} className="inline-flex items-center gap-2 text-brand hover:underline">
                  <Mail aria-hidden className="size-4" /> {q.email}
                </a>
              </li>
              <li>
                <a href={`tel:${q.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-brand hover:underline">
                  <Phone aria-hidden className="size-4" /> {q.phone}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${wa(q.phone)}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-brand hover:underline">
                  <MessageCircle aria-hidden className="size-4" /> WhatsApp
                </a>
              </li>
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
              KVKK onayı: {fmtDateTime(q.kvkkAcceptedAt)} (metin sürümü {q.kvkkVersion}) · Açık rıza: {q.explicitConsentAt ? fmtDateTime(q.explicitConsentAt) : "verilmedi"}
            </p>
          </Card>
          <Card title="Durum">
            <QuoteStatusForm csrf={user.csrfToken} id={q.id} status={q.status} />
          </Card>
          <Card title="Atama ve etiketler">
            <QuoteMetaForm csrf={user.csrfToken} id={q.id} assignedToId={q.assignedToId} tags={q.tags} assignees={assignees} />
          </Card>
          <Card title="Bildirimler">
            {notifs.length === 0 ? (
              <p className="text-sm text-ink-muted">Kayıt yok.</p>
            ) : (
              <ul className="grid gap-2 text-sm">
                {notifs.map((n) => (
                  <li key={n.id} className="flex justify-between gap-2">
                    <span>{n.template === "quote_receipt" ? "Müşteriye alındı e-postası" : "Ekibe bildirim"}</span>
                    <span className={n.status === "sent" ? "text-success" : n.status === "failed" ? "text-danger" : "text-ink-soft"}>{{ sent: "gönderildi", failed: "başarısız", skipped: "atlandı", pending: "bekliyor" }[n.status]}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/bildirimler/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
              Tüm bildirimler
            </Link>
          </Card>
        </div>
      </div>
    </AdminPage>
  );
}
