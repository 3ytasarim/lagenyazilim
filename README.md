# Lagen Yazılım — web platformu

lagenyazilim.com.tr için kurumsal site + içerik yönetimi (CMS) + teklif CRM. Kendi Ubuntu VPS'inde bağımsız çalışır; ücretli SaaS bağımlılığı yoktur.

- **Public site:** hizmet sayfaları (eski URL'ler korunur), blog, projeler, Ankara bölge sayfaları, 5 adımlı teklif sihirbazı, ücretsiz SEO analizi ve iletişim formları
- **Yönetim paneli (`/admin`):** blog, hizmet, proje, sayfa, medya, bölge sayfaları (yayın kapısı), SEO kontrol merkezi, yönlendirmeler, teklif/başvuru yönetimi, e-posta bildirimleri, kullanıcılar ve roller, 2FA, işlem kaydı
- **Teknik SEO:** metadata/canonical sistemi, JSON-LD, sitemap index, robots, llms.txt, eski URL'ler için 301/410

## Teknoloji

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Drizzle ORM + PostgreSQL · Tiptap · Argon2id · Nodemailer · PM2 · Nginx

## Geliştirme

```bash
npm ci
cp .env.example .env          # değerleri doldurun
npm run db:migrate            # DATABASE_URL_DIRECT (pooler olmayan bağlantı) üzerinden
npm run db:seed               # idempotent başlangıç verisi
npm run admin:create -- eposta@firma.com "Ad Soyad"   # parola terminalde sorulur
npm run dev                   # http://localhost:3490
```

| Komut | Açıklama |
|---|---|
| `npm run build` / `npm start` | Production build / sunucu (port 3490) |
| `npm run typecheck` · `npm run lint` | Tip kontrolü · ESLint |
| `npm test` | Birim testleri (Vitest, veritabanına bağlanmaz) |
| `npm run test:e2e` | Uçtan uca testler (Playwright, çalışan sunucuya karşı; varsayılan salt okunur) |
| `npm run db:generate` | Şemadan yeni migration üretir (elle gözden geçirin) |
| `npm run db:seed-drafts` | İçerik taslakları (blog + Çankaya bölge sayfası, hepsi taslak) |

E2E: `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` admin senaryolarını açar; `E2E_ALLOW_WRITES=1` kayıt oluşturan senaryoları açar — **yalnızca test/staging veritabanında**.

## Klasörler

```
src/app/(marketing)   public sayfalar          src/server/actions    server action'lar (yetki + CSRF + Zod)
src/app/admin         yönetim paneli           src/server/services   iş kuralları (CRM, içerik, bölge kapısı)
src/components        ui/layout/admin/...      src/server/queries    okuma katmanı (önbellekli)
src/lib               db, auth, seo, email…    scripts/              migrate, seed, deploy, backup
drizzle/              sürümlü migration'lar    docs/                 plan, mimari, SEO, deploy, güvenlik
```

## Belgeler

[Proje planı](docs/PROJECT_PLAN.md) · [Mimari](docs/architecture.md) · [Veritabanı](docs/database.md) · [SEO/GEO](docs/seo-strategy.md) · [Yerel SEO](docs/local-seo-plan.md) · [Deploy](docs/deployment.md) · [Yedekleme](docs/backup-restore.md) · [Güvenlik](docs/security-checklist.md) · [QA](docs/qa-checklist.md) · [Üretime hazırlık](docs/production-readiness.md)
