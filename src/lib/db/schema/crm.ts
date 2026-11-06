import { boolean, index, integer, jsonb, pgSequence, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { id, leadSource, leadStatus, notificationStatus, quoteStatus, timestamps } from "./_shared";

export const quoteNumberSeq = pgSequence("quote_number_seq", { startWith: 1001 });

export type QuoteExtraField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect" | "number";
  options?: string[];
  required?: boolean;
};

/** Teklif sihirbazının 1. adımındaki hizmet seçenekleri (admin'den yönetilir). */
export const quoteServiceOptions = pgTable("quote_service_options", {
  id: id(),
  key: text().notNull().unique(),
  label: text().notNull(),
  description: text(),
  /** Bu hizmet seçildiğinde 2. adımda sorulacak ek alanlar. */
  extraFields: jsonb().$type<QuoteExtraField[]>().notNull().default([]),
  sortOrder: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  ...timestamps(),
});

export const budgetRanges = pgTable("budget_ranges", {
  id: id(),
  label: text().notNull(),
  minTry: integer(),
  maxTry: integer(),
  sortOrder: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  ...timestamps(),
});

export const quoteRequests = pgTable(
  "quote_requests",
  {
    id: id(),
    /** Kullanıcıya gösterilen numara: LGN-2026-001001 */
    number: text().notNull().unique(),
    serviceKeys: text().array().notNull(),
    companyName: text().notNull().default(""),
    projectName: text().notNull().default(""),
    currentWebsite: text(),
    sector: text().notNull().default(""),
    goal: text().notNull().default(""),
    needs: text().notNull(),
    features: text().array().notNull().default([]),
    referenceSites: text().array().notNull().default([]),
    /** Hizmete göre dinamik soruların cevapları. */
    extra: jsonb().$type<Record<string, string | string[]>>().notNull().default({}),
    budgetRangeId: uuid().references(() => budgetRanges.id, { onDelete: "set null" }),
    /** Seçim anındaki etiketin kopyası — aralık sonradan değişse de kayıt anlamını korur. */
    budgetLabel: text(),
    startTiming: text(),
    targetDate: text(),
    priority: text(),
    contactName: text().notNull(),
    email: text().notNull(),
    phone: text().notNull(),
    contactCompany: text(),
    city: text(),
    district: text(),
    preferredContact: text().notNull().default("email"),
    kvkkAcceptedAt: timestamp({ withTimezone: true }).notNull(),
    kvkkVersion: text().notNull(),
    explicitConsentAt: timestamp({ withTimezone: true }),
    status: quoteStatus().notNull().default("new"),
    assignedToId: uuid().references(() => users.id, { onDelete: "set null" }),
    tags: text().array().notNull().default([]),
    /** Çift gönderim koruması: istemcinin ürettiği tek kullanımlık anahtar. */
    idempotencyKey: text().notNull().unique(),
    ipHash: text(),
    userAgent: text(),
    utm: jsonb().$type<Record<string, string>>().notNull().default({}),
    sourcePath: text(),
    ...timestamps(),
  },
  (t) => [index().on(t.status, t.createdAt), index().on(t.email)],
);

export const quoteAttachments = pgTable("quote_attachments", {
  id: id(),
  quoteId: uuid()
    .notNull()
    .references(() => quoteRequests.id, { onDelete: "cascade" }),
  /** storage/private altında — public klasöre asla yazılmaz, yalnızca yetkili indirme rotasından sunulur. */
  storageKey: text().notNull().unique(),
  originalName: text().notNull(),
  mime: text().notNull(),
  sizeBytes: integer().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const quoteStatusHistory = pgTable(
  "quote_status_history",
  {
    id: id(),
    quoteId: uuid()
      .notNull()
      .references(() => quoteRequests.id, { onDelete: "cascade" }),
    fromStatus: quoteStatus(),
    toStatus: quoteStatus().notNull(),
    changedById: uuid().references(() => users.id, { onDelete: "set null" }),
    note: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.quoteId, t.createdAt)],
);

export const quoteNotes = pgTable(
  "quote_notes",
  {
    id: id(),
    quoteId: uuid()
      .notNull()
      .references(() => quoteRequests.id, { onDelete: "cascade" }),
    authorId: uuid().references(() => users.id, { onDelete: "set null" }),
    /** note | call | email | meeting — görüşme geçmişi aynı akışta tutulur. */
    kind: text().notNull().default("note"),
    body: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.quoteId, t.createdAt)],
);

/** İletişim formu ve ücretsiz SEO analizi talepleri. */
export const leads = pgTable(
  "leads",
  {
    id: id(),
    source: leadSource().notNull(),
    name: text().notNull(),
    company: text(),
    email: text().notNull(),
    phone: text(),
    website: text(),
    goal: text(),
    subject: text(),
    message: text().notNull().default(""),
    kvkkAcceptedAt: timestamp({ withTimezone: true }).notNull(),
    kvkkVersion: text().notNull(),
    status: leadStatus().notNull().default("new"),
    assignedToId: uuid().references(() => users.id, { onDelete: "set null" }),
    adminNote: text(),
    idempotencyKey: text().notNull().unique(),
    ipHash: text(),
    sourcePath: text(),
    ...timestamps(),
  },
  (t) => [index().on(t.source, t.status, t.createdAt)],
);

/** Gönderilen her e-postanın durumu — gönderim başarısız olsa da kayıt kaybolmaz. */
export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    channel: text().notNull().default("email"),
    template: text().notNull(),
    recipient: text().notNull(),
    subject: text().notNull(),
    relatedType: text(),
    relatedId: uuid(),
    status: notificationStatus().notNull().default("pending"),
    attempts: integer().notNull().default(0),
    lastError: text(),
    sentAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.status, t.createdAt), index().on(t.relatedType, t.relatedId)],
);
