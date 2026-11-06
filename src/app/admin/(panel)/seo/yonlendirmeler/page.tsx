import { desc } from "drizzle-orm";
import { RedirectManager } from "@/components/admin/forms/RedirectManager";
import { AdminPage, fmtDateTime } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { redirectRules } from "@/lib/db/schema";

export const metadata = { title: "Yönlendirmeler" };

export default async function RedirectsAdmin() {
  const user = await requireUser("seo");
  const rows = await db.select().from(redirectRules).orderBy(desc(redirectRules.updatedAt));
  return (
    <AdminPage
      title="Yönlendirmeler"
      crumbs={[{ href: "/admin/seo/", label: "SEO" }]}
      description="301/308/302 yönlendirmeler ve 410 kaldırma kuralları. Yayındaki bir içeriğin adresi değişince burada otomatik kural oluşur; zincirler tek adıma indirilir ve döngüye izin verilmez."
    >
      <RedirectManager csrf={user.csrfToken} rules={rows.map((r) => ({ id: r.id, fromPath: r.fromPath, toPath: r.toPath, statusCode: r.statusCode, isActive: r.isActive, hits: r.hits, lastHitAt: r.lastHitAt ? fmtDateTime(r.lastHitAt) : "—", note: r.note }))} />
    </AdminPage>
  );
}
