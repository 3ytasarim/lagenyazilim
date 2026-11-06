import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { LEAD_SOURCE_LABEL, LEAD_STATUS_LABEL } from "@/lib/crm";
import { db } from "@/lib/db";
import { leads, users } from "@/lib/db/schema";
import { requestMeta } from "@/lib/request-meta";
import { leadWhere, toCsv } from "@/server/queries/crm";
import { audit } from "@/server/services/audit";

export async function GET(req: Request) {
  const user = await requireUser("crm");
  const f = Object.fromEntries(new URL(req.url).searchParams);
  const rows = await db.select({ l: leads, assignee: users.name }).from(leads).leftJoin(users, eq(leads.assignedToId, users.id)).where(leadWhere(f)).orderBy(desc(leads.createdAt)).limit(5000);
  const fmt = (d: Date) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(d);
  const csv = toCsv([
    ["Tarih", "Kaynak", "Durum", "Ad soyad", "Firma", "E-posta", "Telefon", "Web sitesi", "Hedef", "Konu", "Mesaj", "Sorumlu", "İç not"],
    ...rows.map(({ l, assignee }) => [fmt(l.createdAt), LEAD_SOURCE_LABEL[l.source], LEAD_STATUS_LABEL[l.status], l.name, l.company, l.email, l.phone, l.website, l.goal, l.subject, l.message, assignee, l.adminNote]),
  ]);
  const { ipHash } = await requestMeta();
  await audit({ actorId: user.id, action: "lead.export", entityType: "lead", diff: { rows: rows.length, filters: f }, ipHash });
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="basvurular-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
