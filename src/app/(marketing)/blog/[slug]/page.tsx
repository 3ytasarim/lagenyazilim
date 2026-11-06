import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/blog/ArticleLayout";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { ORG_ID, graph } from "@/lib/seo/schema";
import { absoluteUrl } from "@/lib/site";
import { getLatestPosts, getPost, getPosts } from "@/server/queries/content";

/* Yalnızca yayımlanmış (published + publishedAt ≤ şimdi) yazılar; aksi halde gerçek 404. */
export const dynamicParams = true;

export async function generateStaticParams() {
  const { items } = await getPosts({ page: 1, perPage: 50 });
  return items.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return {};
  const image = post.ogImage ?? post.cover;
  return buildMetadata({
    path: `/blog/${post.slug}/`,
    title: post.seo.seoTitle ?? post.title,
    description: post.seo.seoDescription ?? post.excerpt,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    // Paylaşım görseli JPEG (WhatsApp WebP önizlemeyi güvenilir göstermez): kapak + logo, 1200×630
    image: image ? { url: `/og/blog/${post.slug}/`, width: 1200, height: 630, alt: image.alt } : null,
    canonicalOverride: post.seo.canonicalOverride,
    keywords: post.seo.keywords,
    index: post.seo.robotsIndex,
    follow: post.seo.robotsFollow,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();
  const latest = await getLatestPosts(7);
  const others = latest.filter((p) => p.slug !== post.slug).slice(0, 5);
  const url = absoluteUrl(`/blog/${post.slug}/`);

  // Person yalnızca doğrulanmış gerçek yazarlar için; aksi halde yazar kurumdur
  const author = post.author?.isVerified
    ? { "@type": "Person", name: post.author.name, ...(post.author.jobTitle ? { jobTitle: post.author.jobTitle } : {}), ...(post.author.sameAs.length ? { sameAs: post.author.sameAs } : {}) }
    : { "@id": ORG_ID };

  return (
    <>
      <ArticleLayout post={post} related={post.related} others={others} />
      <JsonLd
        data={graph({
          "@type": "BlogPosting",
          "@id": `${url}#article`,
          headline: post.title,
          description: post.excerpt,
          url,
          mainEntityOfPage: url,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          inLanguage: "tr-TR",
          author,
          publisher: { "@id": ORG_ID },
          ...(post.cover ? { image: absoluteUrl(post.cover.src) } : {}),
          ...(post.category ? { articleSection: post.category.name } : {}),
          ...(post.seo.keywords?.length || post.tags.length ? { keywords: [...new Set([...(post.seo.keywords ?? []), ...post.tags.map((t) => t.name)])].join(", ") } : {}),
          ...(post.sources.length ? { citation: post.sources.map((s) => s.url) } : {}),
        })}
      />
    </>
  );
}
