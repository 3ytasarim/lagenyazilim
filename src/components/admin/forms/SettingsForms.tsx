"use client";

import { useState, useTransition } from "react";
import { CheckboxField, PairRepeater, SelectField, TextField } from "@/components/admin/fields";
import { SaveForm } from "@/components/admin/SaveForm";
import { Card } from "@/components/admin/ui";
import type { BusinessInfo } from "@/lib/site";
import { saveBusiness, saveSeoSettings, saveSmtp, sendTestMail } from "@/server/actions/settings";
import { changeOwnPassword } from "@/server/actions/users";

export function BusinessForm({ csrf, b }: { csrf: string; b: BusinessInfo }) {
  return (
    <Card title="Firma ve iletişim bilgileri (NAP)" description="Footer, iletişim sayfası, yapılandırılmış veri (LocalBusiness) ve teklif formu bu bilgileri kullanır. Doğrulanmamış alanları boş bırakın.">
      <SaveForm action={saveBusiness} csrf={csrf} inline>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField name="name" label="Marka adı" defaultValue={b.name} required />
          <TextField name="legalName" label="Tüzel kişi unvanı" defaultValue={b.legalName ?? ""} optional hint="KVKK veri sorumlusu ve footer telif satırı" />
          <TextField name="phone" label="Telefon" defaultValue={b.phone} required />
          <TextField name="whatsapp" label="WhatsApp" defaultValue={`0${b.whatsappE164.replace(/^90/, "")}`} optional />
          <TextField name="email" label="E-posta" type="email" defaultValue={b.email} required />
          <TextField name="slogan" label="Slogan" defaultValue={b.slogan} optional />
          <TextField name="neighborhood" label="Mahalle" defaultValue={b.address.neighborhood} />
          <TextField name="street" label="Cadde / sokak / no" defaultValue={b.address.street} />
          <TextField name="district" label="İlçe" defaultValue={b.address.district} />
          <TextField name="city" label="İl" defaultValue={b.address.city} />
          <TextField name="postalCode" label="Posta kodu" defaultValue={b.address.postalCode ?? ""} optional />
          <TextField name="openingHours" label="Çalışma saatleri" defaultValue={b.openingHours ?? ""} optional placeholder="Örn. Pzt–Cum 09:00–18:00" />
          <TextField name="mapsUrl" label="Google Haritalar bağlantısı" defaultValue={b.mapsUrl ?? ""} optional className="md:col-span-2" />
        </div>
        <div className="mt-6">
          <PairRepeater name="social" label="Sosyal ağlar" initial={b.social.map((s) => ({ title: s.label, text: s.href }))} labels={["Platform", "https://…"]} addLabel="Hesap ekle" />
        </div>
      </SaveForm>
    </Card>
  );
}

export function SeoSettingsForm({ csrf, seo, analytics }: { csrf: string; seo: { googleSiteVerification: string; bingSiteVerification: string; gbpUrl: string }; analytics: { provider: string; ga4Id: string; umamiUrl: string; umamiSiteId: string } }) {
  return (
    <Card title="Arama motorları ve analitik" description="Analitik betikleri yalnızca ziyaretçi çerez onayı verdikten sonra yüklenir.">
      <SaveForm action={saveSeoSettings} csrf={csrf} inline>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField name="googleSiteVerification" label="Google Search Console doğrulama kodu" defaultValue={seo.googleSiteVerification} optional hint="Yalnızca content değeri" />
          <TextField name="bingSiteVerification" label="Bing Webmaster doğrulama kodu" defaultValue={seo.bingSiteVerification} optional />
          <TextField name="gbpUrl" label="Google Business Profile bağlantısı" defaultValue={seo.gbpUrl} optional className="md:col-span-2" />
          <SelectField
            name="provider"
            label="Analitik sağlayıcı"
            options={[
              { value: "none", label: "Kapalı" },
              { value: "ga4", label: "Google Analytics 4" },
              { value: "umami", label: "Umami (kendi sunucunuz)" },
            ]}
            defaultValue={analytics.provider}
          />
          <TextField name="ga4Id" label="GA4 ölçüm kimliği" placeholder="G-XXXXXXX" defaultValue={analytics.ga4Id} optional />
          <TextField name="umamiUrl" label="Umami betik adresi" defaultValue={analytics.umamiUrl} optional />
          <TextField name="umamiSiteId" label="Umami site kimliği" defaultValue={analytics.umamiSiteId} optional />
        </div>
      </SaveForm>
    </Card>
  );
}

export function SmtpForm({ csrf, smtp, hasPassword, envOverride }: { csrf: string; smtp: { host: string; port: number; secure: string; user: string; from: string; notifyTo: string; sendCustomerReceipt: boolean }; hasPassword: boolean; envOverride: boolean }) {
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card title="E-posta (SMTP)" description={envOverride ? "Sunucu ortam değişkenlerinde SMTP tanımlı; bu ayarlar yerine onlar kullanılıyor." : "Teklif ve form bildirimleri bu hesapla gönderilir. Parola şifrelenmiş olarak saklanır ve geri gösterilmez."}>
      <SaveForm
        action={saveSmtp}
        csrf={csrf}
        inline
        extraActions={
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("csrf", csrf);
              start(async () => {
                const r = await sendTestMail(fd);
                setTestMsg({ ok: r.ok, text: r.message ?? "" });
              });
            }}
            className="inline-flex h-12 items-center rounded-full border border-line-strong px-5 text-[0.9375rem] font-semibold hover:border-ink"
          >
            Test e-postası gönder
          </button>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <TextField name="host" label="SMTP sunucusu" defaultValue={smtp.host} />
          <TextField name="port" label="Port" type="number" defaultValue={String(smtp.port)} />
          <SelectField
            name="secure"
            label="Bağlantı güvenliği"
            options={[
              { value: "starttls", label: "STARTTLS (587)" },
              { value: "ssl", label: "SSL/TLS (465)" },
              { value: "none", label: "Şifresiz (önerilmez)" },
            ]}
            defaultValue={smtp.secure}
          />
          <TextField name="user" label="Kullanıcı adı" defaultValue={smtp.user} autoComplete="off" />
          <TextField name="pass" label="Parola" type="password" autoComplete="new-password" placeholder={hasPassword ? "•••••••• (değiştirmek için yazın)" : ""} optional />
          <TextField name="from" label="Gönderen" defaultValue={smtp.from} placeholder="Lagen Yazılım <info@lagenyazilim.com.tr>" />
          <TextField name="notifyTo" label="Bildirimlerin gideceği adres" type="email" defaultValue={smtp.notifyTo} className="md:col-span-2" />
          <div className="md:col-span-2">
            <CheckboxField name="sendCustomerReceipt" label="Teklif isteyen kişiye otomatik 'talebiniz alındı' e-postası gönder" defaultChecked={smtp.sendCustomerReceipt} />
          </div>
        </div>
      </SaveForm>
      {testMsg ? <p className={`mt-3 text-sm ${testMsg.ok ? "text-success" : "text-danger"}`}>{testMsg.text}</p> : null}
    </Card>
  );
}

export function OwnPasswordForm({ csrf }: { csrf: string }) {
  return (
    <Card title="Parolam">
      <SaveForm action={changeOwnPassword} csrf={csrf} inline submitLabel="Parolayı değiştir">
        <div className="grid gap-5 md:grid-cols-3">
          <TextField name="current" label="Mevcut parola" type="password" autoComplete="current-password" />
          <TextField name="password" label="Yeni parola" type="password" autoComplete="new-password" hint="En az 12 karakter, harf ve rakam" />
          <TextField name="confirm" label="Yeni parola (tekrar)" type="password" autoComplete="new-password" />
        </div>
      </SaveForm>
    </Card>
  );
}
