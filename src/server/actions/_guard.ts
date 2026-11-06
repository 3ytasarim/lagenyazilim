import "server-only";
import { csrfMatches, requireUser, type SessionUser } from "@/lib/auth/session";
import type { Permission } from "@/lib/auth/permissions";
import { requestMeta } from "@/lib/request-meta";

export class ActionError extends Error {}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; message: string; fieldErrors?: Record<string, string> };

/**
 * Admin server action'larının ortak girişi: oturum + yetki + CSRF.
 * CSRF token'ı oturuma bağlıdır; formlarda <CsrfField/>, istemci çağrılarında `csrf` parametresiyle gelir.
 */
export async function guard(perm: Permission, csrf: unknown): Promise<{ user: SessionUser; ipHash: string | null }> {
  const user = await requireUser(perm);
  if (!csrfMatches(user, csrf)) throw new ActionError("Oturum doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.");
  const { ipHash } = await requestMeta();
  return { user, ipHash };
}

export function zodErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = i.path.map(String).join(".");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

/** Beklenmeyen hataları kullanıcıya genel mesajla döndürür, ayrıntıyı sunucu loguna yazar. */
export async function run<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, message: e.message };
    // redirect()/notFound() Next tarafından fırlatılan özel hatalardır; yeniden fırlat
    if (e && typeof e === "object" && "digest" in e && typeof (e as { digest: unknown }).digest === "string" && String((e as { digest: string }).digest).startsWith("NEXT_")) throw e;
    console.error("[action]", e);
    return { ok: false, message: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." };
  }
}
