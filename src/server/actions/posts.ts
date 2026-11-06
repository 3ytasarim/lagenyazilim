"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { authors, blogCategories, blogPostTags, blogPosts, blogTags, mediaAssets } from "@/lib/db/schema";
import { readingMinutes } from "@/lib/content/html";
import { slugify } from "@/lib/utils";
import { audit, changedFields } from "@/server/services/audit";
import { bodyFromForm, CACHE_TAGS, invalidate, isLive, json, optStr, publishFromForm, redirectOnSlugChange, saveRevision, seoFromForm, slugSchema, str } from "@/server/services/content";
import { ActionError, guard, run, type ActionResult } from "./_guard";

const uuidOrNull = (v: string) => (/^[0-9a-f-]{36}$/.test(v) ? v : null);

export async function savePost(fd: FormData): Promise<ActionResult<{ redirect?: string }>> {
  return run(async () => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const errors: Record<string, string> = {};
    const title = str(fd, "title").slice(0, 200);
    if (!title) errors.title = "Başlık zorunlu.";
    const slug = slugSchema.safeParse(str(fd, "slug") || slugify(title));
    if (!slug.success) errors.slug = slug.error.issues[0]!.message;

    const body = bodyFromForm(fd);
    const sources = json<{ title: string; text: string }[]>(fd, "sources", [])
      .map((s) => ({ title: String(s.title ?? "").trim().slice(0, 200), url: String(s.text ?? "").trim().slice(0, 500) }))
      .filter((s) => s.title && /^https?:\/\//.test(s.url))
      .slice(0, 30);
    const values = {
      title,
      excerpt: str(fd, "excerpt").slice(0, 400),
      body: body.body,
      bodyHtml: body.bodyHtml,
      toc: body.toc,
      readingMinutes: readingMinutes(body.bodyHtml),
      coverImageId: uuidOrNull(str(fd, "coverImageId")),
      authorId: uuidOrNull(str(fd, "authorId")),
      categoryId: uuidOrNull(str(fd, "categoryId")),
      sources,
      ...seoFromForm(fd, errors),
    };

    const current = id ? (await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1))[0] : undefined;
    if (id && !current) throw new ActionError("Yazı bulunamadı.");
    const publish = publishFromForm(fd, current);

    if (publish.status === "published") {
      if (!values.excerpt) errors.excerpt = "Yayımlamak için özet zorunlu.";
      if (body.bodyHtml.replace(/<[^>]+>/g, "").trim().length < 300) errors.body = "Yayımlamak için içerik çok kısa.";
      if (values.coverImageId) {
        const [m] = await db.select({ alt: mediaAssets.alt }).from(mediaAssets).where(eq(mediaAssets.id, values.coverImageId)).limit(1);
        if (m && !m.alt) errors.coverImageId = "Kapak görselinin alt metni boş; Medya sayfasından ekleyin.";
      }
      if (/\[KAYNAK[^\]]*\]/i.test(body.bodyHtml)) errors.body = "İçerikte doğrulanmamış [KAYNAK] işareti var; kaynak ekleyin veya ifadeyi kaldırın.";
    }
    if (slug.success) {
      const clash = await db.select({ id: blogPosts.id }).from(blogPosts).where(id ? and(eq(blogPosts.slug, slug.data), ne(blogPosts.id, id)) : eq(blogPosts.slug, slug.data)).limit(1);
      if (clash.length) errors.slug = "Bu slug başka bir yazıda kullanılıyor.";
    }
    if (Object.keys(errors).length) return { ok: false, message: "Lütfen işaretli alanları düzeltin.", fieldErrors: errors };

    const row = { ...values, slug: slug.data!, ...publish };
    let savedId = id;
    if (current) {
      await saveRevision("post", current.id, current as unknown as Record<string, unknown>, user.id);
      await db.update(blogPosts).set(row).where(eq(blogPosts.id, current.id));
      await redirectOnSlugChange(`/blog/${current.slug}/`, `/blog/${row.slug}/`, isLive(current.status, current.publishedAt));
      await audit({ actorId: user.id, action: "post.update", entityType: "post", entityId: current.id, diff: changedFields(current as never, row as never), ipHash });
    } else {
      const [c] = await db.insert(blogPosts).values(row).returning({ id: blogPosts.id });
      savedId = c!.id;
      await audit({ actorId: user.id, action: "post.create", entityType: "post", entityId: savedId, diff: { title }, ipHash });
    }

    // Etiketler: adla gelir, yoksa oluşturulur
    const tagNames = json<string[]>(fd, "tags", []).map((t) => String(t).trim()).filter(Boolean).slice(0, 15);
    await db.delete(blogPostTags).where(eq(blogPostTags.postId, savedId!));
    if (tagNames.length) {
      const wanted = tagNames.map((name) => ({ name, slug: slugify(name) })).filter((t) => t.slug);
      await db.insert(blogTags).values(wanted).onConflictDoNothing();
      const tags = await db.select({ id: blogTags.id }).from(blogTags).where(inArray(blogTags.slug, wanted.map((w) => w.slug)));
      await db.insert(blogPostTags).values(tags.map((t) => ({ postId: savedId!, tagId: t.id }))).onConflictDoNothing();
    }

    invalidate(CACHE_TAGS.posts);
    return { ok: true, message: publish.status === "published" && publish.publishedAt && publish.publishedAt > new Date() ? "Yazı zamanlandı." : "Yazı kaydedildi.", data: current ? {} : { redirect: `/admin/blog/${savedId}/` } };
  });
}

export async function deletePost(fd: FormData): Promise<ActionResult<{ redirect?: string }>> {
  return run(async () => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const id = str(fd, "id");
    const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
    if (!row) throw new ActionError("Yazı bulunamadı.");
    if (isLive(row.status, row.publishedAt)) throw new ActionError("Yayındaki yazı silinemez; önce yayından kaldırın (arşiv).");
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    await audit({ actorId: user.id, action: "post.delete", entityType: "post", entityId: id, diff: { title: row.title }, ipHash });
    invalidate(CACHE_TAGS.posts);
    return { ok: true, message: "Silindi.", data: { redirect: "/admin/blog/" } };
  });
}

/* ---------- Kategori / etiket / yazar ---------- */

export async function saveCategory(fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const name = str(fd, "name").slice(0, 80);
    const slug = slugSchema.safeParse(str(fd, "slug") || slugify(name));
    if (!name || !slug.success) return { ok: false, message: "Ad ve geçerli bir slug gerekli.", fieldErrors: { name: !name ? "Ad zorunlu." : "", slug: slug.success ? "" : slug.error.issues[0]!.message } };
    const values = { name, slug: slug.data, description: optStr(fd, "description"), sortOrder: Number(str(fd, "sortOrder")) || 0 };
    try {
      if (id) await db.update(blogCategories).set(values).where(eq(blogCategories.id, id));
      else await db.insert(blogCategories).values(values);
    } catch {
      throw new ActionError("Bu slug zaten kullanılıyor.");
    }
    await audit({ actorId: user.id, action: id ? "category.update" : "category.create", entityType: "category", entityId: id, diff: values, ipHash });
    invalidate(CACHE_TAGS.posts, CACHE_TAGS.taxonomy);
    return { ok: true, message: "Kategori kaydedildi." };
  });
}

export async function deleteTaxonomy(fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const kind = str(fd, "kind");
    const id = str(fd, "id");
    if (kind === "category") {
      const used = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.categoryId, id)).limit(1);
      if (used.length) throw new ActionError("Bu kategoride yazılar var; önce yazıları başka kategoriye taşıyın.");
      await db.delete(blogCategories).where(eq(blogCategories.id, id));
    } else if (kind === "tag") await db.delete(blogTags).where(eq(blogTags.id, id));
    else if (kind === "author") {
      const used = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.authorId, id)).limit(1);
      if (used.length) throw new ActionError("Bu yazarın yazıları var; önce yazıları başka yazara atayın.");
      await db.delete(authors).where(eq(authors.id, id));
    } else throw new ActionError("Geçersiz işlem.");
    await audit({ actorId: user.id, action: `${kind}.delete`, entityType: kind, entityId: id, ipHash });
    invalidate(CACHE_TAGS.posts, CACHE_TAGS.taxonomy);
    return { ok: true, message: "Silindi." };
  });
}

export async function saveAuthor(fd: FormData): Promise<ActionResult> {
  return run(async () => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const name = str(fd, "name").slice(0, 120);
    const slug = slugSchema.safeParse(str(fd, "slug") || slugify(name));
    if (!name || !slug.success) return { ok: false, message: "Ad ve geçerli bir slug gerekli.", fieldErrors: { name: name ? "" : "Ad zorunlu." } };
    const sameAs = str(fd, "sameAs")
      .split(/\s+/)
      .filter((u) => /^https:\/\//.test(u))
      .slice(0, 6);
    const values = {
      name,
      slug: slug.data,
      jobTitle: optStr(fd, "jobTitle"),
      bio: optStr(fd, "bio")?.slice(0, 1000) ?? null,
      sameAs,
      isVerified: fd.get("isVerified") === "1",
    };
    try {
      if (id) await db.update(authors).set(values).where(eq(authors.id, id));
      else await db.insert(authors).values(values);
    } catch {
      throw new ActionError("Bu slug zaten kullanılıyor.");
    }
    await audit({ actorId: user.id, action: id ? "author.update" : "author.create", entityType: "author", entityId: id, diff: { name }, ipHash });
    invalidate(CACHE_TAGS.posts);
    return { ok: true, message: "Yazar kaydedildi." };
  });
}
