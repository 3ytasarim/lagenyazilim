import { asc, sql } from "drizzle-orm";
import { CategoryManager } from "@/components/admin/forms/TaxonomyForms";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { blogCategories, blogTags } from "@/lib/db/schema";

export const metadata = { title: "Kategori ve etiketler" };

export default async function CategoriesAdmin() {
  const user = await requireUser("content");
  const [cats, tags] = await Promise.all([
    db
      .select({ id: blogCategories.id, name: blogCategories.name, slug: blogCategories.slug, description: blogCategories.description, sortOrder: blogCategories.sortOrder, count: sql<number>`(select count(*)::int from blog_posts p where p.category_id = ${blogCategories.id})` })
      .from(blogCategories)
      .orderBy(asc(blogCategories.sortOrder)),
    db.select({ id: blogTags.id, name: blogTags.name, slug: blogTags.slug, count: sql<number>`(select count(*)::int from blog_post_tags t where t.tag_id = ${blogTags.id})` }).from(blogTags).orderBy(asc(blogTags.name)),
  ]);
  return (
    <AdminPage title="Kategori ve etiketler" crumbs={[{ href: "/admin/blog/", label: "Blog" }]}>
      <CategoryManager csrf={user.csrfToken} categories={cats} tags={tags} />
    </AdminPage>
  );
}
