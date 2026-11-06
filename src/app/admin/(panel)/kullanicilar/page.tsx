import { asc } from "drizzle-orm";
import { UserManager } from "@/components/admin/forms/UserForms";
import { AdminPage, fmtDateTime } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const metadata = { title: "Kullanıcılar" };

export default async function UsersAdmin() {
  const me = await requireUser("users");
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive, lastLoginAt: users.lastLoginAt, totp: users.totpSecret }).from(users).orderBy(asc(users.name));
  return (
    <AdminPage title="Kullanıcılar ve roller" description="Pasifleştirilen kullanıcının tüm oturumları anında kapatılır. Son aktif süper yönetici kaldırılamaz.">
      <UserManager csrf={me.csrfToken} users={rows.map(({ totp, ...u }) => ({ ...u, twoFactor: !!totp, lastLoginAt: fmtDateTime(u.lastLoginAt), self: u.id === me.id }))} />
    </AdminPage>
  );
}
