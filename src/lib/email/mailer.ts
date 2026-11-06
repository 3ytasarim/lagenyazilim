import "server-only";
import nodemailer from "nodemailer";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { open } from "@/lib/crypto/secret-box";
import { getSettingUncached, type SmtpSettings } from "@/lib/settings";

/**
 * Tüm e-postalar önce `notifications` tablosuna yazılır, sonra gönderilir.
 * SMTP tanımlı değilse kayıt "skipped" olur; gönderim hatası ana işlemi (teklif kaydı vb.) asla geri almaz.
 */

type Mail = { template: string; to: string; subject: string; text: string; html?: string; replyTo?: string; related?: { type: string; id: string } };

async function smtpConfig(): Promise<(SmtpSettings & { pass: string }) | null> {
  // Ortam değişkenleri öncelikli, yoksa admin ayarları
  if (process.env.SMTP_HOST) {
    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465 ? "ssl" : "starttls",
      user: process.env.SMTP_USER ?? "",
      pass: process.env.SMTP_PASS ?? "",
      passSealed: "",
      from: process.env.SMTP_FROM ?? "",
      notifyTo: process.env.NOTIFY_TO ?? "",
      sendCustomerReceipt: true,
    };
  }
  const s = await getSettingUncached("smtp");
  if (!s.host || !s.from) return null;
  return { ...s, pass: s.passSealed ? (open(s.passSealed) ?? "") : "" };
}

export async function notifyAddress(): Promise<string | null> {
  const c = await smtpConfig();
  return c?.notifyTo || null;
}

export async function sendMail(mail: Mail): Promise<"sent" | "failed" | "skipped"> {
  const [row] = await db
    .insert(notifications)
    .values({ template: mail.template, recipient: mail.to, subject: mail.subject, relatedType: mail.related?.type, relatedId: mail.related?.id })
    .returning({ id: notifications.id });
  const id = row!.id;

  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(mail.to)) {
    await db.update(notifications).set({ status: "skipped", lastError: "Alıcı adresi tanımlı değil (Site ayarları › E-posta)" }).where(eq(notifications.id, id));
    return "skipped";
  }
  const cfg = await smtpConfig();
  if (!cfg) {
    await db.update(notifications).set({ status: "skipped", lastError: "SMTP yapılandırılmamış" }).where(eq(notifications.id, id));
    return "skipped";
  }
  try {
    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure === "ssl",
      requireTLS: cfg.secure === "starttls",
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
      tls: { minVersion: "TLSv1.2" },
      connectionTimeout: 15_000,
    });
    await transport.sendMail({ from: cfg.from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html, replyTo: mail.replyTo });
    await db.update(notifications).set({ status: "sent", sentAt: new Date(), attempts: sql`${notifications.attempts} + 1` }).where(eq(notifications.id, id));
    return "sent";
  } catch (e) {
    await db
      .update(notifications)
      .set({ status: "failed", attempts: sql`${notifications.attempts} + 1`, lastError: String(e instanceof Error ? e.message : e).slice(0, 500) })
      .where(eq(notifications.id, id));
    return "failed";
  }
}
