import { type AnyPgColumn, boolean, index, integer, jsonb, pgTable, text, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { services, type FaqItem } from "./content";
import { id, publishColumns, regionKind, seoColumns, timestamps } from "./_shared";

/**
 * İl → ilçe → mahalle / semt / ticari bölge hiyerarşisi.
 * "neighborhood" yalnızca resmî idari mahalleler; semt ve OSB gibi alanlar "zone".
 * Coğrafi kayıt ile yayınlanan içerik ayrıdır: bölge verisi var diye sayfa oluşmaz.
 */
export const regions = pgTable(
  "regions",
  {
    id: id(),
    parentId: uuid().references((): AnyPgColumn => regions.id, { onDelete: "restrict" }),
    kind: regionKind().notNull(),
    slug: text().notNull(),
    name: text().notNull(),
    /** Doğrulama kaynağı ve tarihi (ör. "ADNKS / e-Devlet adres, 2026-11"). */
    verificationSource: text(),
    isVerified: boolean().notNull().default(false),
    priority: integer().notNull().default(0),
    ...timestamps(),
  },
  (t) => [uniqueIndex().on(t.parentId, t.slug), index().on(t.kind)],
);

/**
 * Bölge açılış sayfası. serviceId null → bölgenin genel sayfası;
 * dolu → hizmet + bölge birleşimi (yalnızca gerçek arama niyeti ve özgün içerik varsa).
 */
export const regionPages = pgTable(
  "region_pages",
  {
    id: id(),
    regionId: uuid()
      .notNull()
      .references(() => regions.id, { onDelete: "restrict" }),
    serviceId: uuid().references(() => services.id, { onDelete: "restrict" }),
    title: text().notNull(),
    h1: text().notNull(),
    intro: text().notNull().default(""),
    localNeeds: text().notNull().default(""),
    localSectors: text().notNull().default(""),
    serviceModel: text().notNull().default(""),
    body: jsonb(),
    bodyHtml: text().notNull().default(""),
    faqs: jsonb().$type<FaqItem[]>().notNull().default([]),
    /** Sayfada bağlantı verilecek hizmetler (en az 2 — yayın kapısı). */
    relatedServiceIds: uuid().array().notNull().default([]),
    /** Admin'deki içerik yeterlilik kontrolünün son sonucu (0–100); eşik altı yayınlanamaz. */
    qualityScore: integer().notNull().default(0),
    /** Son kalite kontrolünün ayrıntısı: [{ key, ok, message }] */
    qualityReport: jsonb().$type<{ key: string; ok: boolean; message: string }[]>().notNull().default([]),
    ...publishColumns(),
    ...seoColumns(),
    ...timestamps(),
  },
  (t) => [unique().on(t.regionId, t.serviceId).nullsNotDistinct()],
);
