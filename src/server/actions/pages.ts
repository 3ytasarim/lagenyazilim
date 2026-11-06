"use server";

import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { RESERVED_PAGE_SLUGS } from "@/lib/content/reserved";
import { audit, changedFields } from "@/server/services/audit";
import { bodyFromForm, bool, CACHE_TAGS, invalidate, isLive, optStr, publishFromForm, redirectOnSlugChange, saveRevision, seoFromForm, slugSchema, str } from "@/server/services/content";
import { ActionError, guard, run, type ActionResult } from "./_guard";


export async function savePage(fd: FormData): Promise<ActionResult<{ redirect?: string }>> {
  return run(async () => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const errors: Record<string, string> = {};
    const current = id ? (await db.select().from(pages).where(eq(pages.id, id)).limit(1))[0] : undefined;
    if (id && !current) throw new ActionError("Sayfa bulunamadı.");

    const title = str(fd, "title").slice(0, 200);
    if (!title) errors.title = "Başlık zorunlu.";
    const requestedSlug = current && RESERVED_PAGE_SLUGS.includes(current.slug) ? current.slug : str(fd, "slug");
    const slug = slugSchema.safeParse(requestedSlug);
    if (!slug.success) errors.slug = slug.error.issues[0]!.message;
    const kind = str(fd, "kind") === "legal" ? "legal" : "corporate";
    const { toc: _toc, ...body } = bodyFromForm(fd);
    const values = {
      title,
      h1: optStr(fd, "h1"),
      excerpt: optStr(fd, "excerpt")?.slice(0, 600) ?? null,
      kind,
      requiresLegalReview: bool(fd, "requiresLegalReview"),
      version: optStr(fd, "version")?.slice(0, 40) ?? null,
      ...(fd.has("bodyHtml") ? body : {}),
      ...seoFromForm(fd, errors),
    };
    // Hukuki onay bekleyen yasal metin indekslenmez
    if (values.kind === "legal" && values.requiresLegalReview) values.robotsIndex = false;
    const publish = publishFromForm(fd, current);

    if (slug.success) {
      const clash = await db.select({ id: pages.id }).from(pages).where(id ? and(eq(pages.slug, slug.data), ne(pages.id, id)) : eq(pages.slug, slug.data)).limit(1);
      if (clash.length) errors.slug = "Bu slug başka bir sayfada kullanılıyor.";
    }
    if (Object.keys(errors).length) return { ok: false, message: "Lütfen işaretli alanları düzeltin.", fieldErrors: errors };

    const row = { ...values, slug: slug.data!, ...publish };
    if (current) {
      await saveRevision("page", current.id, current as unknown as Record<string, unknown>, user.id);
      await db.update(pages).set(row).where(eq(pages.id, current.id));
      await redirectOnSlugChange(`/${current.slug}/`, `/${row.slug}/`, isLive(current.status, current.publishedAt));
      await audit({ actorId: user.id, action: "page.update", entityType: "page", entityId: current.id, diff: changedFields(current as never, row as never), ipHash });
      invalidate(CACHE_TAGS.pages);
      return { ok: true, message: "Sayfa kaydedildi." };
    }
    const [c] = await db.insert(pages).values(row).returning({ id: pages.id });
    await audit({ actorId: user.id, action: "page.create", entityType: "page", entityId: c!.id, diff: { title }, ipHash });
    invalidate(CACHE_TAGS.pages);
    return { ok: true, message: "Sayfa oluşturuldu.", data: { redirect: `/admin/sayfalar/${c!.id}/` } };
  });
}
