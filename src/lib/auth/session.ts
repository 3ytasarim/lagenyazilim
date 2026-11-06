import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { can, type Permission, type Role } from "./permissions";

export const SESSION_COOKIE = "lagen_admin";
const TTL_MS = 1000 * 60 * 60 * 12; // 12 saat, kullanıldıkça uzar
const RENEW_AFTER_MS = 1000 * 60 * 30;

export type SessionUser = { id: string; name: string; email: string; role: Role; sessionId: string; csrfToken: string };

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function createSession(userId: string, meta: { ipHash: string | null; userAgent: string | null }) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(sessions).values({
    userId,
    tokenHash: sha256(token),
    csrfToken: randomBytes(24).toString("base64url"),
    ipHash: meta.ipHash,
    userAgent: meta.userAgent,
    expiresAt,
  });
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** İstek başına tek sorgu (React cache). Asıl yetki kontrolü her zaman sunucuda, veritabanındaki oturuma karşı yapılır. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      sessionId: sessions.id,
      csrfToken: sessions.csrfToken,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.isActive) return null;
  // Kayan süre: yarım saatte bir uzat (her istekte yazma yapma)
  if (row.expiresAt.getTime() - Date.now() < TTL_MS - RENEW_AFTER_MS) {
    await db.update(sessions).set({ expiresAt: new Date(Date.now() + TTL_MS) }).where(eq(sessions.id, row.sessionId));
  }
  return { id: row.id, name: row.name, email: row.email, role: row.role, sessionId: row.sessionId, csrfToken: row.csrfToken };
});

/** Her admin sayfasının ve her server action'ın ilk satırı. */
export async function requireUser(perm: Permission = "dashboard"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/giris/");
  if (!can(user.role, perm)) redirect("/admin/?yetki=yok");
  return user;
}

export function csrfMatches(user: SessionUser, provided: unknown): boolean {
  if (typeof provided !== "string" || provided.length !== user.csrfToken.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(user.csrfToken));
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
  store.delete(SESSION_COOKIE);
}

/** Parola değişince diğer cihazlardaki oturumları kapat. */
export async function destroyOtherSessions(userId: string, keepSessionId?: string) {
  await db.delete(sessions).where(and(eq(sessions.userId, userId), keepSessionId ? ne(sessions.id, keepSessionId) : undefined));
}

export const hashToken = sha256;
