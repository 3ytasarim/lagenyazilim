"use server";

import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts, mediaAssets, pages, projects, services } from "@/lib/db/schema";
import { MEDIA_ACCEPT, MEDIA_MAX_BYTES, mediaUrl, type MediaRef } from "@/lib/media";
import { removeDir, sniffMime } from "@/lib/storage";
import { audit } from "@/server/services/audit";
import { MediaError, createMediaAsset } from "@/server/services/media";
import { ActionError, guard, run, type ActionResult } from "./_guard";

function toRef(r: typeof mediaAssets.$inferSelect): MediaRef {
  const largest = Object.entries(r.variants).sort((a, b) => Number(b[0]) - Number(a[0]))[0];
  return { id: r.id, url: mediaUrl(largest?.[1] ?? `${r.storageKey}/full.webp`), alt: r.alt, width: r.width, height: r.height, variants: r.variants, blurDataUrl: r.blurDataUrl };
}

export async function uploadMedia(formData: FormData): Promise<ActionResult<MediaRef[]>> {
  return run(async () => {
    const { user, ipHash } = await guard("content", formData.get("csrf"));
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length === 0) throw new ActionError("Dosya seçilmedi.");
    if (files.length > 20) throw new ActionError("Tek seferde en fazla 20 görsel yükleyebilirsiniz.");

    const out: MediaRef[] = [];
    for (const file of files) {
      if (file.size > MEDIA_MAX_BYTES) throw new ActionError(`${file.name}: 10 MB sınırını aşıyor.`);
      const buf = Buffer.from(await file.arrayBuffer());
      const mime = sniffMime(buf);
      if (!mime || !MEDIA_ACCEPT.includes(mime)) throw new ActionError(`${file.name}: yalnızca PNG, JPG, WEBP veya AVIF görseller yüklenebilir.`);

      const alt = String(formData.get("alt") ?? "").trim().slice(0, 300);
      let row: typeof mediaAssets.$inferSelect;
      try {
        row = await createMediaAsset({ buf, name: file.name, alt, createdById: user.id });
      } catch (e) {
        if (e instanceof MediaError) throw new ActionError(e.message);
        throw e;
      }
      const id = row.id;
      await audit({ actorId: user.id, action: "media.upload", entityType: "media", entityId: id, diff: { name: file.name }, ipHash });
      out.push(toRef(row));
    }
    return { ok: true, data: out, message: `${out.length} görsel yüklendi.` };
  });
}

export async function listMedia(input: { csrf: string; q?: string; page?: number }): Promise<ActionResult<{ items: MediaRef[]; total: number }>> {
  return run(async () => {
    await guard("content", input.csrf);
    const per = 40;
    const page = Math.max(1, input.page ?? 1);
    const where = input.q ? or(ilike(mediaAssets.alt, `%${input.q}%`), ilike(mediaAssets.originalName, `%${input.q}%`)) : undefined;
    const [rows, [count]] = await Promise.all([
      db.select().from(mediaAssets).where(where).orderBy(desc(mediaAssets.createdAt)).limit(per).offset((page - 1) * per),
      db.select({ n: sql<number>`count(*)::int` }).from(mediaAssets).where(where),
    ]);
    return { ok: true, data: { items: rows.map(toRef), total: count?.n ?? 0 } };
  });
}

export async function updateMedia(formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const { user, ipHash } = await guard("content", formData.get("csrf"));
    const id = String(formData.get("id") ?? "");
    const alt = String(formData.get("alt") ?? "").trim().slice(0, 300);
    const caption = String(formData.get("caption") ?? "").trim().slice(0, 500) || null;
    const res = await db.update(mediaAssets).set({ alt, caption }).where(eq(mediaAssets.id, id)).returning({ id: mediaAssets.id });
    if (res.length === 0) throw new ActionError("Görsel bulunamadı.");
    await audit({ actorId: user.id, action: "media.update", entityType: "media", entityId: id, diff: { alt }, ipHash });
    return { ok: true, message: "Kaydedildi." };
  });
}

/** Kullanımdaki görsel silinmez: kapak/OG alanlarında veya içerik gövdelerinde geçiyorsa engellenir. */
export async function deleteMedia(formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const { user, ipHash } = await guard("content", formData.get("csrf"));
    const id = String(formData.get("id") ?? "");
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new ActionError("Geçersiz görsel.");
    const like = `%/media/media/${id}/%`;
    const used = await db.execute<{ n: number }>(sql`
      select (
        (select count(*) from ${blogPosts} where ${blogPosts.coverImageId} = ${id} or ${blogPosts.ogImageId} = ${id} or ${blogPosts.bodyHtml} like ${like}) +
        (select count(*) from ${projects} where ${projects.coverImageId} = ${id} or ${projects.ogImageId} = ${id} or ${id} = any(${projects.gallery}) or ${projects.bodyHtml} like ${like}) +
        (select count(*) from ${services} where ${services.ogImageId} = ${id} or ${services.bodyHtml} like ${like}) +
        (select count(*) from ${pages} where ${pages.ogImageId} = ${id} or ${pages.bodyHtml} like ${like})
      )::int as n`);
    if (Number(used.rows[0]?.n ?? 0) > 0) throw new ActionError("Bu görsel bir içerikte kullanılıyor; önce içerikten kaldırın.");
    const [row] = await db.delete(mediaAssets).where(eq(mediaAssets.id, id)).returning();
    if (!row) throw new ActionError("Görsel bulunamadı.");
    await removeDir("public", row.storageKey);
    await audit({ actorId: user.id, action: "media.delete", entityType: "media", entityId: id, diff: { name: row.originalName }, ipHash });
    return { ok: true, message: "Görsel silindi." };
  });
}
