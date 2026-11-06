"use server";

import { randomBytes } from "node:crypto";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { passwordResetTokens, sessions, users } from "@/lib/db/schema";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { destroyOtherSessions, hashToken } from "@/lib/auth/session";
import { sendMail } from "@/lib/email/mailer";
import { absoluteUrl } from "@/lib/site";
import { audit } from "@/server/services/audit";
import { str } from "@/server/services/content";
import { ActionError, guard, run, type ActionResult } from "./_guard";

const ROLES = ["super_admin", "editor", "sales"] as const;
const INVITE_TTL_H = 48;

async function superAdminCount(excludeId?: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(and(eq(users.role, "super_admin"), eq(users.isActive, true), excludeId ? ne(users.id, excludeId) : undefined));
  return r?.n ?? 0;
}

/**
 * Yeni kullanıcı: kullanılamaz rastgele parola + davet (parola belirleme) bağlantısı.
 * Parola hiçbir zaman ekranda veya e-postada düz metin olarak dolaşmaz.
 * SMTP yoksa bağlantı yalnızca bu yanıtla bir kez gösterilir.
 */
export async function inviteUser(fd: FormData): Promise<ActionResult<{ link?: string }>> {
  return run(async () => {
    const { user: actor, ipHash } = await guard("users", fd.get("csrf"));
    const parsed = z
      .object({ name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email(), role: z.enum(ROLES) })
      .safeParse({ name: str(fd, "name"), email: str(fd, "email"), role: str(fd, "role") });
    if (!parsed.success) return { ok: false, message: "Ad, geçerli e-posta ve rol gerekli." };
    const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
    if (exists.length) throw new ActionError("Bu e-posta ile bir kullanıcı zaten var.");

    const [u] = await db
      .insert(users)
      .values({ ...parsed.data, passwordHash: await hashPassword(randomBytes(32).toString("hex")) })
      .returning({ id: users.id });
    const token = randomBytes(32).toString("base64url");
    await db.insert(passwordResetTokens).values({ userId: u!.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + INVITE_TTL_H * 3600_000) });
    const link = absoluteUrl(`/admin/sifre-sifirla/${token}/`);
    const sent = await sendMail({
      template: "user_invite",
      to: parsed.data.email,
      subject: "Lagen Yazılım yönetim paneline davet edildiniz",
      text: `Merhaba ${parsed.data.name},\n\nYönetim paneline erişiminiz oluşturuldu. Parolanızı ${INVITE_TTL_H} saat içinde aşağıdaki bağlantıdan belirleyin:\n${link}`,
      related: { type: "user", id: u!.id },
    });
    await audit({ actorId: actor.id, action: "user.invite", entityType: "user", entityId: u!.id, diff: { role: parsed.data.role, emailSent: sent }, ipHash });
    return sent === "sent"
      ? { ok: true, message: "Davet e-postası gönderildi." }
      : { ok: true, message: "Kullanıcı oluşturuldu. SMTP yapılandırılmadığı için davet bağlantısını kendiniz iletin (bir kez gösterilir).", data: { link } };
  });
}

export async function updateUser(fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const { user: actor, ipHash } = await guard("users", fd.get("csrf"));
    const id = str(fd, "id");
    const role = str(fd, "role") as (typeof ROLES)[number];
    if (!ROLES.includes(role)) throw new ActionError("Geçersiz rol.");
    const isActive = fd.get("isActive") === "1";
    const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!target) throw new ActionError("Kullanıcı bulunamadı.");
    if (target.role === "super_admin" && (role !== "super_admin" || !isActive) && (await superAdminCount(id)) === 0) {
      throw new ActionError("Son aktif süper yönetici kaldırılamaz veya yetkisi düşürülemez.");
    }
    if (id === actor.id && !isActive) throw new ActionError("Kendi hesabınızı pasifleştiremezsiniz.");
    await db.update(users).set({ role, isActive, name: str(fd, "name").slice(0, 120) || target.name }).where(eq(users.id, id));
    if (!isActive) await db.delete(sessions).where(eq(sessions.userId, id));
    await audit({ actorId: actor.id, action: "user.update", entityType: "user", entityId: id, diff: { role: { from: target.role, to: role }, isActive: { from: target.isActive, to: isActive } }, ipHash });
    return { ok: true, message: "Kullanıcı güncellendi." };
  });
}

export async function changeOwnPassword(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("dashboard", fd.get("csrf"));
    const current = String(fd.get("current") ?? "");
    const next = String(fd.get("password") ?? "");
    if (next !== String(fd.get("confirm") ?? "")) return { ok: false, message: "Yeni parolalar eşleşmiyor.", fieldErrors: { confirm: "Eşleşmiyor." } };
    const problem = passwordProblem(next);
    if (problem) return { ok: false, message: problem, fieldErrors: { password: problem } };
    const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!row || !(await verifyPassword(row.passwordHash, current))) return { ok: false, message: "Mevcut parola hatalı.", fieldErrors: { current: "Hatalı." } };
    await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, user.id));
    await destroyOtherSessions(user.id, user.sessionId);
    await audit({ actorId: user.id, action: "auth.password_changed", entityType: "user", entityId: user.id, ipHash });
    return { ok: true, message: "Parolanız güncellendi; diğer cihazlardaki oturumlar kapatıldı." };
  });
}

/* ---------- İki aşamalı doğrulama (TOTP) ---------- */

const SETUP_COOKIE = "lagen_2fa_setup";

/** Kurulumu başlatır: sır üretir, şifreli olarak kısa ömürlü çerezde tutar, QR kodu döndürür. Onaylanana kadar hesaba yazılmaz. */
export async function startTotpSetup(fd: FormData): Promise<ActionResult<{ qr: string; secret: string }>> {
  return run(async () => {
    const { user } = await guard("dashboard", fd.get("csrf"));
    const { generateTotpSecret, otpauthUri } = await import("@/lib/auth/totp");
    const { seal } = await import("@/lib/crypto/secret-box");
    const QR = (await import("qrcode")).default;
    const { cookies } = await import("next/headers");
    const secret = generateTotpSecret();
    (await cookies()).set(SETUP_COOKIE, seal(`${user.id}:${secret}`), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin/", maxAge: 600 });
    const qr = await QR.toDataURL(otpauthUri(secret, user.email), { margin: 1, width: 220 });
    return { ok: true, data: { qr, secret } };
  });
}

export async function confirmTotpSetup(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("dashboard", fd.get("csrf"));
    const { verifyTotp } = await import("@/lib/auth/totp");
    const { open, seal } = await import("@/lib/crypto/secret-box");
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const raw = store.get(SETUP_COOKIE)?.value;
    const plain = raw ? open(raw) : null;
    const [uid, secret] = plain?.split(":") ?? [];
    if (!secret || uid !== user.id) throw new ActionError("Kurulum süresi doldu. Yeniden başlatın.");
    const step = verifyTotp(secret, str(fd, "code"), null);
    if (step === null) return { ok: false, message: "Kod hatalı. Uygulamadaki güncel kodu girin.", fieldErrors: { code: "Hatalı kod" } };
    await db.update(users).set({ totpSecret: seal(secret), totpLastStep: step }).where(eq(users.id, user.id));
    store.delete({ name: SETUP_COOKIE, path: "/admin/" });
    await destroyOtherSessions(user.id, user.sessionId);
    await audit({ actorId: user.id, action: "auth.2fa_enabled", entityType: "user", entityId: user.id, ipHash });
    return { ok: true, message: "İki aşamalı doğrulama açıldı. Diğer cihazlardaki oturumlar kapatıldı." };
  });
}

export async function disableTotp(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("dashboard", fd.get("csrf"));
    const { verifyTotp } = await import("@/lib/auth/totp");
    const { open } = await import("@/lib/crypto/secret-box");
    const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!row?.totpSecret) return { ok: true, message: "Zaten kapalı." };
    if (!(await verifyPassword(row.passwordHash, String(fd.get("password") ?? "")))) return { ok: false, message: "Parola hatalı.", fieldErrors: { password: "Hatalı" } };
    const secret = open(row.totpSecret);
    if (!secret || verifyTotp(secret, str(fd, "code"), row.totpLastStep) === null) return { ok: false, message: "Kod hatalı.", fieldErrors: { code: "Hatalı kod" } };
    await db.update(users).set({ totpSecret: null, totpLastStep: null }).where(eq(users.id, user.id));
    await audit({ actorId: user.id, action: "auth.2fa_disabled", entityType: "user", entityId: user.id, ipHash });
    return { ok: true, message: "İki aşamalı doğrulama kapatıldı." };
  });
}

/** Telefonunu kaybeden kullanıcı için: süper yönetici başka bir kullanıcının 2FA'sını sıfırlar. */
export async function resetUserTotp(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user: actor, ipHash } = await guard("users", fd.get("csrf"));
    const id = str(fd, "id");
    if (id === actor.id) throw new ActionError("Kendi 2FA ayarınızı Hesabım sayfasından yönetin.");
    const r = await db.update(users).set({ totpSecret: null, totpLastStep: null }).where(eq(users.id, id)).returning({ id: users.id });
    if (!r.length) throw new ActionError("Kullanıcı bulunamadı.");
    await db.delete(sessions).where(eq(sessions.userId, id));
    await audit({ actorId: actor.id, action: "user.2fa_reset", entityType: "user", entityId: id, ipHash });
    return { ok: true, message: "Kullanıcının 2FA ayarı sıfırlandı ve oturumları kapatıldı." };
  });
}
