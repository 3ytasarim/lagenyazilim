import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/lib/db";
import * as schema from "../src/lib/db/schema";
import { readingMinutes, renderRichHtml } from "../src/lib/content/html";
import { mediaUrl } from "../src/lib/media";
import { createMediaAsset } from "../src/server/services/media";
import { slugify } from "../src/lib/utils";

/*
 * Blog yazıları: src/content/data/blog-posts/*.json → blog_posts (+ etiketler, kapak ve gövde görselleri).
 * - Görseller yalnızca images.unsplash.com'dan indirilir, medya kütüphanesine WebP varyantlarıyla kaydedilir.
 * - Aynı slug varsa yazı güncellenir (taslak → yayın). Kalan taslaklara dokunulmaz.
 * - Görsel kaynakları docs/image-credits.md'ye eklenir.
 * Varsayılan kuru çalıştırma; yazmak için --publish. Çalıştırma: npx tsx --conditions react-server scripts/import-blog-posts.ts --publish
 */
type Img = { url: string; alt: string; pageUrl?: string; photographer?: string; afterHeadingId?: string };
type PostJson = {
  slug: string;
  category: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  tags: string[];
  excerpt: string;
  html: string;
  faqs: { q: string; a: string }[];
  sources: { title: string; url: string }[];
  images: { cover: Img; inline?: Img[] };
};

const WRITE = process.argv.includes("--publish");
const AUTHOR = {
  slug: "lagen-yazilim-ekibi",
  name: "Lagen Yazılım Ekibi",
  jobTitle: "Web tasarım, yazılım ve SEO ekibi",
  bio: "Ankara Çankaya'daki ekibimiz kurumsal web siteleri, özel yazılımlar ve SEO projeleri üzerinde çalışıyor. Yazılarımızda projelerde sık karşılaştığımız soruları sade bir dille yanıtlıyoruz.",
};

async function download(img: Img): Promise<Buffer> {
  const u = new URL(img.url);
  if (u.hostname !== "images.unsplash.com") throw new Error(`İzin verilmeyen görsel kaynağı: ${u.hostname}`);
  u.searchParams.set("w", "2000");
  u.searchParams.set("fm", "jpg");
  const res = await fetch(u);
  if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) throw new Error(`Görsel indirilemedi: ${img.url} (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function main() {
  const dir = path.resolve("src/content/data/blog-posts");
  const posts: PostJson[] = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  console.log(`${posts.length} yazı bulundu`);
  if (!WRITE) {
    for (const p of posts) console.log(`- ${p.slug}: "${p.seoTitle}" (${p.seoTitle.length}) · ${p.seoDescription.length} kr · etiket ${p.tags.length} · görsel ${1 + (p.images.inline?.length ?? 0)}`);
    console.log("Kuru çalıştırma — yazmak için --publish");
    return;
  }

  const cats = await db.select({ id: schema.blogCategories.id, slug: schema.blogCategories.slug }).from(schema.blogCategories);
  const catId = new Map(cats.map((c) => [c.slug, c.id]));
  let [author] = await db.select().from(schema.authors).where(eq(schema.authors.slug, AUTHOR.slug)).limit(1);
  if (!author) [author] = await db.insert(schema.authors).values(AUTHOR).returning();

  const credits: string[] = [];
  const now = Date.now();
  for (const [i, p] of posts.entries()) {
    // Kapak
    const coverBuf = await download(p.images.cover);
    const cover = await createMediaAsset({ buf: coverBuf, name: `${p.slug}-kapak.jpg`, alt: p.images.cover.alt });
    credits.push(`| blog: ${p.slug} (kapak) | ${p.images.cover.photographer ?? "—"} | ${p.images.cover.pageUrl ?? p.images.cover.url} |`);

    // Gövde görselleri: ilgili h2'den sonra <figure>
    let html = p.html;
    for (const im of p.images.inline ?? []) {
      const buf = await download(im);
      const m = await createMediaAsset({ buf, name: `${p.slug}-gorsel.jpg`, alt: im.alt });
      const largest = Object.entries(m.variants).sort((a, b) => Number(b[0]) - Number(a[0]))[0]![1];
      const fig = `<figure><img src="${mediaUrl(largest)}" alt="${esc(im.alt)}" width="${m.width}" height="${m.height}" /></figure>`;
      const re = im.afterHeadingId ? new RegExp(`(<h2[^>]*id="${im.afterHeadingId}"[^>]*>[\\s\\S]*?</h2>)`) : null;
      html = re && re.test(html) ? html.replace(re, `$1${fig}`) : html.replace(/(<\/h2>)/, `$1${fig}`);
      credits.push(`| blog: ${p.slug} (gövde) | ${im.photographer ?? "—"} | ${im.pageUrl ?? im.url} |`);
    }
    // SSS gövdenin sonunda (yanıt motorları için soru-cevap biçimi)
    if (p.faqs.length) html += `<h2>Sık sorulan sorular</h2>${p.faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}`;
    const rendered = renderRichHtml(html);

    // Yayın tarihleri sırayla birer gün arayla (en yeni = listedeki ilk yazı)
    const publishedAt = new Date(now - i * 86_400_000);
    const values = {
      title: p.title,
      excerpt: p.excerpt,
      bodyHtml: rendered.html,
      toc: rendered.toc,
      coverImageId: cover.id,
      ogImageId: cover.id,
      authorId: author!.id,
      categoryId: catId.get(p.category) ?? null,
      sources: p.sources,
      readingMinutes: readingMinutes(rendered.html),
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      focusKeyword: p.focusKeyword,
      secondaryKeywords: p.secondaryKeywords,
      robotsIndex: true,
      robotsFollow: true,
      status: "published" as const,
      publishedAt,
      updatedAt: new Date(),
    };
    const [existing] = await db.select({ id: schema.blogPosts.id }).from(schema.blogPosts).where(eq(schema.blogPosts.slug, p.slug)).limit(1);
    const postId = existing
      ? (await db.update(schema.blogPosts).set(values).where(eq(schema.blogPosts.id, existing.id)).returning({ id: schema.blogPosts.id }))[0]!.id
      : (await db.insert(schema.blogPosts).values({ slug: p.slug, ...values }).returning({ id: schema.blogPosts.id }))[0]!.id;

    // Etiketler
    const tagRows = [];
    for (const name of p.tags) {
      const slug = slugify(name);
      const [t] = await db.insert(schema.blogTags).values({ slug, name }).onConflictDoUpdate({ target: schema.blogTags.slug, set: { name } }).returning();
      tagRows.push(t!);
    }
    await db.delete(schema.blogPostTags).where(eq(schema.blogPostTags.postId, postId));
    if (tagRows.length) await db.insert(schema.blogPostTags).values(tagRows.map((t) => ({ postId, tagId: t.id })));
    console.log(`✓ ${p.slug} (${values.readingMinutes} dk, ${tagRows.length} etiket)`);
  }

  const creditsFile = path.resolve("docs/image-credits.md");
  const prev = fs.readFileSync(creditsFile, "utf8");
  const block = `\n## Blog görselleri (Unsplash Lisansı)\n\n| Kullanım | Fotoğrafçı | Kaynak |\n|---|---|---|\n${credits.join("\n")}\n`;
  fs.writeFileSync(creditsFile, prev.replace(/\n## Blog görselleri[\s\S]*$/, "") + block);
  const unused = await db.select({ slug: schema.blogPosts.slug }).from(schema.blogPosts).where(inArray(schema.blogPosts.status, ["draft"]));
  console.log(`Taslakta kalan yazılar: ${unused.map((u) => u.slug).join(", ") || "yok"}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
