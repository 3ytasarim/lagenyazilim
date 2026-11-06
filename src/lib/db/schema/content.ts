import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { contentStatus, id, publishColumns, seoColumns, timestamps } from "./_shared";

export type FaqItem = { q: string; a: string };
export type SourceRef = { title: string; url: string };

export const mediaAssets = pgTable("media_assets", {
  id: id(),
  storageKey: text().notNull().unique(),
  originalName: text().notNull(),
  mime: text().notNull(),
  sizeBytes: integer().notNull(),
  width: integer(),
  height: integer(),
  alt: text().notNull().default(""),
  caption: text(),
  /** Üretilmiş AVIF/WebP genişlikleri: { "640": "key", ... } */
  variants: jsonb().$type<Record<string, string>>().notNull().default({}),
  blurDataUrl: text(),
  createdById: uuid().references(() => users.id, { onDelete: "set null" }),
  ...timestamps(),
});

/** Kurumsal ve yasal sayfalar (Hakkımızda, KVKK, Gizlilik...). */
export const pages = pgTable("pages", {
  id: id(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  h1: text(),
  excerpt: text(),
  body: jsonb(),
  bodyHtml: text().notNull().default(""),
  /** corporate | legal */
  kind: text().notNull().default("corporate"),
  /** Hukuki onay bekleyen metinler sitede uyarı bandıyla gösterilir ve indekslenmez. */
  requiresLegalReview: boolean().notNull().default(false),
  version: text(),
  ...publishColumns(),
  ...seoColumns(),
  ...timestamps(),
});

export const services = pgTable("services", {
  id: id(),
  /** Eski URL'ler korunur: "ankara-web-tasarim" gibi. */
  slug: text().notNull().unique(),
  name: text().notNull(),
  shortName: text().notNull(),
  h1: text().notNull(),
  summary: text().notNull(),
  heroText: text().notNull().default(""),
  /** Sayfa başındaki doğrudan cevap paragrafı. */
  shortAnswer: text().notNull().default(""),
  icon: text().notNull().default("layout"),
  problem: text().notNull().default(""),
  approach: text().notNull().default(""),
  scope: jsonb().$type<{ title: string; text: string }[]>().notNull().default([]),
  deliverables: text().array().notNull().default([]),
  sectors: text().array().notNull().default([]),
  process: jsonb().$type<{ title: string; text: string }[]>().notNull().default([]),
  body: jsonb(),
  bodyHtml: text().notNull().default(""),
  faqs: jsonb().$type<FaqItem[]>().notNull().default([]),
  /** Teklif sihirbazında ön seçilecek seçenek anahtarı (quote_service_options.key). */
  quoteKey: text(),
  /** Mevcut sitede sunulan ana hizmet mi, yoksa onay bekleyen yeni hizmet önerisi mi. */
  isCore: boolean().notNull().default(true),
  sortOrder: integer().notNull().default(0),
  ...publishColumns(),
  ...seoColumns(),
  ...timestamps(),
});

export const serviceRelations = pgTable(
  "service_relations",
  {
    serviceId: uuid()
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    relatedId: uuid()
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.serviceId, t.relatedId] })],
);

export const authors = pgTable("authors", {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  jobTitle: text(),
  bio: text(),
  avatarId: uuid().references(() => mediaAssets.id, { onDelete: "set null" }),
  sameAs: text().array().notNull().default([]),
  userId: uuid().references(() => users.id, { onDelete: "set null" }),
  /** Person şeması yalnızca doğrulanmış gerçek yazarlar için üretilir. */
  isVerified: boolean().notNull().default(false),
  ...timestamps(),
});

export const blogCategories = pgTable("blog_categories", {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  description: text(),
  sortOrder: integer().notNull().default(0),
  ...seoColumns(),
  ...timestamps(),
});

export const blogTags = pgTable("blog_tags", {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
});

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: id(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    excerpt: text().notNull().default(""),
    body: jsonb(),
    bodyHtml: text().notNull().default(""),
    toc: jsonb().$type<{ id: string; text: string; level: number }[]>().notNull().default([]),
    coverImageId: uuid().references(() => mediaAssets.id, { onDelete: "set null" }),
    authorId: uuid().references(() => authors.id, { onDelete: "set null" }),
    categoryId: uuid().references(() => blogCategories.id, { onDelete: "set null" }),
    sources: jsonb().$type<SourceRef[]>().notNull().default([]),
    readingMinutes: integer().notNull().default(1),
    /** Zamanlanmış yayın: status=published + publishedAt gelecekte → o ana kadar görünmez. */
    ...publishColumns(),
    ...seoColumns(),
    ...timestamps(),
  },
  (t) => [index().on(t.status, t.publishedAt)],
);

export const blogPostTags = pgTable(
  "blog_post_tags",
  {
    postId: uuid()
      .notNull()
      .references(() => blogPosts.id, { onDelete: "cascade" }),
    tagId: uuid()
      .notNull()
      .references(() => blogTags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

export const projects = pgTable("projects", {
  id: id(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  clientName: text().notNull(),
  sector: text().notNull().default(""),
  summary: text().notNull().default(""),
  challenge: text().notNull().default(""),
  solution: text().notNull().default(""),
  /** Yalnızca müşteri tarafından doğrulanmış sonuçlar. */
  results: text().notNull().default(""),
  body: jsonb(),
  bodyHtml: text().notNull().default(""),
  coverImageId: uuid().references(() => mediaAssets.id, { onDelete: "set null" }),
  gallery: uuid().array().notNull().default([]),
  liveUrl: text(),
  year: integer(),
  /** Müşteri adı/logosu/görselleri için yazılı kullanım izni alındı mı. Yayın için zorunlu. */
  clientConsent: boolean().notNull().default(false),
  isFeatured: boolean().notNull().default(false),
  sortOrder: integer().notNull().default(0),
  ...publishColumns(),
  ...seoColumns(),
  ...timestamps(),
});

export const projectServices = pgTable(
  "project_services",
  {
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    serviceId: uuid()
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.serviceId] })],
);

export const testimonials = pgTable("testimonials", {
  id: id(),
  authorName: text().notNull(),
  authorTitle: text(),
  company: text(),
  quote: text().notNull(),
  projectId: uuid().references(() => projects.id, { onDelete: "set null" }),
  /** Yayın şartı: kişinin yazılı onayı tarihi. */
  consentAt: timestamp({ withTimezone: true }),
  status: contentStatus().notNull().default("draft"),
  sortOrder: integer().notNull().default(0),
  ...timestamps(),
});

/** Her kayıt öncesi anlık görüntü — admin'den geri yükleme. */
export const contentRevisions = pgTable(
  "content_revisions",
  {
    id: id(),
    entityType: text().notNull(),
    entityId: uuid().notNull(),
    snapshot: jsonb().notNull(),
    note: text(),
    createdById: uuid().references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.entityType, t.entityId, t.createdAt)],
);
