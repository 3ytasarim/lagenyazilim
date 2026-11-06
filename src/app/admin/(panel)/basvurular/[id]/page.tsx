import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Mail, Phone } from "lucide-react";
import { LeadForm } from "@/components/admin/forms/QuoteActions";
import { AdminPage, Card, fmtDateTime } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { LEAD_SOURCE_LABEL } from "@/lib/crm";
import { db } from "@/lib/db";
import { leads, notifications } from "@/lib/db/schema";
import { crmAssignees } from "@/server/queries/crm";

export const metadata = { title: "Başvuru" };

export default async function LeadDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("crm");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [l] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!l) notFound();
  const [assignees, notifs] = await Promise.all([crmAssignees(), db.select().from(notifications).where(eq(notifications.relatedId, l.id)).orderBy(desc(notifications.createdAt))]);
  const site = l.website ? (/^https?:\/\//.test(l.website) ? l.website : `https://${l.website}`) : null;

  return (
    <AdminPage title={l.name} crumbs={[{ href: "/admin/basvurular/", label: "Başvurular" }]} description={`${LEAD_SOURCE_LABEL[l.source]} · ${fmtDateTime(l.createdAt)}`}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card title="Başvuru">
            <dl className="grid gap-x-6 gap-y-3 text-[0.9375rem] sm:grid-cols-[160px_1fr]">
              {(
                [
                  ["Firma", l.company],
                  ["Web sitesi", site],
                  ["SEO hedefi", l.goal],
                  ["Konu", l.subject],
                  ["Mesaj", l.message],
                  ["Kaynak sayfa", l.sourcePath],
                ] as [string, string | null][]
              )
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-ink-soft">{k}</dt>
                    <dd className="whitespace-pre-line break-words">
                      {k === "Web sitesi" ? (
                        <a href={v!} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                          {v}
                        </a>
                      ) : (
                        v
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
            {l.source === "seo_audit" ? <p className="mt-5 rounded-md bg-surface-2/70 p-3 text-sm text-ink-muted">Ücretsiz analiz bir uzman tarafından yapılır; otomatik skor üretilmez. Değerlendirmeyi e-postayla gönderdikten sonra durumu &quot;İletişime geçildi&quot; yapın.</p> : null}
          </Card>
        </div>
        <div className="grid min-w-0 content-start gap-6">
          <Card title="İletişim">
            <ul className="grid gap-2 text-[0.9375rem]">
              <li>
                <a href={`mailto:${l.email}`} className="inline-flex items-center gap-2 text-brand hover:underline">
                  <Mail aria-hidden className="size-4" /> {l.email}
                </a>
              </li>
              {l.phone ? (
                <li>
                  <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-brand hover:underline">
                    <Phone aria-hidden className="size-4" /> {l.phone}
                  </a>
                </li>
              ) : null}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs text-ink-soft">
              KVKK onayı: {fmtDateTime(l.kvkkAcceptedAt)} (sürüm {l.kvkkVersion})
            </p>
          </Card>
          <Card title="Takip">
            <LeadForm csrf={user.csrfToken} id={l.id} status={l.status} assignedToId={l.assignedToId} adminNote={l.adminNote} assignees={assignees} />
          </Card>
          <Card title="Bildirimler">
            {notifs.length === 0 ? (
              <p className="text-sm text-ink-muted">Kayıt yok.</p>
            ) : (
              <ul className="grid gap-1 text-sm">
                {notifs.map((n) => (
                  <li key={n.id}>
                    Ekibe bildirim: <span className={n.status === "sent" ? "text-success" : "text-ink-soft"}>{{ sent: "gönderildi", failed: "başarısız", skipped: "atlandı", pending: "bekliyor" }[n.status]}</span>
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
