"use server";

import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectServices, projects } from "@/lib/db/schema";
import { audit, changedFields } from "@/server/services/audit";
import { bodyFromForm, bool, CACHE_TAGS, invalidate, isLive, json, optStr, publishFromForm, redirectOnSlugChange, saveRevision, seoFromForm, slugSchema, str } from "@/server/services/content";
import { slugify } from "@/lib/utils";
import { ActionError, guard, run, type ActionResult } from "./_guard";

const ids = (v: unknown) => (Array.isArray(v) ? v : []).map(String).filter((x) => /^[0-9a-f-]{36}$/.test(x));

export async function saveProject(fd: FormData): Promise<ActionResult<{ redirect?: string }>> {
  return run(async () => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const errors: Record<string, string> = {};
    const title = str(fd, "title").slice(0, 200);
    const clientName = str(fd, "clientName").slice(0, 160);
    if (!title) errors.title = "Proje adı zorunlu.";
    if (!clientName) errors.clientName = "Müşteri adı zorunlu.";
    const slug = slugSchema.safeParse(str(fd, "slug") || slugify(clientName || title));
    if (!slug.success) errors.slug = slug.error.issues[0]!.message;
    const { toc: _toc, ...body } = bodyFromForm(fd);
    const liveUrl = optStr(fd, "liveUrl");
    if (liveUrl && !/^https?:\/\/\S+$/.test(liveUrl)) errors.liveUrl = "Geçerli bir adres girin (https://…).";

    const values = {
      title,
      clientName,
      sector: str(fd, "sector").slice(0, 120),
      summary: str(fd, "summary").slice(0, 500),
      challenge: str(fd, "challenge").slice(0, 3000),
      solution: str(fd, "solution").slice(0, 3000),
      results: str(fd, "results").slice(0, 3000),
      ...body,
      coverImageId: ids([str(fd, "coverImageId")])[0] ?? null,
      gallery: ids(json(fd, "gallery", [])).slice(0, 24),
      liveUrl,
      year: Number.parseInt(str(fd, "year"), 10) || null,
      clientConsent: bool(fd, "clientConsent"),
      isFeatured: bool(fd, "isFeatured"),
      sortOrder: Number.parseInt(str(fd, "sortOrder"), 10) || 0,
      ...seoFromForm(fd, errors),
    };

    const current = id ? (await db.select().from(projects).where(eq(projects.id, id)).limit(1))[0] : undefined;
    if (id && !current) throw new ActionError("Proje bulunamadı.");
    const publish = publishFromForm(fd, current);
    // Yayın şartı: müşterinin yazılı izni (sahte/izinsiz referans yayımlanmaz)
    if (publish.status === "published" && !values.clientConsent) errors.clientConsent = "Müşterinin yayın izni alınmadan proje yayımlanamaz.";
    if (publish.status === "published" && !values.coverImageId) errors.coverImageId = "Yayındaki projede kapak görseli zorunlu.";
    if (slug.success) {
      const clash = await db.select({ id: projects.id }).from(projects).where(id ? and(eq(projects.slug, slug.data), ne(projects.id, id)) : eq(projects.slug, slug.data)).limit(1);
      if (clash.length) errors.slug = "Bu slug başka bir projede kullanılıyor.";
    }
    if (Object.keys(errors).length) return { ok: false, message: "Lütfen işaretli alanları düzeltin.", fieldErrors: errors };

    const row = { ...values, slug: slug.data!, ...publish };
    let savedId = id;
    if (current) {
      await saveRevision("project", current.id, current as unknown as Record<string, unknown>, user.id);
      await db.update(projects).set(row).where(eq(projects.id, current.id));
      await redirectOnSlugChange(`/projeler/${current.slug}/`, `/projeler/${row.slug}/`, isLive(current.status, current.publishedAt));
      await audit({ actorId: user.id, action: "project.update", entityType: "project", entityId: current.id, diff: changedFields(current as never, row as never), ipHash });
    } else {
      const [c] = await db.insert(projects).values(row).returning({ id: projects.id });
      savedId = c!.id;
      await audit({ actorId: user.id, action: "project.create", entityType: "project", entityId: savedId, diff: { title }, ipHash });
    }
    const svc = ids(fd.getAll("servicePick"));
    await db.delete(projectServices).where(eq(projectServices.projectId, savedId!));
    if (svc.length) await db.insert(projectServices).values(svc.map((s) => ({ projectId: savedId!, serviceId: s }))).onConflictDoNothing();

    invalidate(CACHE_TAGS.projects);
    return { ok: true, message: "Proje kaydedildi.", data: current ? {} : { redirect: `/admin/projeler/${savedId}/` } };
  });
}

export async function deleteProject(fd: FormData): Promise<ActionResult<{ redirect?: string }>> {
  return run(async () => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const id = str(fd, "id");
    const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!row) throw new ActionError("Proje bulunamadı.");
    if (isLive(row.status, row.publishedAt)) throw new ActionError("Yayındaki proje silinemez; önce arşive alın.");
    await db.delete(projects).where(eq(projects.id, id));
    await audit({ actorId: user.id, action: "project.delete", entityType: "project", entityId: id, diff: { title: row.title }, ipHash });
    invalidate(CACHE_TAGS.projects);
    return { ok: true, message: "Silindi.", data: { redirect: "/admin/projeler/" } };
  });
}
