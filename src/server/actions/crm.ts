"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { budgetRanges, leads, notifications, quoteAttachments, quoteNotes, quoteRequests, quoteServiceOptions, quoteStatusHistory, users, type QuoteExtraField } from "@/lib/db/schema";
import { LEAD_STATUSES, QUOTE_STATUSES, type QuoteStatus } from "@/lib/crm";
import { sendMail } from "@/lib/email/mailer";
import { leadAdminMail, quoteAdminMail, quoteReceiptMail } from "@/lib/email/templates";
import { getSettingUncached } from "@/lib/settings";
import { audit } from "@/server/services/audit";
import { invalidate, json, str } from "@/server/services/content";
import { ActionError, guard, run, type ActionResult } from "./_guard";

const NOTE_KINDS = ["note", "call", "email", "meeting"];

async function quoteOr404(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new ActionError("Teklif bulunamadı.");
  const [q] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id)).limit(1);
  if (!q) throw new ActionError("Teklif bulunamadı.");
  return q;
}

export async function updateQuoteStatus(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("crm", fd.get("csrf"));
    const q = await quoteOr404(str(fd, "id"));
    const to = str(fd, "status") as QuoteStatus;
    if (!QUOTE_STATUSES.includes(to)) throw new ActionError("Geçersiz durum.");
    const note = str(fd, "note").slice(0, 2000) || null;
    if (to === q.status && !note) return { ok: true, message: "Durum zaten bu." };
    // Kayıp/kazanç gibi sonuç durumlarında kısa bir gerekçe istenir (raporlama için)
    if ((to === "lost" || to === "won") && !note) return { ok: false, message: "Sonuç durumları için kısa bir not yazın.", fieldErrors: { note: "Not zorunlu." } };
    await db.transaction(async (tx) => {
      await tx.update(quoteRequests).set({ status: to }).where(eq(quoteRequests.id, q.id));
      await tx.insert(quoteStatusHistory).values({ quoteId: q.id, fromStatus: q.status, toStatus: to, changedById: user.id, note });
    });
    await audit({ actorId: user.id, action: "quote.status", entityType: "quote", entityId: q.id, diff: { status: { from: q.status, to }, number: q.number }, ipHash });
    revalidatePath(`/admin/teklifler/${q.id}/`);
    return { ok: true, message: "Durum güncellendi." };
  });
}

export async function addQuoteNote(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("crm", fd.get("csrf"));
    const q = await quoteOr404(str(fd, "id"));
    const body = str(fd, "body").slice(0, 5000);
    const kind = NOTE_KINDS.includes(str(fd, "kind")) ? str(fd, "kind") : "note";
    if (body.length < 2) return { ok: false, message: "Not boş olamaz.", fieldErrors: { body: "Bir not yazın." } };
    await db.insert(quoteNotes).values({ quoteId: q.id, authorId: user.id, kind, body });
    await db.update(quoteRequests).set({ updatedAt: new Date() }).where(eq(quoteRequests.id, q.id));
    await audit({ actorId: user.id, action: "quote.note", entityType: "quote", entityId: q.id, diff: { kind, number: q.number }, ipHash });
    revalidatePath(`/admin/teklifler/${q.id}/`);
    return { ok: true, message: "Kaydedildi." };
  });
}

export async function updateQuoteMeta(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("crm", fd.get("csrf"));
    const q = await quoteOr404(str(fd, "id"));
    const assignee = str(fd, "assignedToId") || null;
    if (assignee) {
      const [u] = await db.select({ id: users.id, role: users.role, isActive: users.isActive }).from(users).where(eq(users.id, assignee)).limit(1);
      if (!u || !u.isActive || u.role === "editor") throw new ActionError("Seçilen kişi teklif sorumlusu olamaz.");
    }
    const tags = json<string[]>(fd, "tags", [])
      .map((t) => String(t).trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 12);
    await db.update(quoteRequests).set({ assignedToId: assignee, tags }).where(eq(quoteRequests.id, q.id));
    await audit({ actorId: user.id, action: "quote.meta", entityType: "quote", entityId: q.id, diff: { assignedToId: { from: q.assignedToId, to: assignee }, tags }, ipHash });
    revalidatePath(`/admin/teklifler/${q.id}/`);
    return { ok: true, message: "Kaydedildi." };
  });
}

export async function updateLead(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("crm", fd.get("csrf"));
    const id = str(fd, "id");
    const [l] = /^[0-9a-f-]{36}$/.test(id) ? await db.select().from(leads).where(eq(leads.id, id)).limit(1) : [];
    if (!l) throw new ActionError("Başvuru bulunamadı.");
    const status = str(fd, "status") as (typeof LEAD_STATUSES)[number];
    if (!LEAD_STATUSES.includes(status)) throw new ActionError("Geçersiz durum.");
    const assignee = str(fd, "assignedToId") || null;
    await db.update(leads).set({ status, assignedToId: assignee, adminNote: str(fd, "adminNote").slice(0, 5000) || null }).where(eq(leads.id, id));
    await audit({ actorId: user.id, action: "lead.update", entityType: "lead", entityId: id, diff: { status: { from: l.status, to: status }, assignedToId: assignee }, ipHash });
    revalidatePath(`/admin/basvurular/${id}/`);
    return { ok: true, message: "Kaydedildi." };
  });
}

/** Başarısız / atlanmış bildirimi ilgili kayıttan yeniden üreterek gönderir. */
export async function retryNotification(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("crm", fd.get("csrf"));
    const [n] = await db.select().from(notifications).where(eq(notifications.id, str(fd, "id"))).limit(1);
    if (!n || !n.relatedId) throw new ActionError("Bildirim bulunamadı.");
    if (n.status === "sent") return { ok: true, message: "Bu bildirim zaten gönderilmiş." };
    const smtp = await getSettingUncached("smtp");
    const adminTo = process.env.NOTIFY_TO || smtp.notifyTo;
    let result: "sent" | "failed" | "skipped";
    if (n.relatedType === "quote") {
      const [q] = await db.select().from(quoteRequests).where(eq(quoteRequests.id, n.relatedId)).limit(1);
      if (!q) throw new ActionError("İlgili teklif silinmiş.");
      const opts = await db.select({ label: quoteServiceOptions.label }).from(quoteServiceOptions).where(inArray(quoteServiceOptions.key, q.serviceKeys));
      const [{ n: att } = { n: 0 }] = await db.select({ n: sql<number>`count(*)::int` }).from(quoteAttachments).where(eq(quoteAttachments.quoteId, q.id));
      const mail = {
        id: q.id,
        number: q.number,
        services: opts.map((o) => o.label).join(", "),
        contactName: q.contactName,
        email: q.email,
        phone: q.phone,
        company: q.contactCompany ?? q.companyName,
        location: [q.city, q.district].filter(Boolean).join(" / "),
        preferredContact: q.preferredContact,
        needs: q.needs,
        budget: q.budgetLabel ?? "",
        startTiming: q.startTiming ?? "",
        attachments: att,
      };
      if (n.template === "quote_receipt") result = await sendMail({ template: n.template, to: q.email, ...quoteReceiptMail(mail, await getSettingUncached("business")), related: { type: "quote", id: q.id } });
      else result = await sendMail({ template: n.template, to: adminTo || "(tanımsız)", ...quoteAdminMail(mail), replyTo: q.email, related: { type: "quote", id: q.id } });
    } else if (n.relatedType === "lead") {
      const [l] = await db.select().from(leads).where(eq(leads.id, n.relatedId)).limit(1);
      if (!l) throw new ActionError("İlgili başvuru silinmiş.");
      result = await sendMail({
        template: n.template,
        to: adminTo || "(tanımsız)",
        ...leadAdminMail({ id: l.id, source: l.source, name: l.name, email: l.email, phone: l.phone ?? "", company: l.company ?? "", website: l.website ?? "", goal: l.goal ?? "", subject: l.subject ?? "", message: l.message }),
        replyTo: l.email,
        related: { type: "lead", id: l.id },
      });
    } else throw new ActionError("Bu bildirim yeniden gönderilemez.");
    // Eski kayıt, yeni denemeye bağlandığını gösterecek şekilde işaretlenir
    await db.update(notifications).set({ lastError: `${n.lastError ?? ""} · yeniden denendi: ${result}`.slice(0, 500) }).where(eq(notifications.id, n.id));
    await audit({ actorId: user.id, action: "notification.retry", entityType: "notification", entityId: n.id, diff: { result }, ipHash });
    revalidatePath("/admin/bildirimler/");
    if (result === "sent") return { ok: true, message: "Gönderildi." };
    throw new ActionError(result === "skipped" ? "SMTP veya alıcı adresi tanımlı değil (Site ayarları › E-posta)." : "Gönderim yine başarısız oldu.");
  });
}

/* ---------- Teklif formu seçenekleri ---------- */

const FIELD_TYPES = ["text", "textarea", "select", "multiselect", "number"];

function cleanExtraFields(v: unknown): QuoteExtraField[] {
  return (Array.isArray(v) ? v : [])
    .map((f) => ({
      key: String(f?.key ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 40),
      label: String(f?.label ?? "").trim().slice(0, 120),
      type: (FIELD_TYPES.includes(f?.type) ? f.type : "text") as QuoteExtraField["type"],
      options: Array.isArray(f?.options) ? f.options.map((o: unknown) => String(o).trim().slice(0, 80)).filter(Boolean).slice(0, 20) : undefined,
    }))
    .filter((f) => f.key && f.label)
    .slice(0, 12);
}

export async function saveQuoteOption(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("settings", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const key = str(fd, "key").toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40);
    const label = str(fd, "label").slice(0, 80);
    if (!key || !label) return { ok: false, message: "Anahtar ve ad zorunlu.", fieldErrors: { key: key ? "" : "Zorunlu", label: label ? "" : "Zorunlu" } };
    const values = { key, label, description: str(fd, "description").slice(0, 200) || null, extraFields: cleanExtraFields(json(fd, "extraFields", [])), sortOrder: Number(str(fd, "sortOrder")) || 0, isActive: fd.get("isActive") === "1" };
    try {
      if (id) await db.update(quoteServiceOptions).set(values).where(eq(quoteServiceOptions.id, id));
      else await db.insert(quoteServiceOptions).values(values);
    } catch {
      throw new ActionError("Bu anahtar başka bir seçenekte kullanılıyor.");
    }
    await audit({ actorId: user.id, action: id ? "quote_option.update" : "quote_option.create", entityType: "quote_option", entityId: id, diff: { key, isActive: values.isActive }, ipHash });
    invalidate("quote-options");
    return { ok: true, message: "Seçenek kaydedildi." };
  });
}

export async function saveBudgetRange(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("settings", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const label = str(fd, "label").slice(0, 80);
    if (!label) return { ok: false, message: "Etiket zorunlu.", fieldErrors: { label: "Zorunlu" } };
    const num = (k: string) => (str(fd, k) ? Math.max(0, Math.round(Number(str(fd, k)))) || null : null);
    const values = { label, minTry: num("minTry"), maxTry: num("maxTry"), sortOrder: Number(str(fd, "sortOrder")) || 0, isActive: fd.get("isActive") === "1" };
    if (values.minTry && values.maxTry && values.minTry > values.maxTry) return { ok: false, message: "Alt sınır üst sınırdan büyük olamaz." };
    if (id) await db.update(budgetRanges).set(values).where(eq(budgetRanges.id, id));
    else await db.insert(budgetRanges).values(values);
    await audit({ actorId: user.id, action: id ? "budget.update" : "budget.create", entityType: "budget", entityId: id, diff: values, ipHash });
    invalidate("quote-options");
    return { ok: true, message: "Bütçe aralığı kaydedildi." };
  });
}

export async function deleteFormOption(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("settings", fd.get("csrf"));
    const kind = str(fd, "kind");
    const id = str(fd, "id");
    if (kind === "budget") {
      // Geçmiş teklifler etiketi kopyaladığı için silme güvenli; FK set null
      await db.delete(budgetRanges).where(eq(budgetRanges.id, id));
    } else if (kind === "option") {
      const [o] = await db.select({ key: quoteServiceOptions.key }).from(quoteServiceOptions).where(eq(quoteServiceOptions.id, id)).limit(1);
      if (!o) throw new ActionError("Seçenek bulunamadı.");
      const [used] = await db.select({ n: sql<number>`count(*)::int` }).from(quoteRequests).where(sql`${o.key} = any(${quoteRequests.serviceKeys})`);
      if ((used?.n ?? 0) > 0) throw new ActionError("Bu seçenekle gelmiş teklifler var; silmek yerine pasifleştirin.");
      await db.delete(quoteServiceOptions).where(and(eq(quoteServiceOptions.id, id)));
    } else throw new ActionError("Geçersiz işlem.");
    await audit({ actorId: user.id, action: `${kind}.delete`, entityType: kind, entityId: id, ipHash });
    invalidate("quote-options");
    return { ok: true, message: "Silindi." };
  });
}
