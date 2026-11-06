import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { PostSummary } from "@/types/content";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <article className="group reveal flex flex-col">
      <Link href={`/blog/${post.slug}/`} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] border border-line bg-surface-2">
          {post.cover ? (
            <Image
              src={post.cover.src}
              alt={post.cover.alt}
              fill
              sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
            />
          ) : (
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-brand-tint via-surface-2 to-surface" />
          )}
        </div>
        <div className="mt-5 flex items-center gap-3 text-sm text-ink-soft">
          {post.category ? <span className="font-medium text-brand">{post.category.name}</span> : null}
          <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} dk okuma</span>
        </div>
        <h3 className="mt-3 text-h3 transition-colors group-hover:text-brand">{post.title}</h3>
        <p className="mt-3 line-clamp-3 text-ink-muted">{post.excerpt}</p>
      </Link>
    </article>
  );
}
