import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, ExternalLink, ListTree } from "lucide-react";
import { AnimatedWords } from "@/components/ui/AnimatedWords";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { KeywordBanner, KeywordTags } from "@/components/ui/KeywordBanner";
import { formatDate } from "@/lib/utils";
import type { PostSummary } from "@/types/content";
import { PostCard } from "./PostCard";

export type ArticleData = PostSummary & {
  /** Sunucuda sanitize edilmiş HTML (başlıklara id eklenmiş). */
  html: string;
  toc: { id: string; text: string; level: number }[];
  author: { name: string; slug: string; jobTitle: string | null; bio: string | null } | null;
  sources: { title: string; url: string }[];
  tags?: { slug: string; name: string }[];
  seo?: { keywords?: string[] };
};

/** Tekil blog yazısı: içerik + sağda yapışkan kenar çubuğu (içindekiler, diğer yazılar, teklif kartı). */
export function ArticleLayout({ post, related, others }: { post: ArticleData; related: PostSummary[]; others: PostSummary[] }) {
  const updated = post.updatedAt.slice(0, 10) !== post.publishedAt.slice(0, 10);
  const tagNames = post.tags?.map((t) => t.name) ?? [];
  const keywords = [...(post.seo?.keywords ?? []), ...tagNames];
  return (
    <article>
      <header className="under-header relative isolate overflow-hidden border-b border-line">
        <div aria-hidden className="orbs">
          <span />
          <span />
          <span />
        </div>
        <div className="container-site pt-8 pb-12 md:pt-10 md:pb-16">
          <Breadcrumb
            items={[
              { name: "Blog", path: "/blog/" },
              ...(post.category ? [{ name: post.category.name, path: `/blog/?kategori=${post.category.slug}` }] : []),
              { name: post.title, path: `/blog/${post.slug}/` },
            ]}
          />
          <div className="mt-12 max-w-4xl">
            {post.category ? (
              <Link
                href={`/blog/?kategori=${post.category.slug}`}
                className="fade-rise inline-flex items-center rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-sm font-semibold text-brand backdrop-blur transition-colors hover:border-brand"
              >
                {post.category.name}
              </Link>
            ) : null}
            <h1 className="mt-6 text-h1 text-balance">
              <AnimatedWords text={post.title} />
            </h1>
            <p className="fade-rise mt-6 max-w-[62ch] text-lead text-ink-muted" style={{ "--d": 3 } as React.CSSProperties}>
              {post.excerpt}
            </p>
            <div className="fade-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-muted" style={{ "--d": 4 } as React.CSSProperties}>
              {post.author ? (
                <span className="inline-flex items-center gap-2.5">
                  <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-cyan font-display text-sm font-semibold text-white">
                    {post.author.name.charAt(0)}
                  </span>
                  <span className="font-medium text-ink">{post.author.name}</span>
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden className="size-4 text-brand" />
                <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              </span>
              {updated ? (
                <span>
                  Güncelleme: <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden className="size-4 text-brand" />
                {post.readingMinutes} dk okuma
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container-site grid gap-12 py-12 md:py-16 lg:grid-cols-12 lg:gap-14">
        <div className="min-w-0 lg:col-span-8">
          {post.cover ? (
            <div className="fade-rise relative mb-12 overflow-hidden rounded-[24px] border border-line" style={{ "--d": 2 } as React.CSSProperties}>
              <Image src={post.cover.src} alt={post.cover.alt} width={post.cover.width} height={post.cover.height} priority sizes="(min-width: 1024px) 820px, 100vw" className="h-auto w-full" />
            </div>
          ) : null}

          <div className="prose prose-lg prose-site article-body" dangerouslySetInnerHTML={{ __html: post.html }} />

          <KeywordTags keywords={tagNames.length ? tagNames : (post.seo?.keywords ?? [])} hrefFor={(k) => `/blog/?q=${encodeURIComponent(k)}`} className="mt-14 border-t border-line pt-8" />

          {post.sources.length > 0 ? (
            <section aria-labelledby="sources-h" className="mt-12 rounded-[20px] border border-line bg-surface p-6 md:p-8">
              <h2 id="sources-h" className="text-lg font-semibold">
                Kaynaklar
              </h2>
              <ol className="mt-4 grid gap-2 text-[0.9375rem]">
                {post.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-brand hover:underline" data-event="outbound_click">
                      {s.title} <ExternalLink aria-hidden className="size-3.5" />
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {post.author ? (
            <section aria-label="Yazar" className="spotlight mt-8 flex gap-5 rounded-[20px] border border-line bg-surface p-6">
              <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-cyan font-display text-xl text-white">
                {post.author.name.charAt(0)}
              </span>
              <div>
                <p className="font-semibold">{post.author.name}</p>
                {post.author.jobTitle ? <p className="text-sm text-ink-soft">{post.author.jobTitle}</p> : null}
                {post.author.bio ? <p className="mt-2 text-[0.9375rem] text-ink-muted">{post.author.bio}</p> : null}
              </div>
            </section>
          ) : null}
        </div>

        {/* Kenar çubuğu */}
        <aside className="min-w-0 lg:col-span-4">
          <div className="grid gap-6 lg:sticky lg:top-[calc(var(--header-h)+24px)]">
            {post.toc.length > 2 ? (
              <nav aria-label="İçindekiler" className="rounded-[20px] border border-line bg-surface p-6">
                <p className="flex items-center gap-2 font-semibold">
                  <ListTree aria-hidden className="size-4 text-brand" /> İçindekiler
                </p>
                <ol className="mt-4 grid max-h-[34vh] gap-0.5 overflow-y-auto border-l border-line pr-1 text-[0.9375rem] [scrollbar-width:thin]">
                  {post.toc.map((t) => (
                    <li key={t.id} className={t.level > 2 ? "pl-3" : ""}>
                      <a href={`#${t.id}`} className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-ink-muted transition-colors hover:border-brand hover:text-ink">
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}

            {others.length > 0 ? (
              <nav aria-labelledby="other-posts-h" className="rounded-[20px] border border-line bg-surface p-6">
                <p id="other-posts-h" className="font-semibold">
                  Diğer yazılar
                </p>
                <ul className="mt-4 grid gap-1">
                  {others.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/blog/${p.slug}/`} className="group -mx-2 flex items-center gap-3.5 rounded-xl p-2 transition-colors hover:bg-surface-2">
                        <span className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-tint to-surface-2">
                          {p.cover ? (
                            <Image src={p.cover.src} alt="" fill sizes="64px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="line-clamp-2 text-[0.9375rem] leading-snug font-medium text-ink transition-colors group-hover:text-brand">{p.title}</span>
                          <span className="mt-1 block text-xs text-ink-soft">
                            {formatDate(p.publishedAt)} · {p.readingMinutes} dk
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/blog/" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                  Tüm yazılar <ArrowRight aria-hidden className="size-4" />
                </Link>
              </nav>
            ) : null}

            <div data-tone="deep" className="ring-gradient relative isolate overflow-hidden rounded-[20px] bg-deep p-6 text-on-deep">
              <div aria-hidden className="absolute -top-16 -right-16 -z-10 size-48 rounded-full bg-brand/40 blur-3xl" />
              <p className="font-display text-xl font-semibold">Bu konuda destek mi gerekiyor?</p>
              <p className="mt-2 text-sm text-on-deep-muted">Projenizi anlatın, ihtiyacınıza uygun yol haritasıyla dönelim.</p>
              <Link
                href="/proje-teklifi/"
                className="btn-shine mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-on-deep px-5 text-sm font-semibold text-deep"
                data-event="service_cta_click"
                data-cta="article-sidebar"
              >
                Proje Teklifi Al <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-posts-h" className="border-t border-line bg-surface-2/50 py-20">
          <div className="container-site">
            <h2 id="related-posts-h" className="text-h2">
              İlgili yazılar
            </h2>
            <div className="mt-10 grid gap-10 md:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <KeywordBanner keywords={keywords} title="Bu yazının anahtar konuları" />
    </article>
  );
}
