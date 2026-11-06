import { desc, sql } from "drizzle-orm";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { AdminPage, fmtDateTime } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { mediaUrl } from "@/lib/media";

export const metadata = { title: "Medya" };

export default async function MediaAdmin() {
  const user = await requireUser("content");
  const [rows, [missing]] = await Promise.all([
    db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(200),
    db.select({ n: sql<number>`count(*)::int` }).from(mediaAssets).where(sql`${mediaAssets.alt} = ''`),
  ]);
  const items = rows.map((r) => ({
    id: r.id,
    thumb: mediaUrl(r.variants["480"] ?? Object.values(r.variants)[0] ?? ""),
    alt: r.alt,
    caption: r.caption,
    name: r.originalName,
    width: r.width,
    height: r.height,
    sizeKb: Math.round(r.sizeBytes / 1024),
    createdAt: fmtDateTime(r.createdAt),
  }));
  return (
    <AdminPage title="Medya kütüphanesi" description={missing?.n ? `${missing.n} görselin alt metni eksik.` : "Tüm görsellerin alt metni var."}>
      <MediaLibrary csrf={user.csrfToken} items={items} />
    </AdminPage>
  );
}
