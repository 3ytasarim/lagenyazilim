import { asc, sql } from "drizzle-orm";
import { AuthorManager } from "@/components/admin/forms/TaxonomyForms";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { authors } from "@/lib/db/schema";

export const metadata = { title: "Yazarlar" };

export default async function AuthorsAdmin() {
  const user = await requireUser("content");
  const rows = await db
    .select({ id: authors.id, name: authors.name, slug: authors.slug, jobTitle: authors.jobTitle, bio: authors.bio, sameAs: authors.sameAs, isVerified: authors.isVerified, count: sql<number>`(select count(*)::int from blog_posts p where p.author_id = ${authors.id})` })
    .from(authors)
    .orderBy(asc(authors.name));
  return (
    <AdminPage title="Yazarlar" crumbs={[{ href: "/admin/blog/", label: "Blog" }]}>
      <AuthorManager csrf={user.csrfToken} authors={rows} />
    </AdminPage>
  );
}
