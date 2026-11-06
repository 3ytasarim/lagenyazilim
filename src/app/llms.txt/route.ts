import { absoluteUrl, formatAddress } from "@/lib/site";
import { getBusiness, getLatestPosts, getServices } from "@/server/queries/content";

export const revalidate = 3600;

/**
 * llms.txt — yapay zekâ asistanları için kısa, doğrulanabilir şirket özeti (llmstxt.org biçimi).
 * İçerik yalnızca site ayarları ve yayındaki sayfalardan üretilir; iddia veya rakam eklenmez.
 */
export async function GET() {
  const [b, services, posts] = await Promise.all([getBusiness(), getServices(), getLatestPosts(10)]);
  const lines = [
    `# ${b.name}`,
    "",
    `> ${b.name}, Türkiye genelindeki işletmelere web tasarım, özel yazılım, SEO ve dijital pazarlama hizmetleri sunan, Ankara merkezli bir ekiptir. Ofis: ${formatAddress(b)}. Diğer illerdeki işletmelerle süreci çevrim içi yürütür.`,
    "",
    "## İletişim",
    `- Telefon: ${b.phone}`,
    `- E-posta: ${b.email}`,
    `- Teklif formu: ${absoluteUrl("/proje-teklifi/")}`,
    `- İletişim: ${absoluteUrl("/iletisim/")}`,
    "",
    "## Hizmetler",
    ...services.map((s) => `- [${s.name}](${absoluteUrl(`/${s.slug}/`)}): ${s.summary}`),
    "",
    "## Kurumsal",
    `- [Hakkımızda](${absoluteUrl("/hakkimizda/")})`,
    `- [Sektöre göre çözümler](${absoluteUrl("/cozumler/")})`,
    `- [Hizmet bölgeleri (Türkiye geneli)](${absoluteUrl("/hizmet-bolgeleri/")})`,
    `- [Ankara ve ilçeleri](${absoluteUrl("/hizmet-bolgeleri/ankara/")})`,
    ...(posts.length ? ["", "## Rehberler", ...posts.map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}/`)}): ${p.excerpt}`)] : []),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" } });
}
