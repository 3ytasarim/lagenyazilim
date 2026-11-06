"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts, contentRevisions, pages, projects, regionPages, services } from "@/lib/db/schema";
import { audit } from "@/server/services/audit";
import { CACHE_TAGS, invalidate, saveRevision, str } from "@/server/services/content";
import { ActionError, guard, run, type ActionResult } from "./_guard";

/* Geri yüklemede kimlik, slug, yayın durumu ve zaman alanları korunur — yalnızca içerik ve SEO alanları döner. */
const KEEP = new Set(["id", "slug", "status", "publishedAt", "createdAt", "updatedAt", "regionId", "serviceId", "qualityScore", "qualityReport"]);
const TABLES = { service: [services, CACHE_TAGS.services], post: [blogPosts, CACHE_TAGS.posts], project: [projects, CACHE_TAGS.projects], page: [pages, CACHE_TAGS.pages], region_page: [regionPages, "regions"] } as const;

export async function restoreRevision(fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const [rev] = await db.select().from(contentRevisions).where(eq(contentRevisions.id, str(fd, "revisionId"))).limit(1);
    if (!rev) throw new ActionError("Revizyon bulunamadı.");
    const entry = TABLES[rev.entityType as keyof typeof TABLES];
    if (!entry) throw new ActionError("Bu içerik türü geri yüklenemez.");
    const [table, tag] = entry;
    const [current] = await db.select().from(table).where(eq(table.id, rev.entityId)).limit(1);
    if (!current) throw new ActionError("İçerik artık mevcut değil.");

    const snap = rev.snapshot as Record<string, unknown>;
    const patch = Object.fromEntries(Object.entries(snap).filter(([k]) => !KEEP.has(k) && k in current));
    // Bölge sayfası geri yüklenince kalite kapısı yeniden işletilmeli: yayındaysa incelemeye çekilir
    if (rev.entityType === "region_page") Object.assign(patch, { qualityScore: 0, ...((current as { status?: string }).status === "published" ? { status: "review" } : {}) });
    await saveRevision(rev.entityType, rev.entityId, current as unknown as Record<string, unknown>, user.id, "Geri yükleme öncesi");
    await db.update(table).set(patch as never).where(eq(table.id, rev.entityId));
    await audit({ actorId: user.id, action: `${rev.entityType}.restore`, entityType: rev.entityType, entityId: rev.entityId, diff: { revisionId: rev.id }, ipHash });
    invalidate(tag);
    return { ok: true, message: "Revizyon geri yüklendi." };
  });
}
