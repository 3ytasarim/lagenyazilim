import { redirect } from "next/navigation";
import { AuthCard } from "@/components/admin/AuthCard";
import { LoginForm } from "@/components/admin/AuthForms";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Giriş" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionUser()) redirect("/admin/");
  const { next } = await searchParams;
  return (
    <AuthCard title="Yönetim paneli" lead="Devam etmek için giriş yapın.">
      <LoginForm next={next} />
    </AuthCard>
  );
}
