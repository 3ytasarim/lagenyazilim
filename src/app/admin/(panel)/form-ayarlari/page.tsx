import { asc, sql } from "drizzle-orm";
import { FormOptionsManager } from "@/components/admin/forms/FormOptions";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { budgetRanges, quoteServiceOptions } from "@/lib/db/schema";

export const metadata = { title: "Teklif formu" };

export default async function FormSettings() {
  const user = await requireUser("settings");
  const [options, budgets] = await Promise.all([
    db
      .select({
        id: quoteServiceOptions.id,
        key: quoteServiceOptions.key,
        label: quoteServiceOptions.label,
        description: quoteServiceOptions.description,
        extraFields: quoteServiceOptions.extraFields,
        sortOrder: quoteServiceOptions.sortOrder,
        isActive: quoteServiceOptions.isActive,
        used: sql<number>`(select count(*)::int from quote_requests q where ${quoteServiceOptions.key} = any(q.service_keys))`,
      })
      .from(quoteServiceOptions)
      .orderBy(asc(quoteServiceOptions.sortOrder)),
    db.select().from(budgetRanges).orderBy(asc(budgetRanges.sortOrder)),
  ]);
  return (
    <AdminPage title="Teklif formu ayarları" description="Proje teklifi sihirbazındaki hizmet seçenekleri, hizmete özel sorular ve bütçe aralıkları. Değişiklikler formda hemen görünür.">
      <FormOptionsManager csrf={user.csrfToken} options={options} budgets={budgets} />
    </AdminPage>
  );
}
