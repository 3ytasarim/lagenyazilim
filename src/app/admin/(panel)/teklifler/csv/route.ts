import { asc, desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { CONTACT_LABEL, QUOTE_STATUS_LABEL, type QuoteStatus } from "@/lib/crm";
import { db } from "@/lib/db";
import { quoteRequests, quoteServiceOptions, users } from "@/lib/db/schema";
import { requestMeta } from "@/lib/request-meta";
import { quoteWhere, toCsv } from "@/server/queries/crm";
import { audit } from "@/server/services/audit";

/** Filtrelenmiş teklif listesini CSV olarak indirir (en fazla 5.000 satır). Dışa aktarma işlem kaydına yazılır. */
export async function GET(req: Request) {
  const user = await requireUser("crm");
  const f = Object.fromEntries(new URL(req.url).searchParams);
  const [rows, options] = await Promise.all([
    db
      .select({ q: quoteRequests, assignee: users.name })
      .from(quoteRequests)
      .leftJoin(users, eq(quoteRequests.assignedToId, users.id))
      .where(quoteWhere(f, user.id))
      .orderBy(desc(quoteRequests.createdAt))
      .limit(5000),
    db.select({ key: quoteServiceOptions.key, label: quoteServiceOptions.label }).from(quoteServiceOptions).orderBy(asc(quoteServiceOptions.sortOrder)),
  ]);
  const labelOf = new Map(options.map((o) => [o.key, o.label]));
  const fmt = (d: Date) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(d);
  const csv = toCsv([
    ["Numara", "Tarih", "Durum", "Hizmetler", "Ad soyad", "Firma", "E-posta", "Telefon", "İletişim tercihi", "Şehir", "İlçe", "Bütçe", "Başlangıç", "Hedef tarih", "Öncelik", "Mevcut site", "Sektör", "Amaç", "İhtiyaç", "Sorumlu", "Etiketler", "Kaynak sayfa"],
    ...rows.map(({ q, assignee }) => [
      q.number,
      fmt(q.createdAt),
      QUOTE_STATUS_LABEL[q.status as QuoteStatus],
      q.serviceKeys.map((k) => labelOf.get(k) ?? k).join(", "),
      q.contactName,
      q.contactCompany || q.companyName,
      q.email,
      q.phone,
      CONTACT_LABEL[q.preferredContact] ?? q.preferredContact,
      q.city,
      q.district,
      q.budgetLabel,
      q.startTiming,
      q.targetDate,
      q.priority,
      q.currentWebsite,
      q.sector,
      q.goal,
      q.needs,
      assignee,
      q.tags.join(", "),
      q.sourcePath,
    ]),
  ]);
  const { ipHash } = await requestMeta();
  await audit({ actorId: user.id, action: "quote.export", entityType: "quote", diff: { rows: rows.length, filters: f }, ipHash });
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="teklifler-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
