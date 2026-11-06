import "server-only";
import { updateTag } from "next/cache";
import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { contentRevisions, redirectRules } from "@/lib/db/schema";
import { renderRichHtml } from "@/lib/content/html";
import { SITE_URL } from "@/lib/site";

export const CACHE_TAGS = { services: "services", posts: "posts", projects: "projects", pages: "pages", taxonomy: "taxonomy", settings: "settings", redirects: "redirects" } as const;

export function invalidate(...tags: string[]) {
  for (const t of tags) updateTag(t);
}

/* ---------- Form ayrıştırma yardımcıları ---------- */

export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const optStr = (fd: FormData, k: string) => str(fd, k) || null;
export const bool = (fd: FormData, k: string) => fd.get(k) === "1" || fd.get(k) === "on";
export function json<T>(fd: FormData, k: string, fallback: T): T {
  try {
    const v = fd.get(k);
    return v ? (JSON.parse(String(v)) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugSchema = z.string().min(2, "Slug en az 2 karakter olmalı.").max(96).regex(SLUG_RE, "Slug yalnızca küçük harf, rakam ve tire içerebilir.");

/** datetime-local değeri Türkiye saati (UTC+3, yaz saati uygulaması yok) olarak yorumlanır. */
export function parseLocalDateTime(v: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
export function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  const t = new Date(d.getTime() + 3 * 3600_000);
  return t.toISOString().slice(0, 16);
}

export type PublishInput = { status: "draft" | "review" | "published" | "archived"; publishedAt: Date | null };

/** Yayın durumu: "published" + boş tarih → şimdi; ileri tarih → zamanlanmış yayın. */
export function publishFromForm(fd: FormData, current?: { status: string; publishedAt: Date | null }): PublishInput {
  const raw = str(fd, "status");
  const status = (["draft", "review", "published", "archived"].includes(raw) ? raw : "draft") as PublishInput["status"];
  const at = parseLocalDateTime(str(fd, "publishedAt"));
  if (status === "published") return { status, publishedAt: at ?? current?.publishedAt ?? new Date() };
  return { status, publishedAt: at ?? current?.publishedAt ?? null };
}

export type SeoInput = {
  seoTitle: string | null;
  seoDescription: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string[];
  canonicalOverride: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  ogImageId: string | null;
};

/** SEO alanları. Canonical override yalnızca bu sitenin bir yolu olabilir (çapraz domain engellenir). */
export function seoFromForm(fd: FormData, errors: Record<string, string>): SeoInput {
  let canonical = optStr(fd, "canonicalOverride");
  if (canonical) {
    try {
      const u = new URL(canonical, SITE_URL);
      if (u.origin !== new URL(SITE_URL).origin) errors.canonicalOverride = "Canonical yalnızca bu sitedeki bir adres olabilir.";
      else if (!u.pathname.endsWith("/")) errors.canonicalOverride = "Adres sonda \"/\" ile bitmeli.";
      else canonical = u.pathname;
    } catch {
      errors.canonicalOverride = "Geçerli bir adres girin.";
    }
  }
  const ogImageId = optStr(fd, "ogImageId");
  return {
    seoTitle: optStr(fd, "seoTitle")?.slice(0, 120) ?? null,
    seoDescription: optStr(fd, "seoDescription")?.slice(0, 320) ?? null,
    focusKeyword: optStr(fd, "focusKeyword")?.slice(0, 120) ?? null,
    secondaryKeywords: json<string[]>(fd, "secondaryKeywords", []).filter((x) => typeof x === "string").slice(0, 30),
    canonicalOverride: canonical,
    robotsIndex: bool(fd, "robotsIndex"),
    robotsFollow: bool(fd, "robotsFollow"),
    ogImageId: ogImageId && /^[0-9a-f-]{36}$/.test(ogImageId) ? ogImageId : null,
  };
}

/** Editörden gelen gövde: JSON (yeniden düzenleme) + temizlenmiş HTML + içindekiler. */
export function bodyFromForm(fd: FormData, field = "body") {
  const raw = String(fd.get(`${field}Html`) ?? "");
  const { html, toc } = renderRichHtml(raw.length > 400_000 ? raw.slice(0, 400_000) : raw);
  return { body: json<unknown>(fd, `${field}Json`, null), bodyHtml: html, toc };
}

/* ---------- Revizyonlar ---------- */

const KEEP_REVISIONS = 30;

export async function saveRevision(entityType: string, entityId: string, snapshot: Record<string, unknown>, userId: string, note?: string) {
  await db.insert(contentRevisions).values({ entityType, entityId, snapshot, createdById: userId, note: note ?? null });
  const old = await db
    .select({ id: contentRevisions.id })
    .from(contentRevisions)
    .where(and(eq(contentRevisions.entityType, entityType), eq(contentRevisions.entityId, entityId)))
    .orderBy(desc(contentRevisions.createdAt))
    .offset(KEEP_REVISIONS);
  if (old.length) await db.delete(contentRevisions).where(inArray(contentRevisions.id, old.map((o) => o.id)));
}

export async function listRevisions(entityType: string, entityId: string) {
  return db
    .select({ id: contentRevisions.id, createdAt: contentRevisions.createdAt, note: contentRevisions.note, createdById: contentRevisions.createdById })
    .from(contentRevisions)
    .where(and(eq(contentRevisions.entityType, entityType), eq(contentRevisions.entityId, entityId)))
    .orderBy(desc(contentRevisions.createdAt))
    .limit(15);
}

/* ---------- Slug değişikliği → 301 ---------- */

/** Yayındaki içeriğin adresi değişirse eski yoldan yenisine kalıcı yönlendirme kaydı açar (zincirleri de günceller). */
export async function redirectOnSlugChange(oldPath: string, newPath: string, wasPublished: boolean) {
  if (!wasPublished || oldPath === newPath) return;
  await db.update(redirectRules).set({ toPath: newPath }).where(eq(redirectRules.toPath, oldPath));
  await db.delete(redirectRules).where(eq(redirectRules.fromPath, newPath));
  await db
    .insert(redirectRules)
    .values({ fromPath: oldPath, toPath: newPath, statusCode: 301, note: "Slug değişikliği (otomatik)" })
    .onConflictDoUpdate({ target: redirectRules.fromPath, set: { toPath: newPath, isActive: true } });
  invalidate(CACHE_TAGS.redirects);
}

export function isLive(status: string, publishedAt: Date | null) {
  return status === "published" && !!publishedAt && publishedAt <= new Date();
}

export { lt };
