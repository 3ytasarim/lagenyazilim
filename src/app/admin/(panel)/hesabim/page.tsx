import { eq } from "drizzle-orm";
import { OwnPasswordForm } from "@/components/admin/forms/SettingsForms";
import { TwoFactorCard } from "@/components/admin/forms/TwoFactorCard";
import { AdminPage, Card, fmtDateTime } from "@/components/admin/ui";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const metadata = { title: "Hesabım" };

/** Her rol kendi parolasını ve 2FA ayarını buradan yönetir. */
export default async function AccountPage() {
  const user = await requireUser("dashboard");
  const [row] = await db.select({ totp: users.totpSecret, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt }).from(users).where(eq(users.id, user.id)).limit(1);
  return (
    <AdminPage title="Hesabım">
      <div className="grid max-w-4xl gap-6">
        <Card title="Profil">
          <dl className="grid gap-2 text-[0.9375rem] sm:grid-cols-[140px_1fr]">
            <dt className="text-ink-soft">Ad</dt>
            <dd>{user.name}</dd>
            <dt className="text-ink-soft">E-posta</dt>
            <dd>{user.email}</dd>
            <dt className="text-ink-soft">Rol</dt>
            <dd>{ROLE_LABEL[user.role]}</dd>
            <dt className="text-ink-soft">Son giriş</dt>
            <dd>{fmtDateTime(row?.lastLoginAt)}</dd>
          </dl>
        </Card>
        <TwoFactorCard csrf={user.csrfToken} enabled={!!row?.totp} />
        <OwnPasswordForm csrf={user.csrfToken} />
      </div>
    </AdminPage>
  );
}
