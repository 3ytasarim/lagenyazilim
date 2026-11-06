import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { id, timestamps, userRole } from "./_shared";

export const users = pgTable("users", {
  id: id(),
  email: text().notNull().unique(),
  name: text().notNull(),
  passwordHash: text().notNull(),
  role: userRole().notNull().default("editor"),
  isActive: boolean().notNull().default(true),
  /** AES-256-GCM ile şifrelenmiş TOTP sırrı; null = 2FA kapalı. */
  totpSecret: text(),
  /** Son kabul edilen TOTP zaman adımı — aynı kodun tekrar kullanımını engeller. */
  totpLastStep: integer(),
  failedLogins: integer().notNull().default(0),
  lockedUntil: timestamp({ withTimezone: true }),
  lastLoginAt: timestamp({ withTimezone: true }),
  ...timestamps(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Çerezdeki token'ın SHA-256 özeti; ham token veritabanında tutulmaz. */
    tokenHash: text().notNull().unique(),
    csrfToken: text().notNull(),
    userAgent: text(),
    ipHash: text(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.userId), index().on(t.expiresAt)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: id(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text().notNull().unique(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  usedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorId: uuid().references(() => users.id, { onDelete: "set null" }),
    action: text().notNull(),
    entityType: text().notNull(),
    entityId: text(),
    /** Yalnızca değişen alanlar; kişisel veri içeren alanlar maskelenir. */
    diff: jsonb(),
    ipHash: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.entityType, t.entityId), index().on(t.createdAt)],
);

/** Çoklu PM2 süreci arasında ortak çalışan sabit pencere sayaç. */
export const rateLimits = pgTable("rate_limits", {
  key: text().primaryKey(),
  count: integer().notNull().default(0),
  resetAt: timestamp({ withTimezone: true }).notNull(),
});
