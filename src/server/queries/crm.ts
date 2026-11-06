import "server-only";
import { and, desc, eq, gte, ilike, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, quoteRequests, users } from "@/lib/db/schema";
import { LEAD_STATUSES, QUOTE_STATUSES } from "@/lib/crm";
import { parseLocalDateTime } from "@/server/services/content";

export type QuoteFilters = { durum?: string; hizmet?: string; sorumlu?: string; q?: string; baslangic?: string; bitis?: string; sayfa?: string };

/** Liste ve CSV için ortak filtre. `meId` "sorumlu=ben" için. */
export function quoteWhere(f: QuoteFilters, meId: string): SQL | undefined {
  const conds: (SQL | undefined)[] = [];
  if (f.durum && (QUOTE_STATUSES as readonly string[]).includes(f.durum)) conds.push(eq(quoteRequests.status, f.durum as (typeof QUOTE_STATUSES)[number]));
  else if (f.durum !== "tumu") conds.push(sql`${quoteRequests.status} <> 'archived'`);
  if (f.hizmet && /^[a-z0-9-]{1,40}$/.test(f.hizmet)) conds.push(sql`${f.hizmet} = any(${quoteRequests.serviceKeys})`);
  if (f.sorumlu === "ben") conds.push(eq(quoteRequests.assignedToId, meId));
  else if (f.sorumlu === "atanmamis") conds.push(isNull(quoteRequests.assignedToId));
  if (f.q) {
    const q = `%${f.q.trim().slice(0, 80)}%`;
    conds.push(or(ilike(quoteRequests.number, q), ilike(quoteRequests.contactName, q), ilike(quoteRequests.email, q), ilike(quoteRequests.companyName, q), ilike(quoteRequests.contactCompany, q)));
  }
  const from = f.baslangic ? parseLocalDateTime(`${f.baslangic}T00:00`) : null;
  const to = f.bitis ? parseLocalDateTime(`${f.bitis}T00:00`) : null;
  if (from) conds.push(gte(quoteRequests.createdAt, from));
  if (to) conds.push(lt(quoteRequests.createdAt, new Date(to.getTime() + 86_400_000)));
  return and(...conds);
}

export async function listQuotes(f: QuoteFilters, meId: string, per = 25) {
  const where = quoteWhere(f, meId);
  const page = Math.max(1, Number(f.sayfa) || 1);
  const [rows, [count], statusCounts] = await Promise.all([
    db
      .select({
        id: quoteRequests.id,
        number: quoteRequests.number,
        contactName: quoteRequests.contactName,
        company: sql<string>`coalesce(nullif(${quoteRequests.contactCompany}, ''), ${quoteRequests.companyName})`,
        serviceKeys: quoteRequests.serviceKeys,
        budgetLabel: quoteRequests.budgetLabel,
        status: quoteRequests.status,
        createdAt: quoteRequests.createdAt,
        assignee: users.name,
      })
      .from(quoteRequests)
      .leftJoin(users, eq(quoteRequests.assignedToId, users.id))
      .where(where)
      .orderBy(desc(quoteRequests.createdAt))
      .limit(per)
      .offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)::int` }).from(quoteRequests).where(where),
    db.select({ status: quoteRequests.status, n: sql<number>`count(*)::int` }).from(quoteRequests).groupBy(quoteRequests.status),
  ]);
  return { rows, total: count?.n ?? 0, page, per, statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s.n])) as Record<string, number> };
}

export type LeadFilters = { kaynak?: string; durum?: string; q?: string; sayfa?: string };

export function leadWhere(f: LeadFilters): SQL | undefined {
  return and(
    f.kaynak === "contact" || f.kaynak === "seo_audit" ? eq(leads.source, f.kaynak) : undefined,
    f.durum && (LEAD_STATUSES as readonly string[]).includes(f.durum) ? eq(leads.status, f.durum as (typeof LEAD_STATUSES)[number]) : f.durum === "tumu" ? undefined : sql`${leads.status} <> 'spam'`,
    f.q ? or(ilike(leads.name, `%${f.q.slice(0, 80)}%`), ilike(leads.email, `%${f.q.slice(0, 80)}%`), ilike(leads.company, `%${f.q.slice(0, 80)}%`), ilike(leads.website, `%${f.q.slice(0, 80)}%`)) : undefined,
  );
}

export async function crmAssignees() {
  return db.select({ id: users.id, name: users.name }).from(users).where(and(eq(users.isActive, true), sql`${users.role} <> 'editor'`)).orderBy(users.name);
}

/** CSV: Excel uyumu için BOM + noktalı virgül; formül enjeksiyonuna karşı =,+,-,@ ile başlayan hücreler kaçışlanır. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
}
