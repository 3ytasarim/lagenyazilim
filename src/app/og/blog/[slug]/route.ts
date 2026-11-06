import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getFile } from "@/lib/storage";
import { getPost } from "@/server/queries/content";

/**
 * Blog yazısı paylaşım görseli (1200×630 JPEG): kapak görseli + alt kısımda koyu geçiş + sol üstte logo.
 * WhatsApp ve bazı sosyal ağlar WebP önizlemesini güvenilir göstermediği için JPEG üretilir.
 * Logo, WhatsApp'ın kare kırpmasında da görünmesi için kare alanın (ortadaki 630 px) içine yerleştirilir.
 */
export const revalidate = 86400;

const W = 1200;
const H = 630;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post?.cover) return new Response("Not found", { status: 404 });
  const key = post.cover.src.replace(/^\/media\//, "");
  const src = await getFile("public", key);
  if (!src) return new Response("Not found", { status: 404 });

  const logo = await sharp(await readFile(path.join(process.cwd(), "public/brand/lagen-logo-dark.png")))
    .resize({ height: 92 })
    .png()
    .toBuffer();
  const logoMeta = await sharp(logo).metadata();
  const pad = 26;
  const pill = Buffer.from(
    `<svg width="${logoMeta.width! + pad * 2}" height="${logoMeta.height! + pad * 1.4}"><rect width="100%" height="100%" rx="22" fill="#031b61" fill-opacity="0.82"/></svg>`,
  );
  const shade = Buffer.from(
    `<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#031b61" stop-opacity="0.15"/><stop offset="1" stop-color="#031b61" stop-opacity="0.75"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  const left = Math.round((W - 630) / 2) + 24; // kare kırpma alanının içinde
  const top = H - (logoMeta.height! + pad * 1.4) - 40;

  const jpg = await sharp(src)
    .resize(W, H, { fit: "cover", position: "attention" })
    .composite([
      { input: shade, left: 0, top: 0 },
      { input: pill, left, top: Math.round(top) },
      { input: logo, left: left + pad, top: Math.round(top + pad * 0.7) },
    ])
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
