import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { Section } from "@/components/ui/Section";
import { PAGE_SEO } from "@/content/seo";
import { buildMetadata } from "@/lib/seo/metadata";
import { cn, formatDate } from "@/lib/utils";
import { getPostCategories, getPosts } from "@/server/queries/content";

const PER_PAGE = 9;

type SP = { sayfa?: string; q?: string; kategori?: string };

function parsePage(v?: string) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePage(sp.sayfa);
  const { total } = await getPosts({ page: 1, perPage: PER_PAGE });
  return buildMetadata({
    path: page > 1 ? `/blog/?sayfa=${page}` : "/blog/",
    title: page > 1 ? `Blog ve Rehberler – Sayfa ${page}` : PAGE_SEO.blog.title,
    absoluteTitle: page === 1,
    description: PAGE_SEO.blog.description,
    keywords: PAGE_SEO.blog.keywords,
    // Arama sonuçları indekslenmez; yazı yokken liste de indekslenmez.
    index: total > 0 && !sp.q,
  });
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = parsePage(sp.sayfa);
  const q = sp.q?.trim().slice(0, 80) || undefined;
  const [{ items, total }, categories] = await Promise.all([getPosts({ page, category: sp.kategori, q, perPage: PER_PAGE }), getPostCategories()]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  // İlk sayfada filtre yokken en yeni yazı öne çıkarılır
  const featured = page === 1 && !q && !sp.kategori && items.length > 3 ? items[0] : null;
  const rest = featured ? items.slice(1) : items;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (sp.kategori) params.set("kategori", sp.kategori);
    if (q) params.set("q", q);
    if (p > 1) params.set("sayfa", String(p));
    const s = params.toString();
    return `/blog/${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        crumbs={[{ name: "Blog", path: "/blog/" }]}
        eyebrow="Bilgi merkezi"
        title="Blog ve rehberler"
        lead="Web sitesi yaptırmadan, yazılım seçmeden ya da SEO ajansıyla çalışmaya başlamadan önce bilmeniz gerekenler."
      >
        <form role="search" action="/blog/" className="mt-10 flex max-w-xl items-center gap-2 rounded-full border border-line-strong bg-surface p-1.5 pl-5 focus-within:border-brand">
          <Search aria-hidden className="size-4 shrink-0 text-ink-soft" />
          <label htmlFor="blog-q" className="sr-only">
            Yazılarda ara
          </label>
          <input id="blog-q" name="q" type="search" defaultValue={q} placeholder="Yazılarda ara" className="h-10 min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-soft" />
          <button type="submit" className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-bg">
            Ara
          </button>
        </form>
      </PageHeader>

      <Section>
        {categories.length > 0 ? (
          <nav aria-label="Kategoriler" className="mb-12 flex flex-wrap gap-2">
            <Link href="/blog/" className={cn("rounded-full border px-4 py-2 text-sm font-medium transition-colors", !sp.kategori ? "border-brand bg-brand text-on-brand" : "border-line-strong hover:border-brand hover:text-brand")}>
              Tümü
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/blog/?kategori=${c.slug}`}
                className={cn("rounded-full border px-4 py-2 text-sm font-medium transition-colors", sp.kategori === c.slug ? "border-brand bg-brand text-on-brand" : "border-line-strong hover:border-brand hover:text-brand")}
              >
                {c.name}
              </Link>
            ))}
          </nav>
        ) : null}

        {items.length > 0 ? (
          <>
            {featured ? (
              <Link href={`/blog/${featured.slug}/`} className="reveal group mb-16 grid overflow-hidden rounded-[28px] border border-line bg-surface transition-[box-shadow,border-color] duration-500 hover:border-brand/50 hover:shadow-float md:grid-cols-2" data-reveal="scale">
                <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-brand-tint to-surface-2 md:aspect-auto md:min-h-[360px]">
                  {featured.cover ? (
                    <Image src={featured.cover.src} alt={featured.cover.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-105" />
                  ) : null}
                  <span className="absolute top-5 left-5 rounded-full bg-deep/80 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase backdrop-blur">Öne çıkan</span>
                </div>
                <div className="flex flex-col justify-center p-7 md:p-12">
                  <p className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
                    {featured.category ? <span className="font-semibold text-brand">{featured.category.name}</span> : null}
                    <time dateTime={featured.publishedAt}>{formatDate(featured.publishedAt)}</time>
                    <span aria-hidden>·</span>
                    <span>{featured.readingMinutes} dk okuma</span>
                  </p>
                  <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance transition-colors group-hover:text-brand md:text-4xl">{featured.title}</h2>
                  <p className="mt-4 line-clamp-3 text-lead text-ink-muted">{featured.excerpt}</p>
                  <span className="mt-8 inline-flex items-center gap-2 font-semibold text-brand">
                    Yazıyı okuyun <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ) : null}
            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p, i) => (
                <div key={p.slug} className="reveal" style={{ "--d": i % 3 } as React.CSSProperties}>
                  <PostCard post={p} />
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} hrefFor={hrefFor} />
          </>
        ) : q ? (
          <EmptyState title="Sonuç bulunamadı" text={`"${q}" için yazı bulamadık. Farklı bir kelimeyle aramayı deneyin.`} action={<ButtonLink href="/blog/" variant="secondary">Tüm yazılar</ButtonLink>} />
        ) : (
          <EmptyState
            title="İlk rehberler hazırlanıyor"
            text="Web tasarım, özel yazılım ve SEO kararlarınızı kolaylaştıracak rehberler üzerinde çalışıyoruz. Bu arada sorunuzu doğrudan bize iletebilirsiniz."
            action={<ButtonLink href="/iletisim/">Bize yazın</ButtonLink>}
          />
        )}
      </Section>
    </>
  );
}
