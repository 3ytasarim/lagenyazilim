import { AdminShell } from "@/components/admin/AdminShell";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role }} csrf={user.csrfToken}>
      {children}
    </AdminShell>
  );
}
