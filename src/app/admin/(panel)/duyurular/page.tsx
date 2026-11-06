import { desc, inArray } from "drizzle-orm";
import { PopupManager, type PopupRow } from "@/components/admin/forms/PopupManager";
import { AdminPage, fmtDateTime } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mediaAssets, popups } from "@/lib/db/schema";
import { mediaUrl } from "@/lib/media";

export const metadata = { title: "Duyurular" };

/** Date → datetime-local değeri (Türkiye saati, UTC+3). */
const toLocal = (d: Date) => new Date(d.getTime() + 3 * 3_600_000).toISOString().slice(0, 16);

export default async function PopupsAdmin() {
  const user = await requireUser("content");
  const rows = await db.select().from(popups).orderBy(desc(popups.startsAt));
  const ids = rows.map((r) => r.imageId).filter((x): x is string => !!x);
  const media = ids.length ? await db.select().from(mediaAssets).where(inArray(mediaAssets.id, ids)) : [];
  const now = new Date();
  const data: PopupRow[] = rows.map((r) => {
    const m = media.find((x) => x.id === r.imageId);
    const largest = m ? Object.entries(m.variants).sort((a, b) => Number(b[0]) - Number(a[0]))[0]?.[1] : undefined;
    return {
      id: r.id,
      title: r.title,
      image: m ? { id: m.id, url: mediaUrl(largest ?? `${m.storageKey}/full.webp`), alt: m.alt, width: m.width, height: m.height, variants: m.variants } : null,
      alt: r.alt,
      linkUrl: r.linkUrl,
      linkLabel: r.linkLabel,
      startsAt: toLocal(r.startsAt),
      endsAt: toLocal(r.endsAt),
      startsLabel: fmtDateTime(r.startsAt),
      endsLabel: fmtDateTime(r.endsAt),
      isActive: r.isActive,
      delayMs: r.delayMs,
      state: !r.isActive ? "off" : now < r.startsAt ? "scheduled" : now >= r.endsAt ? "ended" : "live",
    };
  });
  const start = new Date(now);
  start.setUTCSeconds(0, 0);
  const end = new Date(start.getTime() + 30 * 86_400_000);
  return (
    <AdminPage title="Duyurular" description="Sitede belirli tarihler arasında açılan duyuru pencereleri (kampanya, yeni site, tatil duyurusu vb.). Aynı anda birden fazla duyuru yayındaysa en son başlayan gösterilir.">
      <PopupManager csrf={user.csrfToken} rows={data} defaults={{ startsAt: toLocal(start), endsAt: toLocal(end) }} />
    </AdminPage>
  );
}
