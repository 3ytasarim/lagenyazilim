"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { redirectRules } from "@/lib/db/schema";
import { normalizePath } from "@/lib/redirects/legacy";
import { SITE_URL } from "@/lib/site";
import { audit } from "@/server/services/audit";
import { bool, invalidate, optStr, str } from "@/server/services/content";
import { ActionError, guard, run, type ActionResult } from "./_guard";

const PROTECTED = ["/admin/", "/_next/", "/media/", "/api/"];

export async function saveRedirect(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("seo", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const errors: Record<string, string> = {};
    const rawFrom = str(fd, "fromPath");
    if (!rawFrom.startsWith("/")) errors.fromPath = "Eski adres / ile başlamalı (ör. /eski-sayfa/).";
    const from = normalizePath(rawFrom);
    if (PROTECTED.some((p) => from.startsWith(p)) || from === "/") errors.fromPath = "Bu adres yönlendirilemez.";
    const status = [301, 302, 308, 410].includes(Number(str(fd, "statusCode"))) ? Number(str(fd, "statusCode")) : 301;

    let to = "";
    if (status !== 410) {
      const raw = str(fd, "toPath");
      try {
        const u = new URL(raw, SITE_URL);
        // Yalnızca site içi hedef: açık yönlendirme (open redirect) engellenir
        if (u.origin !== new URL(SITE_URL).origin) errors.toPath = "Hedef bu sitede bir adres olmalı.";
        else to = (u.pathname.endsWith("/") || /\.[a-z0-9]{2,5}$/.test(u.pathname) ? u.pathname : `${u.pathname}/`) + u.search;
      } catch {
        errors.toPath = "Geçerli bir hedef adres girin.";
      }
      if (!raw) errors.toPath = "Hedef adres zorunlu.";
      if (to && normalizePath(to.split("?")[0]!) === from) errors.toPath = "Kaynak ve hedef aynı olamaz.";
    }
    if (Object.keys(errors).length) return { ok: false, message: "Lütfen işaretli alanları düzeltin.", fieldErrors: errors };

    // Döngü / zincir kontrolü: hedef başka bir kuralın kaynağıysa zinciri takip et
    const rules = await db.select({ from: redirectRules.fromPath, to: redirectRules.toPath, status: redirectRules.statusCode, id: redirectRules.id }).from(redirectRules).where(eq(redirectRules.isActive, true));
    const map = new Map(rules.filter((r) => r.id !== id).map((r) => [r.from, r]));
    let cursor = to ? normalizePath(to.split("?")[0]!) : "";
    for (let hop = 0; cursor && hop < 10; hop++) {
      if (cursor === from) return { ok: false, message: "Bu kural bir yönlendirme döngüsü oluşturur.", fieldErrors: { toPath: "Döngü" } };
      const next = map.get(cursor);
      if (!next || next.status === 410) break;
      cursor = normalizePath(next.to.split("?")[0]!);
    }

    const values = { fromPath: from, toPath: status === 410 ? "" : to, statusCode: status, isActive: bool(fd, "isActive"), note: optStr(fd, "note")?.slice(0, 300) ?? null };
    try {
      if (id) await db.update(redirectRules).set(values).where(eq(redirectRules.id, id));
      else await db.insert(redirectRules).values(values);
    } catch {
      throw new ActionError("Bu eski adres için zaten bir kural var.");
    }
    // Zincir kısaltma: bu kuralın kaynağına giden kuralları doğrudan yeni hedefe bağla
    if (status !== 410) await db.update(redirectRules).set({ toPath: to }).where(eq(redirectRules.toPath, from));
    await audit({ actorId: user.id, action: id ? "redirect.update" : "redirect.create", entityType: "redirect", entityId: id, diff: values, ipHash });
    invalidate("redirects");
    return { ok: true, message: "Yönlendirme kaydedildi (en geç 60 sn içinde devreye girer)." };
  });
}

export async function deleteRedirect(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("seo", fd.get("csrf"));
    const id = str(fd, "id");
    const [r] = await db.delete(redirectRules).where(eq(redirectRules.id, id)).returning();
    if (!r) throw new ActionError("Kural bulunamadı.");
    await audit({ actorId: user.id, action: "redirect.delete", entityType: "redirect", entityId: id, diff: { from: r.fromPath, to: r.toPath }, ipHash });
    return { ok: true, message: "Silindi." };
  });
}
