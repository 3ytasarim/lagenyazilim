import "server-only";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

/** Kişisel veri içerebilecek alanlar audit diff'ine yazılmadan maskelenir. */
const MASK = new Set(["email", "phone", "contactName", "passwordHash", "password", "totpSecret", "smtpPass", "pass"]);

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, MASK.has(k) ? "•••" : typeof v === "string" && v.length > 500 ? `${v.slice(0, 500)}…` : scrub(v)]),
    );
  }
  return value;
}

export async function audit(input: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  diff?: Record<string, unknown>;
  ipHash?: string | null;
}) {
  await db.insert(auditLogs).values({
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    diff: input.diff ? scrub(input.diff) : null,
    ipHash: input.ipHash ?? null,
  });
}

/** İki nesne arasındaki değişen alanlar (üst seviye). */
export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>) {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const k of Object.keys(after)) {
    if (k === "updatedAt") continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) out[k] = { from: before[k], to: after[k] };
  }
  return out;
}
