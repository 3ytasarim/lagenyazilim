import { getFile } from "@/lib/storage";

/**
 * Medya kütüphanesi dosyalarını sunar (storage/public). Üretimde Nginx aynı klasörü doğrudan sunabilir;
 * bu rota yedek ve geliştirme içindir. Dosyalar içerik adresli (id klasörü) olduğundan uzun süre önbelleğe alınır.
 */
const TYPES: Record<string, string> = { webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", avif: "image/avif" };

export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const rel = key.join("/");
  if (!/^media\/[0-9a-f-]{36}\/[\w.-]+$/.test(rel)) return new Response("Not found", { status: 404 });
  const ext = rel.split(".").pop()?.toLowerCase() ?? "";
  const type = TYPES[ext];
  if (!type) return new Response("Not found", { status: 404 });
  const data = await getFile("public", rel);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
