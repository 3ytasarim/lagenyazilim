import { BusinessForm, SeoSettingsForm, SmtpForm } from "@/components/admin/forms/SettingsForms";
import { AdminPage } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { getSettingUncached } from "@/lib/settings";

export const metadata = { title: "Site ayarları" };

export default async function SettingsAdmin() {
  const user = await requireUser("settings");
  const [business, seo, analytics, smtp] = await Promise.all([getSettingUncached("business"), getSettingUncached("seo"), getSettingUncached("analytics"), getSettingUncached("smtp")]);
  const { passSealed, ...smtpPublic } = smtp;
  return (
    <AdminPage title="Site ayarları">
      <div className="grid gap-6">
        <BusinessForm csrf={user.csrfToken} b={business} />
        <SeoSettingsForm csrf={user.csrfToken} seo={seo} analytics={analytics} />
        <SmtpForm csrf={user.csrfToken} smtp={smtpPublic} hasPassword={!!passSealed} envOverride={!!process.env.SMTP_HOST} />
      </div>
    </AdminPage>
  );
}
