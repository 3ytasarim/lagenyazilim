import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { MEDIA_WIDTHS } from "@/lib/media";
import { putFile } from "@/lib/storage";

export class MediaError extends Error {}

/**
 * Görseli WebP varyantlarına (480/960/1600 + en fazla 2400 px) dönüştürür, bulanık önizleme üretir
 * ve medya kütüphanesine kaydeder. Admin yüklemesi ve içerik içe aktarma betikleri aynı yolu kullanır.
 */
export async function createMediaAsset(input: { buf: Buffer; name: string; alt: string; caption?: string | null; createdById?: string | null }) {
  const id = randomUUID();
  const base = sharp(input.buf, { failOn: "error" }).rotate(); // EXIF yönünü uygula, meta veriyi at
  const meta = await base.metadata();
  if (!meta.width || !meta.height) throw new MediaError(`${input.name}: görsel okunamadı.`);
  if (meta.width * meta.height > 50_000_000) throw new MediaError(`${input.name}: çözünürlük çok yüksek.`);

  const variants: Record<string, string> = {};
  const widths = MEDIA_WIDTHS.filter((w) => w < meta.width!);
  for (const w of [...widths, Math.min(meta.width, 2400)]) {
    const key = `media/${id}/${w}.webp`;
    await putFile("public", key, await base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer());
    variants[String(w)] = key;
  }
  const blur = await base.clone().resize(16).webp({ quality: 40 }).toBuffer();
  const finalW = Math.min(meta.width, 2400);
  const [row] = await db
    .insert(mediaAssets)
    .values({
      id,
      storageKey: `media/${id}`,
      originalName: input.name.slice(0, 200),
      mime: "image/webp",
      sizeBytes: input.buf.length,
      width: finalW,
      height: Math.round((meta.height * finalW) / meta.width),
      alt: input.alt.trim().slice(0, 300),
      caption: input.caption ?? null,
      variants,
      blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
      createdById: input.createdById ?? null,
    })
    .returning();
  return row!;
}
