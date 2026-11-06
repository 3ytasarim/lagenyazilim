import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { PostForm, type PostFormData } from "@/components/admin/forms/PostForm";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { authors, blogCategories, blogPostTags, blogPosts, blogTags } from "@/lib/db/schema";
import { SITE_URL } from "@/lib/site";
import { linkTargets, mediaRef, publishValues, revisionItems, seoValues } from "@/server/queries/admin";

export const metadata = { title: "Yazı düzenle" };

export default async function PostEdit({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("content");
  const { id } = await params;
  const isNew = id === "yeni";
  if (!isNew && !/^[0-9a-f-]{36}$/.test(id)) notFound();
  const row = isNew ? undefined : (await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1))[0];
  if (!isNew && !row) notFound();

  const [auth, cats, allTags, postTags, cover, og, targets, revisions] = await Promise.all([
    db.select({ value: authors.id, label: authors.name }).from(authors).orderBy(asc(authors.name)),
    db.select({ value: blogCategories.id, label: blogCategories.name }).from(blogCategories).orderBy(asc(blogCategories.sortOrder)),
    db.select({ name: blogTags.name }).from(blogTags).orderBy(asc(blogTags.name)),
    row ? db.select({ name: blogTags.name }).from(blogPostTags).innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id)).where(eq(blogPostTags.postId, row.id)) : Promise.resolve([]),
    mediaRef(row?.coverImageId),
    mediaRef(row?.ogImageId),
    linkTargets(),
    row ? revisionItems("post", row.id) : Promise.resolve([]),
  ]);

  const data: PostFormData = {
    id: row?.id ?? null,
    title: row?.title ?? "",
    excerpt: row?.excerpt ?? "",
    body: row?.body ?? null,
    bodyHtml: row?.bodyHtml ?? "",
    cover,
    ogImage: og,
    authorId: row?.authorId ?? "",
    categoryId: row?.categoryId ?? "",
    tags: postTags.map((t) => t.name),
    sources: row?.sources ?? [],
    seo: seoValues(row),
    publish: publishValues(row),
  };

  return (
    <AdminPage title={isNew ? "Yeni yazı" : row!.title} crumbs={[{ href: "/admin/blog/", label: "Blog yazıları" }]}>
      <PostForm data={data} csrf={user.csrfToken} siteUrl={SITE_URL} authors={auth} categories={cats} tagSuggestions={allTags.map((t) => t.name)} linkTargets={targets} revisions={revisions} />
    </AdminPage>
  );
}
