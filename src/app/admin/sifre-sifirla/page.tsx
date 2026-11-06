import { AuthCard } from "@/components/admin/AuthCard";
import { ResetRequestForm } from "@/components/admin/AuthForms";

export const metadata = { title: "Parola sıfırlama" };

export default function ResetRequestPage() {
  return (
    <AuthCard title="Parola sıfırlama" lead="Hesabınıza kayıtlı e-posta adresini girin; size sıfırlama bağlantısı gönderelim.">
      <ResetRequestForm />
    </AuthCard>
  );
}
