"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { regionPages, regions } from "@/lib/db/schema";
import { audit, changedFields } from "@/server/services/audit";
import { bodyFromForm, bool, invalidate, json, optStr, publishFromForm, saveRevision, seoFromForm, slugSchema, str } from "@/server/services/content";
import { combinedText, evaluateRegionPage } from "@/server/services/regions";
import { ActionError, guard, run, type ActionResult } from "./_guard";

const uuid = (v: string) => /^[0-9a-f-]{36}$/.test(v);

/** Mahalle / semt / ticari bölge kaydı. Resmî kaynak belirtilmeden "doğrulandı" işaretlenemez. */
export async function saveRegion(fd: FormData): Promise<ActionResult> {
  return run(async (): Promise<ActionResult> => {
    const { user, ipHash } = await guard("seo", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const name = str(fd, "name").slice(0, 80);
    const slug = slugSchema.safeParse(str(fd, "slug"));
    const kind = str(fd, "kind");
    const parentId = str(fd, "parentId");
    const source = optStr(fd, "verificationSource")?.slice(0, 500) ?? null;
    const verified = bool(fd, "isVerified");
    const errors: Record<string, string> = {};
    if (!name) errors.name = "Ad zorunlu.";
    if (!slug.success) errors.slug = slug.error.issues[0]!.message;
    if (!["neighborhood", "zone", "district"].includes(kind)) errors.kind = "Tür seçin.";
    if (verified && !source) errors.verificationSource = "Doğrulandı işareti için resmî kaynak (bağlantı veya belge) zorunlu.";
    if (!uuid(parentId)) errors.parentId = "Bağlı olduğu ilçeyi seçin.";
    if (Object.keys(errors).length) return { ok: false, message: "Lütfen işaretli alanları düzeltin.", fieldErrors: errors };
    const [parent] = await db.select().from(regions).where(eq(regions.id, parentId)).limit(1);
    if (!parent || (kind !== "district" && parent.kind !== "district")) throw new ActionError("Üst bölge geçersiz.");
    const values = { name, slug: slug.data!, kind: kind as "neighborhood", parentId, verificationSource: source, isVerified: verified, priority: Number(str(fd, "priority")) || 2 };
    try {
      if (id) {
        const [cur] = await db.select().from(regions).where(eq(regions.id, id)).limit(1);
        if (!cur) throw new ActionError("Bölge bulunamadı.");
        // İlçe kayıtlarının adı/slug'ı ve üst bölgesi değiştirilemez (URL ve idari yapı sabit)
        const patch = cur.kind === "district" ? { verificationSource: source, isVerified: verified, priority: values.priority } : values;
        await db.update(regions).set(patch).where(eq(regions.id, id));
        await audit({ actorId: user.id, action: "region.update", entityType: "region", entityId: id, diff: changedFields(cur as never, patch as never), ipHash });
      } else {
        await db.insert(regions).values(values);
        await audit({ actorId: user.id, action: "region.create", entityType: "region", diff: { name, kind, parent: parent.name }, ipHash });
      }
    } catch (e) {
      if (e instanceof ActionError) throw e;
      throw new ActionError("Bu ilçede aynı slug ile başka bir bölge var.");
    }
    invalidate("regions");
    return { ok: true, message: "Bölge kaydedildi." };
  });
}

export async function saveRegionPage(fd: FormData): Promise<ActionResult<{ redirect?: string }>> {
  return run(async () => {
    const { user, ipHash } = await guard("seo", fd.get("csrf"));
    const id = str(fd, "id") || null;
    const current = id ? (await db.select().from(regionPages).where(eq(regionPages.id, id)).limit(1))[0] : undefined;
    if (id && !current) throw new ActionError("Sayfa bulunamadı.");
    const regionId = current?.regionId ?? str(fd, "regionId");
    const serviceId = current ? current.serviceId : str(fd, "serviceId") || null;
    if (!uuid(regionId) || (serviceId && !uuid(serviceId))) throw new ActionError("Bölge veya hizmet geçersiz.");
    const [region] = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);
    if (!region || region.kind === "city") throw new ActionError("Bölge bulunamadı.");
    if (serviceId && region.kind !== "district") throw new ActionError("Hizmet + bölge sayfası yalnızca ilçeler için açılabilir.");
    const [parent] = region.parentId ? await db.select().from(regions).where(eq(regions.id, region.parentId)).limit(1) : [];

    const errors: Record<string, string> = {};
    const faqs = json<{ title: string; text: string }[]>(fd, "faqs", [])
      .map((f) => ({ q: String(f.title ?? "").trim().slice(0, 300), a: String(f.text ?? "").trim().slice(0, 2000) }))
      .filter((f) => f.q && f.a)
      .slice(0, 20);
    const { toc: _toc, ...body } = bodyFromForm(fd);
    const relatedServiceIds = fd.getAll("relatedPick").map(String).filter(uuid).slice(0, 6);
    const seo = seoFromForm(fd, errors);
    const values = {
      title: str(fd, "title").slice(0, 160),
      h1: str(fd, "h1").slice(0, 160),
      intro: str(fd, "intro").slice(0, 3000),
      localNeeds: str(fd, "localNeeds").slice(0, 5000),
      localSectors: str(fd, "localSectors").slice(0, 5000),
      serviceModel: str(fd, "serviceModel").slice(0, 3000),
      ...body,
      faqs,
      relatedServiceIds,
      ...seo,
    };
    if (!values.title) errors.title = "Başlık zorunlu.";
    if (!values.h1) errors.h1 = "H1 zorunlu.";

    // Kalite kontrolü: aynı türdeki diğer bölge sayfalarıyla karşılaştır
    const others = await db
      .select({ id: regionPages.id, intro: regionPages.intro, localNeeds: regionPages.localNeeds, localSectors: regionPages.localSectors, serviceModel: regionPages.serviceModel, bodyHtml: regionPages.bodyHtml, faqs: regionPages.faqs, seoTitle: regionPages.seoTitle, h1: regionPages.h1, name: regions.name })
      .from(regionPages)
      .innerJoin(regions, eq(regionPages.regionId, regions.id))
      .where(id ? ne(regionPages.id, id) : undefined);
    const { score, report } = evaluateRegionPage(
      { ...values, isServiceCombo: !!serviceId },
      { regionVerified: region.isVerified, regionNames: [region.name, parent?.name ?? ""], others: others.map((o) => ({ id: o.id, label: o.name, text: combinedText(o), seoTitle: o.seoTitle, h1: o.h1 })) },
    );

    const publish = publishFromForm(fd, current);
    if (publish.status === "published" && score < 100) {
      errors.status = "Yayın kapısı geçilmedi: aşağıdaki kontrollerin tamamı sağlanmalı.";
      // Raporu yine kaydet ki editör neyin eksik olduğunu görsün
    }
    if (Object.keys(errors).length) {
      if (current) await db.update(regionPages).set({ qualityScore: score, qualityReport: report }).where(eq(regionPages.id, current.id));
      return { ok: false, message: errors.status ?? "Lütfen işaretli alanları düzeltin.", fieldErrors: errors };
    }

    // Kayıt yayından düşerse (kalite bozulduysa) otomatik noindex: yayındaki sayfa düzenlenip eşik altına inerse durum incelemeye çekilir
    const row = { ...values, ...publish, qualityScore: score, qualityReport: report, ...(current?.status === "published" && score < 100 ? { status: "review" as const } : {}) };
    let savedId = id;
    if (current) {
      await saveRevision("region_page", current.id, current as unknown as Record<string, unknown>, user.id);
      await db.update(regionPages).set(row).where(eq(regionPages.id, current.id));
      await audit({ actorId: user.id, action: "region_page.update", entityType: "region_page", entityId: current.id, diff: { ...changedFields(current as never, row as never), score }, ipHash });
    } else {
      const exists = await db.select({ id: regionPages.id }).from(regionPages).where(and(eq(regionPages.regionId, regionId), serviceId ? eq(regionPages.serviceId, serviceId) : isNull(regionPages.serviceId))).limit(1);
      if (exists.length) throw new ActionError("Bu bölge için bu sayfa zaten var.");
      const [c] = await db.insert(regionPages).values({ ...row, regionId, serviceId }).returning({ id: regionPages.id });
      savedId = c!.id;
      await audit({ actorId: user.id, action: "region_page.create", entityType: "region_page", entityId: savedId, diff: { region: region.name, score }, ipHash });
    }
    invalidate("regions");
    return { ok: true, message: `Kaydedildi · kalite ${score}/100${score < 100 ? " (yayın için 100 gerekli)" : ""}.`, data: current ? {} : { redirect: `/admin/bolgeler/sayfa/${savedId}/` } };
  });
}

export async function deleteRegionPage(fd: FormData): Promise<ActionResult<{ redirect?: string }>> {
  return run(async () => {
    const { user, ipHash } = await guard("seo", fd.get("csrf"));
    const id = str(fd, "id");
    const [p] = await db.select().from(regionPages).where(eq(regionPages.id, id)).limit(1);
    if (!p) throw new ActionError("Sayfa bulunamadı.");
    if (p.status === "published") throw new ActionError("Yayındaki sayfa silinemez; önce arşive alın.");
    await db.delete(regionPages).where(eq(regionPages.id, id));
    await audit({ actorId: user.id, action: "region_page.delete", entityType: "region_page", entityId: id, ipHash });
    invalidate("regions");
    return { ok: true, message: "Silindi.", data: { redirect: "/admin/bolgeler/" } };
  });
}

