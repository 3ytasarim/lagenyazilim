"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { popups } from "@/lib/db/schema";
import { SITE_URL } from "@/lib/site";
import { audit } from "@/server/services/audit";
import { bool, invalidate, optStr, str } from "@/server/services/content";
import { ActionError, guard, run, type ActionResult } from "./_guard";

/** "2026-11-06T10:00" (Türkiye saati, datetime-local) → Date. Türkiye UTC+3, yaz saati yok. */
function parseTrDateTime(v: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function savePopup(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const errors: Record<string, string> = {};
    const title = str(fd, "title");
    if (!title) errors.title = "Başlık zorunlu (yalnızca panelde görünür).";
    const imageId = str(fd, "imageId") || null;
    if (!imageId) errors.imageId = "Bir görsel seçin.";
    const alt = str(fd, "alt");
    if (!alt) errors.alt = "Görseldeki metni özetleyen alt metin zorunlu (ekran okuyucular için).";
    const startsAt = parseTrDateTime(str(fd, "startsAt"));
    const endsAt = parseTrDateTime(str(fd, "endsAt"));
    if (!startsAt) errors.startsAt = "Geçerli bir başlangıç tarihi girin.";
    if (!endsAt) errors.endsAt = "Geçerli bir bitiş tarihi girin.";
    if (startsAt && endsAt && endsAt <= startsAt) errors.endsAt = "Bitiş, başlangıçtan sonra olmalı.";

    let linkUrl = optStr(fd, "linkUrl");
    if (linkUrl) {
      try {
        const u = new URL(linkUrl, SITE_URL);
        // Yalnızca site içi bağlantı (dış adrese yönlendiren duyuru kötüye kullanılabilir)
        if (u.origin !== new URL(SITE_URL).origin) errors.linkUrl = "Bağlantı bu sitede bir adres olmalı (ör. /hizmetlerimiz/).";
        else linkUrl = u.pathname + u.search;
      } catch {
        errors.linkUrl = "Geçerli bir adres girin.";
      }
    }
    const linkLabel = optStr(fd, "linkLabel")?.slice(0, 60) ?? null;
    if (linkUrl && !linkLabel) errors.linkLabel = "Buton metni girin.";
    const delayMs = Math.min(15000, Math.max(1500, Number(str(fd, "delayMs")) * 1000 || 2500));
    if (Object.keys(errors).length) return { ok: false, message: "Lütfen işaretli alanları düzeltin.", fieldErrors: errors };

    const values = { title: title.slice(0, 120), imageId, alt: alt.slice(0, 300), linkUrl, linkLabel, startsAt: startsAt!, endsAt: endsAt!, isActive: bool(fd, "isActive"), delayMs, updatedAt: new Date() };
    if (id) await db.update(popups).set(values).where(eq(popups.id, id));
    else await db.insert(popups).values(values);
    await audit({ actorId: user.id, action: id ? "popup.update" : "popup.create", entityType: "popup", entityId: id, diff: { title: values.title, startsAt: values.startsAt, endsAt: values.endsAt, isActive: values.isActive }, ipHash });
    invalidate("popups");
    return { ok: true, message: "Duyuru kaydedildi." };
  });
}

export async function deletePopup(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const id = str(fd, "id");
    const [r] = await db.delete(popups).where(eq(popups.id, id)).returning();
    if (!r) throw new ActionError("Duyuru bulunamadı.");
    await audit({ actorId: user.id, action: "popup.delete", entityType: "popup", entityId: id, diff: { title: r.title }, ipHash });
    invalidate("popups");
    return { ok: true, message: "Silindi." };
  });
}
