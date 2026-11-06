import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";

const LINKS = [
  { href: "/hizmetlerimiz/", label: "Hizmetlerimiz" },
  { href: "/ankara-web-tasarim/", label: "Web Tasarım" },
  { href: "/ankara-seo-hizmeti/", label: "SEO Hizmeti" },
  { href: "/iletisim/", label: "İletişim" },
];

export function NotFoundContent() {
  return (
    <section className="container-site py-24 md:py-36">
      {/* not-found dosyalarında metadata her durumda uygulanmadığı için başlık React 19 ile doğrudan yazılır */}
      <title>Sayfa bulunamadı | Lagen Yazılım</title>
      <meta name="robots" content="noindex" />
      <p className="font-display text-sm font-semibold text-brand tabular-nums">404</p>
      <h1 className="mt-4 max-w-2xl text-h1">Aradığınız sayfa bulunamadı</h1>
      <p className="mt-5 max-w-[56ch] text-lead text-ink-muted">
        Sayfa taşınmış ya da kaldırılmış olabilir. Aşağıdaki bağlantılardan devam edebilir veya bize doğrudan ulaşabilirsiniz.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/">Ana sayfaya dönün</ButtonLink>
        <ButtonLink href="/proje-teklifi/" variant="secondary">
          Proje Teklifi Al
        </ButtonLink>
      </div>
      <ul className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-8">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="font-medium text-ink-muted hover:text-brand">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
