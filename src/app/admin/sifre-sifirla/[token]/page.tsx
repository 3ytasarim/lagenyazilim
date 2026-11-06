import { AuthCard } from "@/components/admin/AuthCard";
import { ResetPasswordForm } from "@/components/admin/AuthForms";

export const metadata = { title: "Yeni parola", referrer: "no-referrer" };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthCard title="Yeni parola belirleyin">
      <ResetPasswordForm token={/^[\w-]{20,100}$/.test(token) ? token : ""} />
    </AuthCard>
  );
}
