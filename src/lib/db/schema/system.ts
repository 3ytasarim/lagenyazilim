import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { mediaAssets } from "./content";
import { id, timestamps } from "./_shared";

/** Anahtar-değer site ayarları (NAP, sosyal ağlar, menü, SMTP...). Gizli değerler şifreli saklanır. */
export const siteSettings = pgTable("site_settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedById: uuid().references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const redirectRules = pgTable("redirect_rules", {
  id: id(),
  /** Normalize edilmiş yol: küçük harf, sonda "/" ile (ör. "/blog-2/"). */
  fromPath: text().notNull().unique(),
  toPath: text().notNull(),
  statusCode: integer().notNull().default(301),
  isActive: boolean().notNull().default(true),
  hits: integer().notNull().default(0),
  lastHitAt: timestamp({ withTimezone: true }),
  note: text(),
  meta: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps(),
});

/**
 * Duyuru açılır pencereleri (admin › Duyurular). Yalnızca isActive + [startsAt, endsAt) aralığında gösterilir;
 * bitiş tarihinden sonra kendiliğinden yayından kalkar. Ziyaretçi kapattıktan sonra aynı duyuru o tarayıcıda tekrar açılmaz.
 */
export const popups = pgTable("popups", {
  id: id(),
  title: text().notNull(),
  imageId: uuid().references(() => mediaAssets.id, { onDelete: "set null" }),
  /** Görsel metin içeriyorsa bu metin ekran okuyucular için alt metindir. */
  alt: text().notNull().default(""),
  linkUrl: text(),
  linkLabel: text(),
  startsAt: timestamp({ withTimezone: true }).notNull(),
  endsAt: timestamp({ withTimezone: true }).notNull(),
  isActive: boolean().notNull().default(true),
  /** Sayfa açıldıktan kaç ms sonra gösterilsin (LCP'yi etkilememesi için en az 1500). */
  delayMs: integer().notNull().default(2500),
  ...timestamps(),
});
