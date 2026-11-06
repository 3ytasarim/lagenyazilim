import "server-only";
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { budgetRanges, leads, pages, quoteAttachments, quoteRequests, quoteServiceOptions, quoteStatusHistory } from "@/lib/db/schema";
import { notifyAddress, sendMail } from "@/lib/email/mailer";
import { leadAdminMail, quoteAdminMail, quoteReceiptMail, type QuoteMail } from "@/lib/email/templates";
import { getSettingUncached } from "@/lib/settings";
import { putFile, removeDir, sniffMime } from "@/lib/storage";
import type { ContactInput, SeoAuditInput } from "@/lib/validation/lead";
import type { QuoteInput } from "@/lib/validation/quote";

export class SubmitError extends Error {}

const EXT: Record<string, string> = { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

async function kvkkVersion(): Promise<string> {
  const [p] = await db.select({ version: pages.version, updatedAt: pages.updatedAt }).from(pages).where(eq(pages.slug, "kvkk-aydinlatma-metni")).limit(1);
  return p?.version ?? (p ? p.updatedAt.toISOString().slice(0, 10) : "tanımsız");
}

/** Gönderim süresi kontrolü: çok hızlı (bot) veya çok eski (bayat form) gönderimler reddedilir. */
export function plausibleTiming(startedAt: number, now = Date.now()) {
  const elapsed = now - startedAt;
  return elapsed >= 3000 && elapsed <= 24 * 3600_000;
}

function splitLocation(v: string) {
  const [city, district] = v.split("/").map((s) => s.trim());
  return { city: city || null, district: district || null };
}

export type QuoteFile = { name: string; buf: Buffer };

/**
 * Teklif kaydı. Aynı idempotency anahtarıyla tekrar gönderilirse mevcut numara döner (çift kayıt yok).
 * Kayıt, ekler ve durum geçmişi tek transaction'da yazılır; bildirimler yanıt gönderildikten sonra (after) gider
 * ve e-posta hatası kaydı etkilemez.
 */
export async function createQuote(input: QuoteInput, files: QuoteFile[], meta: { ipHash: string | null; userAgent: string | null; sourcePath: string | null; utm: Record<string, string> }) {
  const [existing] = await db.select({ number: quoteRequests.number }).from(quoteRequests).where(eq(quoteRequests.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existing) return { number: existing.number, duplicate: true };

  // Hizmet anahtarları yalnızca aktif seçeneklerden
  const options = await db.select({ key: quoteServiceOptions.key, label: quoteServiceOptions.label, extraFields: quoteServiceOptions.extraFields }).from(quoteServiceOptions).where(inArray(quoteServiceOptions.key, input.services));
  const active = options.map((o) => o.key);
  if (active.length === 0) throw new SubmitError("Lütfen geçerli bir hizmet seçin.");
  const allowedExtra = new Set(options.flatMap((o) => o.extraFields.map((f) => f.key)));
  const extra = Object.fromEntries(Object.entries(input.extra).filter(([k, v]) => allowedExtra.has(k) && v !== false && v !== "")) as Record<string, string | string[]>;

  const [budget] = /^[0-9a-f-]{36}$/.test(input.budget) ? await db.select().from(budgetRanges).where(eq(budgetRanges.id, input.budget)).limit(1) : [];
  if (!budget) throw new SubmitError("Lütfen bir bütçe aralığı seçin.");

  // Dosyalar: gerçek tür magic byte ile
  const checked = files.map((f) => {
    const mime = sniffMime(f.buf);
    if (!mime || !EXT[mime]) throw new SubmitError(`${f.name}: dosya türü desteklenmiyor (PDF, PNG, JPG, WEBP).`);
    return { ...f, mime };
  });

  const version = await kvkkVersion();
  const now = new Date();
  const loc = splitLocation(input.location);
  const quoteId = randomUUID();
  const lines = input.referenceSites.split(/\s+/).filter(Boolean).slice(0, 20);

  try {
    const number = await db.transaction(async (tx) => {
      const seq = await tx.execute<{ n: string }>(sql`select nextval('quote_number_seq')::text as n`);
      const num = `LGN-${now.getFullYear()}-${String(seq.rows[0]!.n).padStart(6, "0")}`;
      await tx.insert(quoteRequests).values({
        id: quoteId,
        number: num,
        serviceKeys: active,
        companyName: input.companyName,
        projectName: input.projectName,
        currentWebsite: input.currentWebsite || null,
        sector: input.sector,
        goal: input.goal,
        needs: input.needs,
        features: input.features ? input.features.split(/\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 30) : [],
        referenceSites: lines,
        extra,
        budgetRangeId: budget.id,
        budgetLabel: budget.label,
        startTiming: input.startTiming,
        targetDate: input.targetDate || null,
        priority: input.priority || null,
        contactName: input.contactName,
        email: input.email,
        phone: input.phone,
        contactCompany: input.contactCompany || null,
        city: loc.city,
        district: loc.district,
        preferredContact: input.preferredContact,
        kvkkAcceptedAt: now,
        kvkkVersion: version,
        explicitConsentAt: input.explicitConsent ? now : null,
        idempotencyKey: input.idempotencyKey,
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
        utm: meta.utm,
        sourcePath: meta.sourcePath,
      });
      await tx.insert(quoteStatusHistory).values({ quoteId, fromStatus: null, toStatus: "new", note: "Web sitesi teklif formu" });
      for (const f of checked) {
        const key = `quotes/${quoteId}/${randomUUID()}.${EXT[f.mime]}`;
        await putFile("private", key, f.buf);
        await tx.insert(quoteAttachments).values({ quoteId, storageKey: key, originalName: f.name.replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 160), mime: f.mime, sizeBytes: f.buf.length });
      }
      return num;
    });

    const mail: QuoteMail = {
      id: quoteId,
      number,
      services: options.map((o) => o.label).join(", "),
      contactName: input.contactName,
      email: input.email,
      phone: input.phone,
      company: input.contactCompany || input.companyName,
      location: input.location,
      preferredContact: { email: "E-posta", phone: "Telefon", whatsapp: "WhatsApp" }[input.preferredContact],
      needs: input.needs,
      budget: budget.label,
      startTiming: input.startTiming,
      attachments: checked.length,
    };
    after(async () => {
      const to = await notifyAddress();
      if (to) await sendMail({ template: "quote_admin", to, ...quoteAdminMail(mail), replyTo: input.email, related: { type: "quote", id: quoteId } });
      else await sendMail({ template: "quote_admin", to: "(tanımsız)", subject: `Yeni teklif ${number}`, text: "", related: { type: "quote", id: quoteId } });
      const smtp = await getSettingUncached("smtp");
      if (smtp.sendCustomerReceipt) {
        const business = await getSettingUncached("business");
        await sendMail({ template: "quote_receipt", to: input.email, ...quoteReceiptMail(mail, business), related: { type: "quote", id: quoteId } });
      }
    });
    return { number, duplicate: false };
  } catch (e) {
    // Transaction geri alındıysa yazılmış dosyaları da temizle
    await removeDir("private", `quotes/${quoteId}`).catch(() => {});
    // Aynı anahtarla eşzamanlı iki gönderim: ikincisi unique ihlaline düşer → mevcut numarayı döndür
    const [dup] = await db.select({ number: quoteRequests.number }).from(quoteRequests).where(eq(quoteRequests.idempotencyKey, input.idempotencyKey)).limit(1);
    if (dup) return { number: dup.number, duplicate: true };
    throw e;
  }
}

export async function createLead(source: "contact" | "seo_audit", input: ContactInput | SeoAuditInput, meta: { ipHash: string | null; sourcePath: string | null }) {
  const [existing] = await db.select({ id: leads.id }).from(leads).where(eq(leads.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existing) return { id: existing.id, duplicate: true };
  const version = await kvkkVersion();
  const a = input as Partial<ContactInput & SeoAuditInput>;
  const [row] = await db
    .insert(leads)
    .values({
      source,
      name: input.name,
      company: a.company || null,
      email: input.email,
      phone: a.phone || null,
      website: a.website || null,
      goal: a.goal || null,
      subject: a.subject || null,
      message: a.message ?? "",
      kvkkAcceptedAt: new Date(),
      kvkkVersion: version,
      idempotencyKey: input.idempotencyKey,
      ipHash: meta.ipHash,
      sourcePath: meta.sourcePath,
    })
    .onConflictDoNothing({ target: leads.idempotencyKey })
    .returning({ id: leads.id });
  if (!row) {
    const [dup] = await db.select({ id: leads.id }).from(leads).where(eq(leads.idempotencyKey, input.idempotencyKey)).limit(1);
    return { id: dup!.id, duplicate: true };
  }
  after(async () => {
    const to = await notifyAddress();
    const mail = leadAdminMail({ id: row.id, source, name: input.name, email: input.email, phone: a.phone ?? "", company: a.company ?? "", website: a.website ?? "", goal: a.goal ?? "", subject: a.subject ?? "", message: a.message ?? "" });
    await sendMail({ template: `lead_${source}`, to: to ?? "(tanımsız)", ...(to ? mail : { subject: mail.subject, text: "" }), replyTo: input.email, related: { type: "lead", id: row.id } });
  });
  return { id: row.id, duplicate: false };
}
