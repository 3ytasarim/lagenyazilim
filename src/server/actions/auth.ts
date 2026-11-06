"use server";

import { redirect } from "next/navigation";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { burnVerify, hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { verifyTotp } from "@/lib/auth/totp";
import { open } from "@/lib/crypto/secret-box";
import { createSession, csrfMatches, destroyOtherSessions, destroySession, getSessionUser, hashToken } from "@/lib/auth/session";
import { sendMail } from "@/lib/email/mailer";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";
import { absoluteUrl } from "@/lib/site";
import { audit } from "@/server/services/audit";

/** email: React 19 form sıfırlamasından sonra alanın yeniden doldurulması için geri döner. */
export type AuthState = { error?: string; message?: string; email?: string; needTotp?: boolean } | null;

/* İki aşamalı giriş: parola doğruysa 5 dk geçerli, imzalı "bekleyen giriş" çerezi; oturum ancak kod doğrulanınca açılır. */
const PENDING_COOKIE = "lagen_2fa";
const PENDING_TTL_MS = 5 * 60_000;
const sign = (v: string) => createHmac("sha256", `lagen:2fa:${process.env.SESSION_SECRET ?? ""}`).update(v).digest("base64url");

async function setPending(userId: string, next: string) {
  const payload = `${userId}.${Date.now() + PENDING_TTL_MS}.${Buffer.from(next).toString("base64url")}`;
  (await cookies()).set(PENDING_COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin/", maxAge: PENDING_TTL_MS / 1000 });
}

async function readPending(): Promise<{ userId: string; next: string } | null> {
  const raw = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf(".");
  const payload = raw.slice(0, i);
  const sig = Buffer.from(raw.slice(i + 1));
  const expected = Buffer.from(sign(payload));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  const [userId, exp, next] = payload.split(".");
  if (!userId || Number(exp) < Date.now()) return null;
  return { userId, next: Buffer.from(next ?? "", "base64url").toString() };
}

const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const GENERIC = "E-posta veya parola hatalı.";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(1).max(200),
  next: z.string().max(200).optional(),
});

/** Yalnızca site içi admin yollarına dönüş (açık yönlendirme yok). */
function safeNext(v: string | undefined) {
  return v && /^\/admin\/[\w\-/]*$/.test(v) && !v.startsWith("//") ? v : "/admin/";
}

export async function login(prev: AuthState, formData: FormData): Promise<AuthState> {
  if (formData.get("step") === "code") return verifyLoginCode(prev, formData);
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  const typedEmail = String(formData.get("email") ?? "").slice(0, 160);
  if (!parsed.success) return { error: GENERIC, email: typedEmail };
  const { email, password, next } = parsed.data;
  const meta = await requestMeta();

  if (!(await rateLimit(`login:ip:${meta.ipHash ?? "?"}`, 20, 15 * 60)) || !(await rateLimit(`login:email:${email}`, 8, 15 * 60))) {
    return { error: "Çok fazla deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.", email };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.isActive) {
    await burnVerify(password);
    return { error: GENERIC, email };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await burnVerify(password);
    return { error: "Hesap geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin.", email };
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    const fails = user.failedLogins + 1;
    await db
      .update(users)
      .set({ failedLogins: fails >= MAX_FAILS ? 0 : fails, lockedUntil: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null })
      .where(eq(users.id, user.id));
    await audit({ actorId: user.id, action: fails >= MAX_FAILS ? "auth.locked" : "auth.login_failed", entityType: "user", entityId: user.id, ipHash: meta.ipHash });
    return { error: GENERIC, email };
  }

  if (user.totpSecret) {
    await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
    await setPending(user.id, safeNext(next));
    return { needTotp: true, email };
  }

  await db.update(users).set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id, meta);
  await audit({ actorId: user.id, action: "auth.login", entityType: "user", entityId: user.id, ipHash: meta.ipHash });
  redirect(safeNext(next));
}

async function verifyLoginCode(_: AuthState, formData: FormData): Promise<AuthState> {
  const pending = await readPending();
  if (!pending) return { error: "Oturum doğrulama süresi doldu. Lütfen tekrar giriş yapın." };
  const meta = await requestMeta();
  if (!(await rateLimit(`2fa:${pending.userId}`, 6, 5 * 60))) return { error: "Çok fazla hatalı kod. Lütfen birkaç dakika sonra tekrar deneyin.", needTotp: true };
  const [user] = await db.select().from(users).where(eq(users.id, pending.userId)).limit(1);
  const secret = user?.totpSecret ? open(user.totpSecret) : null;
  if (!user || !user.isActive || !secret) return { error: "Doğrulama yapılamadı. Lütfen tekrar giriş yapın." };
  const step = verifyTotp(secret, String(formData.get("code") ?? ""), user.totpLastStep);
  if (step === null) {
    await audit({ actorId: user.id, action: "auth.2fa_failed", entityType: "user", entityId: user.id, ipHash: meta.ipHash });
    return { error: "Kod hatalı veya süresi geçmiş.", needTotp: true };
  }
  // Koşullu güncelleme: aynı kod eşzamanlı iki istekte kullanılamaz
  const claimed = await db.update(users).set({ totpLastStep: step, lastLoginAt: new Date() }).where(and(eq(users.id, user.id), sql`coalesce(${users.totpLastStep}, -1) < ${step}`)).returning({ id: users.id });
  if (claimed.length === 0) return { error: "Bu kod zaten kullanıldı. Bir sonraki kodu bekleyin.", needTotp: true };
  (await cookies()).delete({ name: PENDING_COOKIE, path: "/admin/" });
  await createSession(user.id, meta);
  await audit({ actorId: user.id, action: "auth.login", entityType: "user", entityId: user.id, diff: { twoFactor: true }, ipHash: meta.ipHash });
  redirect(pending.next);
}

export async function logout(formData: FormData) {
  const user = await getSessionUser();
  if (user && csrfMatches(user, formData.get("csrf"))) {
    await audit({ actorId: user.id, action: "auth.logout", entityType: "user", entityId: user.id });
    await destroySession();
  }
  redirect("/admin/giris/");
}

/* ---------- Parola sıfırlama ---------- */

const RESET_TTL_MIN = 30;

export async function requestPasswordReset(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = z.string().trim().toLowerCase().email().max(160).safeParse(formData.get("email"));
  const done: AuthState = { message: "Bu e-posta adresi kayıtlıysa sıfırlama bağlantısı gönderildi. Bağlantı 30 dakika geçerlidir." };
  if (!email.success) return { error: "Geçerli bir e-posta adresi girin." };
  const meta = await requestMeta();
  if (!(await rateLimit(`reset:ip:${meta.ipHash ?? "?"}`, 5, 60 * 60))) return done;

  const [user] = await db.select({ id: users.id, name: users.name, isActive: users.isActive }).from(users).where(eq(users.email, email.data)).limit(1);
  if (!user || !user.isActive) return done; // hesabın varlığı açığa vurulmaz

  const token = randomBytes(32).toString("base64url");
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));
  await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MIN * 60_000) });
  const link = absoluteUrl(`/admin/sifre-sifirla/${token}/`);
  await sendMail({
    template: "password_reset",
    to: email.data,
    subject: "Lagen Yazılım yönetim paneli — parola sıfırlama",
    text: `Merhaba ${user.name},\n\nParolanızı sıfırlamak için aşağıdaki bağlantıyı ${RESET_TTL_MIN} dakika içinde açın:\n${link}\n\nBu isteği siz yapmadıysanız e-postayı yok sayabilirsiniz.`,
    related: { type: "user", id: user.id },
  });
  await audit({ actorId: user.id, action: "auth.reset_requested", entityType: "user", entityId: user.id, ipHash: meta.ipHash });
  return done;
}

export async function resetPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  if (password !== confirm) return { error: "Parolalar eşleşmiyor." };

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.tokenHash, hashToken(token)), isNull(passwordResetTokens.usedAt), gt(passwordResetTokens.expiresAt, new Date())))
    .limit(1);
  if (!row) return { error: "Bağlantı geçersiz veya süresi dolmuş. Yeni bir sıfırlama isteği oluşturun." };

  // Tek kullanımlık: koşullu güncelleme ile yarış durumunda ikinci kullanım engellenir
  const used = await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.id, row.id), isNull(passwordResetTokens.usedAt)))
    .returning({ id: passwordResetTokens.id });
  if (used.length === 0) return { error: "Bağlantı zaten kullanılmış." };

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null, updatedAt: sql`now()` })
    .where(eq(users.id, row.userId));
  await destroyOtherSessions(row.userId);
  await audit({ actorId: row.userId, action: "auth.password_reset", entityType: "user", entityId: row.userId });
  return { message: "Parolanız güncellendi. Yeni parolanızla giriş yapabilirsiniz." };
}
