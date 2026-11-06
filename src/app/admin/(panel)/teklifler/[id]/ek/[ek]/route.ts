import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { quoteAttachments } from "@/lib/db/schema";
import { requestMeta } from "@/lib/request-meta";
import { getFile } from "@/lib/storage";
import { audit } from "@/server/services/audit";

/**
 * Teklif eki indirme — dosyalar storage/private altında, yalnızca yetkili kullanıcıya sunulur.
 * Her zaman "attachment" olarak indirilir (tarayıcıda yürütülmez).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; ek: string }> }) {
  const user = await requireUser("crm");
  const { id, ek } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^[0-9a-f-]{36}$/.test(ek)) return new Response("Not found", { status: 404 });
  const [att] = await db.select().from(quoteAttachments).where(and(eq(quoteAttachments.id, ek), eq(quoteAttachments.quoteId, id))).limit(1);
  if (!att) return new Response("Not found", { status: 404 });
  const data = await getFile("private", att.storageKey);
  if (!data) return new Response("Dosya depoda bulunamadı", { status: 410 });
  const { ipHash } = await requestMeta();
  await audit({ actorId: user.id, action: "quote.attachment_download", entityType: "quote", entityId: id, diff: { file: att.originalName }, ipHash });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": att.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(att.originalName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
