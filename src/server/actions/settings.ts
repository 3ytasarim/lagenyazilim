"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { seal } from "@/lib/crypto/secret-box";
import { sendMail } from "@/lib/email/mailer";
import { getSettingUncached } from "@/lib/settings";
import { TR_PHONE } from "@/lib/validation/quote";
import { audit } from "@/server/services/audit";
import { CACHE_TAGS, invalidate, json, optStr, str } from "@/server/services/content";
import { ActionError, guard, run, zodErrors, type ActionResult } from "./_guard";

async function put(key: string, value: unknown, userId: string) {
  await db
    .insert(siteSettings)
    .values({ key, value, updatedById: userId })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedById: userId, updatedAt: new Date() } });
}

const businessSchema = z.object({
  name: z.string().trim().min(2, "Firma adı zorunlu.").max(120),
  legalName: z.string().trim().max(200).nullable(),
  slogan: z.string().trim().max(160),
  phone: z.string().trim().regex(TR_PHONE, "Geçerli bir telefon girin."),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin."),
  whatsapp: z.string().trim().regex(TR_PHONE, "Geçerli bir WhatsApp numarası girin."),
  street: z.string().trim().max(200),
  neighborhood: z.string().trim().max(120),
  district: z.string().trim().max(80),
  city: z.string().trim().max(80),
  postalCode: z.string().trim().regex(/^(\d{5})?$/, "Posta kodu 5 haneli olmalı.").nullable(),
  openingHours: z.string().trim().max(200).nullable(),
  mapsUrl: z.string().trim().url("Geçerli bir adres girin.").nullable(),
});

/** "0533 285 70 90" → "+905332857090" */
function e164(tr: string) {
  const d = tr.replace(/\D/g, "").replace(/^90/, "").replace(/^0/, "");
  return `+90${d}`;
}

export async function saveBusiness(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("settings", fd.get("csrf"));
    const parsed = businessSchema.safeParse({
      name: str(fd, "name"),
      legalName: optStr(fd, "legalName"),
      slogan: str(fd, "slogan"),
      phone: str(fd, "phone"),
      email: str(fd, "email"),
      whatsapp: str(fd, "whatsapp") || str(fd, "phone"),
      street: str(fd, "street"),
      neighborhood: str(fd, "neighborhood"),
      district: str(fd, "district"),
      city: str(fd, "city"),
      postalCode: optStr(fd, "postalCode"),
      openingHours: optStr(fd, "openingHours"),
      mapsUrl: optStr(fd, "mapsUrl"),
    });
    if (!parsed.success) return { ok: false, message: "Lütfen işaretli alanları düzeltin.", fieldErrors: zodErrors(parsed.error.issues) };
    const b = parsed.data;
    const social = json<{ title: string; text: string }[]>(fd, "social", [])
      .map((s) => ({ label: String(s.title).trim().slice(0, 40), href: String(s.text).trim() }))
      .filter((s) => s.label && /^https:\/\//.test(s.href))
      .slice(0, 10);
    const value = {
      name: b.name,
      legalName: b.legalName,
      slogan: b.slogan,
      phone: b.phone,
      phoneE164: e164(b.phone),
      whatsappE164: e164(b.whatsapp).slice(1),
      email: b.email,
      address: { street: b.street, neighborhood: b.neighborhood, district: b.district, city: b.city, postalCode: b.postalCode },
      openingHours: b.openingHours,
      mapsUrl: b.mapsUrl,
      social,
    };
    await put("business", value, user.id);
    await audit({ actorId: user.id, action: "settings.business", entityType: "setting", entityId: "business", diff: { name: b.name, district: b.district }, ipHash });
    invalidate(CACHE_TAGS.settings);
    return { ok: true, message: "Firma bilgileri kaydedildi; site genelinde güncellendi." };
  });
}

export async function saveSeoSettings(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("settings", fd.get("csrf"));
    const token = (k: string) => str(fd, k).replace(/[^\w-]/g, "").slice(0, 100);
    const gbp = optStr(fd, "gbpUrl");
    if (gbp && !/^https:\/\//.test(gbp)) return { ok: false, message: "Geçersiz bağlantı.", fieldErrors: { gbpUrl: "https:// ile başlayan bir adres girin." } };
    const provider = ["none", "ga4", "umami"].includes(str(fd, "provider")) ? str(fd, "provider") : "none";
    const ga4Id = str(fd, "ga4Id");
    if (provider === "ga4" && !/^G-[A-Z0-9]{6,12}$/.test(ga4Id)) return { ok: false, message: "GA4 ölçüm kimliği geçersiz.", fieldErrors: { ga4Id: "Biçim: G-XXXXXXX" } };
    await put("seo", { googleSiteVerification: token("googleSiteVerification"), bingSiteVerification: token("bingSiteVerification"), gbpUrl: gbp ?? "" }, user.id);
    await put("analytics", { provider, ga4Id, umamiUrl: optStr(fd, "umamiUrl") ?? "", umamiSiteId: token("umamiSiteId") }, user.id);
    await audit({ actorId: user.id, action: "settings.seo", entityType: "setting", entityId: "seo", diff: { provider }, ipHash });
    invalidate(CACHE_TAGS.settings);
    return { ok: true, message: "SEO ve analitik ayarları kaydedildi." };
  });
}

export async function saveSmtp(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("settings", fd.get("csrf"));
    const current = await getSettingUncached("smtp");
    const port = Number(str(fd, "port"));
    if (!Number.isInteger(port) || port < 1 || port > 65535) return { ok: false, message: "Port geçersiz.", fieldErrors: { port: "1–65535 arası" } };
    const email = z.string().email();
    const from = str(fd, "from");
    const notifyTo = str(fd, "notifyTo");
    if (from && !/<[^>]+@[^>]+>|^[^\s@]+@[^\s@]+$/.test(from)) return { ok: false, message: "Gönderen adresi geçersiz.", fieldErrors: { from: "Ör. Lagen Yazılım <info@lagenyazilim.com.tr>" } };
    if (notifyTo && !email.safeParse(notifyTo).success) return { ok: false, message: "Bildirim adresi geçersiz.", fieldErrors: { notifyTo: "Geçerli bir e-posta girin." } };
    const pass = String(fd.get("pass") ?? "");
    const secure = ["ssl", "starttls", "none"].includes(str(fd, "secure")) ? (str(fd, "secure") as "ssl" | "starttls" | "none") : "starttls";
    await put(
      "smtp",
      {
        host: str(fd, "host").slice(0, 200),
        port,
        secure,
        user: str(fd, "user").slice(0, 200),
        // Parola alanı boş bırakılırsa mevcut parola korunur
        passSealed: pass ? seal(pass) : current.passSealed,
        from,
        notifyTo,
        sendCustomerReceipt: fd.get("sendCustomerReceipt") === "1",
      },
      user.id,
    );
    await audit({ actorId: user.id, action: "settings.smtp", entityType: "setting", entityId: "smtp", diff: { host: str(fd, "host"), passwordChanged: !!pass }, ipHash });
    return { ok: true, message: "SMTP ayarları kaydedildi." };
  });
}

export async function sendTestMail(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user } = await guard("settings", fd.get("csrf"));
    const result = await sendMail({ template: "smtp_test", to: user.email, subject: "Lagen Yazılım — SMTP testi", text: "Bu bir test e-postasıdır. SMTP ayarlarınız çalışıyor." });
    if (result === "sent") return { ok: true, message: `Test e-postası ${user.email} adresine gönderildi.` };
    if (result === "skipped") throw new ActionError("SMTP yapılandırılmamış (sunucu adresi ve gönderen gerekli).");
    throw new ActionError("Gönderim başarısız. Ayrıntı için İşlem kaydı / bildirimler tablosuna bakın.");
  });
}
