"use server";

import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceRelations, services } from "@/lib/db/schema";
import { audit, changedFields } from "@/server/services/audit";
import {
  bodyFromForm,
  bool,
  CACHE_TAGS,
  invalidate,
  json,
  publishFromForm,
  redirectOnSlugChange,
  saveRevision,
  seoFromForm,
  slugSchema,
  str,
  isLive,
} from "@/server/services/content";
import { ActionError, guard, run, type ActionResult } from "./_guard";

const ICONS = ["layout", "search", "share", "code", "book", "camera", "cart", "sparkles"];
type Pair = { title: string; text: string };
type Faq = { q: string; a: string };

const cleanPairs = (v: unknown): Pair[] =>
  (Array.isArray(v) ? v : []).map((r) => ({ title: String(r?.title ?? "").trim().slice(0, 200), text: String(r?.text ?? "").trim().slice(0, 2000) })).filter((r) => r.title).slice(0, 30);
const cleanFaqs = (v: unknown): Faq[] =>
  (Array.isArray(v) ? v : []).map((r) => ({ q: String(r?.q ?? "").trim().slice(0, 300), a: String(r?.a ?? "").trim().slice(0, 3000) })).filter((r) => r.q && r.a).slice(0, 30);
const cleanList = (v: unknown, max = 30) => (Array.isArray(v) ? v : []).map((x) => String(x).trim().slice(0, 200)).filter(Boolean).slice(0, max);

export async function saveService(fd: FormData): Promise<ActionResult<{ redirect?: string }>> {
  return run(async () => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const errors: Record<string, string> = {};

    const slug = slugSchema.safeParse(str(fd, "slug"));
    if (!slug.success) errors.slug = slug.error.issues[0]!.message;
    const values = {
      name: str(fd, "name").slice(0, 120),
      shortName: str(fd, "shortName").slice(0, 60) || str(fd, "name").slice(0, 60),
      h1: str(fd, "h1").slice(0, 160),
      summary: str(fd, "summary").slice(0, 400),
      heroText: str(fd, "heroText").slice(0, 1200),
      shortAnswer: str(fd, "shortAnswer").slice(0, 1200),
      icon: ICONS.includes(str(fd, "icon")) ? str(fd, "icon") : "layout",
      problem: str(fd, "problem").slice(0, 3000),
      approach: str(fd, "approach").slice(0, 3000),
      scope: cleanPairs(json(fd, "scope", [])),
      deliverables: cleanList(json(fd, "deliverables", [])),
      sectors: cleanList(json(fd, "sectors", [])),
      process: cleanPairs(json(fd, "process", [])),
      faqs: cleanFaqs(json<{ title: string; text: string }[]>(fd, "faqs", []).map((r) => ({ q: r.title, a: r.text }))),
      quoteKey: str(fd, "quoteKey") || null,
      isCore: bool(fd, "isCore"),
      sortOrder: Number.parseInt(str(fd, "sortOrder"), 10) || 0,
      ...bodyFromForm(fd),
      ...seoFromForm(fd, errors),
    };
    delete (values as { toc?: unknown }).toc;
    if (!values.name) errors.name = "Hizmet adı zorunlu.";
    if (!values.h1) errors.h1 = "Sayfa başlığı (H1) zorunlu.";
    if (!values.summary) errors.summary = "Kısa açıklama zorunlu.";

    const current = id ? (await db.select().from(services).where(eq(services.id, id)).limit(1))[0] : undefined;
    if (id && !current) throw new ActionError("Hizmet bulunamadı.");
    const publish = publishFromForm(fd, current);
    // Onaysız yeni hizmet önerileri (is_core=false) yayına alınırken açık onay istenir
    if (publish.status === "published" && !values.isCore && !bool(fd, "approvedOffer")) errors.approvedOffer = "Yeni hizmet önerisini yayımlamak için firma onayını işaretleyin.";
    if (publish.status === "published" && !values.shortAnswer) errors.shortAnswer = "Yayındaki hizmetlerde kısa cevap paragrafı zorunlu.";

    if (slug.success) {
      const clash = await db.select({ id: services.id }).from(services).where(id ? and(eq(services.slug, slug.data), ne(services.id, id)) : eq(services.slug, slug.data)).limit(1);
      if (clash.length) errors.slug = "Bu slug başka bir hizmette kullanılıyor.";
    }
    if (Object.keys(errors).length) return { ok: false, message: "Lütfen işaretli alanları düzeltin.", fieldErrors: errors };

    const row = { ...values, slug: slug.data!, ...publish };
    let savedId = id;
    if (current) {
      await saveRevision("service", current.id, current as unknown as Record<string, unknown>, user.id);
      await db.update(services).set(row).where(eq(services.id, current.id));
      await redirectOnSlugChange(`/${current.slug}/`, `/${row.slug}/`, isLive(current.status, current.publishedAt));
      await audit({ actorId: user.id, action: "service.update", entityType: "service", entityId: current.id, diff: changedFields(current as never, row as never), ipHash });
    } else {
      const [created] = await db.insert(services).values(row).returning({ id: services.id });
      savedId = created!.id;
      await audit({ actorId: user.id, action: "service.create", entityType: "service", entityId: savedId, diff: { name: row.name }, ipHash });
    }

    // İlgili hizmetler
    const related = cleanList(fd.getAll("relatedPick").map(String), 6).filter((r) => r !== savedId && /^[0-9a-f-]{36}$/.test(r));
    await db.delete(serviceRelations).where(eq(serviceRelations.serviceId, savedId!));
    if (related.length) await db.insert(serviceRelations).values(related.map((r, i) => ({ serviceId: savedId!, relatedId: r, sortOrder: i }))).onConflictDoNothing();

    invalidate(CACHE_TAGS.services);
    return { ok: true, message: "Hizmet kaydedildi.", data: current ? {} : { redirect: `/admin/hizmetler/${savedId}/` } };
  });
}

export async function deleteService(fd: FormData): Promise<ActionResult<{ redirect?: string }>> {
  return run(async () => {
    const { user, ipHash } = await guard("content", fd.get("csrf"));
    const id = str(fd, "id");
    const [row] = await db.select().from(services).where(eq(services.id, id)).limit(1);
    if (!row) throw new ActionError("Hizmet bulunamadı.");
    if (isLive(row.status, row.publishedAt)) throw new ActionError("Yayındaki hizmet silinemez; önce arşive alın (eski adres için yönlendirme planlayın).");
    try {
      await db.delete(services).where(eq(services.id, id));
    } catch {
      throw new ActionError("Bu hizmete bağlı bölge sayfaları var; önce onları kaldırın.");
    }
    await audit({ actorId: user.id, action: "service.delete", entityType: "service", entityId: id, diff: { name: row.name }, ipHash });
    invalidate(CACHE_TAGS.services);
    return { ok: true, message: "Silindi.", data: { redirect: "/admin/hizmetler/" } };
  });
}
