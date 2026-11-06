import { boolean, pgEnum, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["super_admin", "editor", "sales"]);

/** Tüm yayınlanabilir içerikler için ortak iş akışı. */
export const contentStatus = pgEnum("content_status", ["draft", "review", "published", "archived"]);

export const quoteStatus = pgEnum("quote_status", [
  "new",
  "reviewing",
  "contacted",
  "preparing",
  "sent",
  "meeting",
  "won",
  "lost",
  "archived",
]);

export const leadSource = pgEnum("lead_source", ["contact", "seo_audit"]);
export const leadStatus = pgEnum("lead_status", ["new", "contacted", "closed", "spam"]);
export const notificationStatus = pgEnum("notification_status", ["pending", "sent", "failed", "skipped"]);
export const regionKind = pgEnum("region_kind", ["city", "district", "neighborhood", "zone"]);

export const id = () => uuid().primaryKey().defaultRandom();

export const timestamps = () => ({
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * SEO alan grubu — her indekslenebilir içerik tablosuna aynı sütunlar eklenir.
 * Ayrı bir polimorfik tablo yerine sütun grubu: sorgular join gerektirmez, FK bütünlüğü korunur.
 */
export const seoColumns = () => ({
  seoTitle: text(),
  seoDescription: text(),
  focusKeyword: text(),
  secondaryKeywords: text().array().notNull().default([]),
  canonicalOverride: text(),
  robotsIndex: boolean().notNull().default(true),
  robotsFollow: boolean().notNull().default(true),
  ogImageId: uuid(),
});

/** Yayın alanları — status + publishedAt birlikte değerlendirilir (bkz. lib/content/visibility). */
export const publishColumns = () => ({
  status: contentStatus().notNull().default("draft"),
  publishedAt: timestamp({ withTimezone: true }),
});
