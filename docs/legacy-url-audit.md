# Lagen Yazılım: Legacy Site Audit (Sprint 0)

- **Site:** https://www.lagenyazilim.com.tr/
- **Audit date:** 2026-11-04
- **Method:** read-only. curl/Node `fetch` of HTML, sitemaps, and public WP REST endpoints (GET only). No forms were submitted and nothing was logged into.
- **Machine-readable inventory:** `docs/legacy-inventory.json` (109 URLs: 98 from the sitemaps plus 11 probed)

---

## 1. Host and URL behaviour

| Request | Status | Location |
|---|---|---|
| `http://lagenyazilim.com.tr/` | 301 | `https://www.lagenyazilim.com.tr/` |
| `http://www.lagenyazilim.com.tr/` | 301 | `https://www.lagenyazilim.com.tr/` |
| `https://lagenyazilim.com.tr/` | 301 | `https://www.lagenyazilim.com.tr/` |
| `https://www.lagenyazilim.com.tr/` | **200** | n/a |
| `/hakkimizda` (no trailing slash) | **200** (no redirect) | canonical tag points to `/hakkimizda/` |
| `/iletisim` (no trailing slash) | **200** (no redirect) | canonical tag points to `/iletisim/` |
| `/blog/` | 301 | `/blog-2/` |
| `/sitemap.xml`, `/wp-sitemap.xml` | 301 | `/sitemap_index.xml` |
| `/checkout/` | 302 | `https://www.lagenyazilim.com.tr` (WooCommerce, empty cart) |
| `/hakkimizda/?utm=1` | 200 | canonical tag handles it |

- **Canonical host:** `https://www.` with a trailing slash. Every non-canonical host variant reaches it in a single 301.
- **Trailing slash:** URLs without the slash return 200 instead of 301. The canonical tag covers it, but the new site should 301 to one form. Recommendation: Next.js `trailingSlash: true` so the legacy URLs keep their exact shape.
- **Response:** TTFB about 0.1 s (page cache). The homepage HTML is 259 KB and loads 58 external scripts and 43 stylesheets.
- **Security headers:** none present (no HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy or Permissions-Policy). `Cache-Control: public, max-age=0`.
- **Other endpoints:** `/xmlrpc.php` 403. `/wp-login.php` 200 (status checked only). `/wp-json/wp/v2/users` 200 and exposes the single user `hilkom`. `/author/hilkom/` 200. `/feed/` 200. `/favicon.ico` 404 (only PNG icons exist). `/llms.txt` 404.

## 2. robots.txt and sitemaps

```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Sitemap: https://www.lagenyazilim.com.tr/sitemap_index.xml
```

`sitemap_index.xml` (Rank Math PRO) lists:

| Sitemap | URLs | Last modified | Content |
|---|---|---|---|
| `page-sitemap.xml` | 11 | 2026-10-29 | the real pages, plus `/checkout/` |
| `product-sitemap.xml` | 50 | 2023-04-29 | **WooCommerce theme demo products** (furniture/books, lorem ipsum) |
| `team-sitemap.xml` | 9 | 2021-08-01 | **theme demo team** (Sandra Willson, Dan Brake, and others) |
| `portfolio-sitemap.xml` | 28 | 2022-09-06 | **theme demo portfolio** (English stock-photo titles) |

- `post-sitemap.xml` returns 200 but is not in the index and contains only `/blog-2/`. The WP REST API reports **0 published posts**.
- `category-sitemap.xml`, `post_tag-sitemap.xml` and `author-sitemap.xml` return 404.
- 12 post categories exist, all with 0 posts: Animation, Branding, Decoration, Furniture, Genel, Marketing, Motion, Optimization, Planing, Rendering, SEO, Web (theme demo leftovers).
- WP REST reports 11 pages, which matches page-sitemap.

### URL inventory (real content)

| URL | Type | In menu |
|---|---|---|
| `/` | page | yes |
| `/hakkimizda/` | page | yes |
| `/ankara-web-tasarim/` | service | yes (Hizmetlerimiz) |
| `/ankara-seo-hizmeti/` | service | yes |
| `/ankara-sosyal-medya-yonetimi/` | service | yes |
| `/ankara-ozel-yazilim/` | service | yes |
| `/ankara-katalog-tasarimi/` | service | yes |
| `/ankara-fotograf-cekimi/` | service | yes ("Fotoğraf ve Drone Çekimi") |
| `/blog-2/` | page (empty blog) | yes |
| `/iletisim/` | page | yes |
| `/checkout/` | Woo system page | no (302) |

Menu order: Anasayfa, Hakkımızda, Hizmetlerimiz (6 children), Blog, İletişim, plus an "İletişime Geç" button. The footer "Hızlı Linkler" repeats the same set. Only 4 portfolio URLs are linked from content (the homepage "Our Case Studies" block).

### Probed and not found (404)
`/referanslar/`, `/projeler/`, `/ucretsiz-seo-analizi/`, `/seo-analizi/`, `/kvkk/`, `/gizlilik-politikasi/`, `/cart/`, `/my-account/`. `/shop/` returns **200** but its title is "Page Not Found" and it lists the demo products.

**No standalone free SEO analysis page exists.** "Ücretsiz SEO Analizi" is a CF7 form block (single field `site-url`) embedded on `/` and on `/ankara-seo-hizmeti/`.

**No references or projects page exists.** The only "projects" are the theme demo portfolio items.

**No privacy, KVKK or cookie page exists.**

## 3. Page-level SEO data (real pages)

All pages are `lang="tr"`, carry Rank Math `index, follow, max-image-preview:large` robots tags and a self-referencing canonical, and have no hreflang. JSON-LD on every page is the Rank Math default graph: Organization, ImageObject, WebSite, WebPage, Person and Article. The homepage adds SearchAction. **No LocalBusiness, Service, FAQPage or BreadcrumbList schema** appears anywhere, even on pages with FAQ sections. The site name is "Lagen Yazılım | Ankara Web Tasarım".

| URL | Title | Meta description (short) | H1 | Words | Img (empty alt) |
|---|---|---|---|---|---|
| `/` | "- Lagen Yazılım \| Ankara Web Tasarım" (starts with a stray dash, empty page title) | 10+ years' experience, 1000+ projects | "Her Zaman Zirveye Oyna" | 474 | 63 (63) |
| `/hakkimizda/` | Hakkımızda - Lagen Yazılım \| Ankara Web Tasarım | same as home (truncated mid-sentence) | **2 H1s**: "Hakkımızda", "Her Zaman Zirveye Oyna" | 325 | 15 (15) |
| `/ankara-web-tasarim/` | Ankara Web Tasarım - 2023 - … | strengthen your digital presence… | **2 H1s**: "Ankara Web Tasarım – 2023", "Web Sitesi Tasarım Aşamalarımız" | 2165 | 15 (14) |
| `/ankara-seo-hizmeti/` | Ankara Seo Hizmeti - 2023 - … | definition of SEO | "Ankara Seo Hizmeti – 2023" | 1646 | 17 (16) |
| `/ankara-sosyal-medya-yonetimi/` | Ankara Sosyal Medya Yönetimi - 2023 - … | definition (missing space after comma) | "Ankara Sosyal Medya Yönetimi – 2023" | 481 | 7 (6) |
| `/ankara-ozel-yazilim/` | Ankara Özel Yazılım- 2023 - … | increase potential/efficiency | "Ankara Özel Yazılım- 2023" | 486 | 8 (7) |
| `/ankara-katalog-tasarimi/` | Ankara Katalog Tasarımı-2023 - … | catalogue as advertising space | "Ankara Katalog Tasarımı-2023" | 930 | 7 (6) |
| `/ankara-fotograf-cekimi/` | Ankara Fotoğraf Çekimi 2023 - … | photographers and drone operators | "Ankara Fotoğraf Çekimi 2023" | 840 | 6 (4) |
| `/blog-2/` | Blog - Lagen Yazılım \| Ankara Web Tasarım | **"August 2, 2020John1 comment"** (demo leftover) | "Blog" | 109 | 4 (4) |
| `/iletisim/` | İletişim - Lagen Yazılım \| Ankara Web Tasarım | contact us for any question | "İletişim" | 150 | 5 (5) |

Word counts include the header and footer, which add roughly 100 words. "Empty alt" means `alt=""`; no `<img>` lacks the attribute entirely. Every logo `<img>` has `alt=""`.

### H2 outlines
- **/**: En İyi Çözümlere · Her özel durum, kendine özgü çözümler gerektirir. · **Our Case Studies** (English) · Dijital uzmanlığımızı… · Ücretsiz SEO Analizi · Bilgi paylaştıkça çoğalır. (blog teaser, empty) · Başarı, global bir vizyon… · Velinimetlerimizin Yorumları
- **/hakkimizda/**: Her özel durum… · Velinimetlerimizin Yorumları
- **/ankara-web-tasarim/**: Ankara Web Tasarım · Kurumsal Web Tasarımı · WordPress Web Tasarım · Sıkça Sorulan Sorular (10 Q&As, two duplicated: "Web tasarımı neden önemlidir?" and the duration question)
- **/ankara-seo-hizmeti/**: SEO KULLANDIĞIMIZ ARAÇLAR · SEO Hizmeti Ankara · Ücretsiz Seo Analizi · SEO Süreci Neleri Kapsar? · On-page SEO Nedir? · Anahtar Kelime Araştırması · Başlık Etiketleri · Meta Açıklamaları · İçerik Yazımı · URL Yapısı · Görseller · Off-Page SEO Nedir? · Backlinkler: · Sosyal Medya: · Influencer erişimi: · SEO Hizmeti Ne Kadar Sürer? · Sıkça Sorulan Sorular
- **/ankara-sosyal-medya-yonetimi/**: Sosyal Medya Yönetimi Nedir? (the rest are H3/H4)
- **/ankara-ozel-yazilim/**: Özel Yazılım Nedir? · Özel Yazılım Çözümlerinin Avantajları
- **/ankara-katalog-tasarimi/**: Ankara Katalog Tasarımı · Katalog Tasarımı · Katalog Tasarımında Neler Önemli
- **/ankara-fotograf-cekimi/**: Ankara Fotoğraf Çekimi · Fotoğraf Çekimi Neden Önemli? · Ankara Drone Çekimi 2023 · Ankara Drone Çekimi Hizmetlerimiz
- **/iletisim/**: Bizimle İletişime Geçin · İletişim Bilgileri · İletişim Formu

### OG / Twitter
- Every page has og:locale `tr_TR`, og:site_name, og:url, og:image and `twitter:card=summary_large_image`.
- **Homepage `og:title` is empty.** og:type is `article` on every page, including the homepage.
- Default og:image is the **old serif wordmark** `2021/01/Lagen_Yazilim_Logo-1.png` (755×330), not the current logo.
- Service pages use template stock images as og:image (`SMM_img.jpg`, `SEO_bg_img.png`, `f6f216afca-removebg-preview.png`, and others).
- Twitter labels show author "hilkom" on the homepage.

### Internal linking
- Every page links only to the global nav and footer set (10 URLs) plus `mailto:info@lagenyazilim.com.tr`. There are **no in-content contextual links between service pages**.
- Each service page has one outbound goo.gl/maps short link, and each page uses a *different* short link.
- The SEO page links the anchor "SEO Hizmeti Ankara" **to https://hilkomyazilim.com/**, a third-party agency domain that matches the WP author username `hilkom`. This is a keyword-anchor outbound link. Confirm with the client and drop it in the rebuild.
- `/shop/` links out to `livewp.site/wp/md/ewebot/...` (the theme vendor's demo).

## 4. Verifiable company facts

| Fact | Value (as published) |
|---|---|
| Brand name variants | "Lagen Yazılım" (body copy), "Lagen Yazılım \| Ankara Web Tasarım" (site name / Organization name in schema), "Lagen. Yazılım ve Tasarım" (logo lockup), "Lagen" |
| Legal entity | **not stated anywhere** (no Ltd./Şti., tax number or MERSIS) |
| Address | Harbiye Mahallesi, Bayram Çıtak Sokak, Dikmen / Çankaya / Ankara (**no building number or postcode**) |
| Phone | 0533 285 70 90 (the only number; mobile; also used for WhatsApp via the Creame "Joinchat" plugin) |
| Email | info@lagenyazilim.com.tr |
| Social | Instagram only: https://www.instagram.com/lagenyazilim/ (no LinkedIn, Facebook, X or YouTube links) |
| Working hours | **not published** |
| Founding | footer "© 2014 – 2026", which conflicts with "10 yıllık tecrübe" (2014 would mean 12 years) |
| Motto | "Her Zaman Zirveye Oyna" (described on the site as the company motto) |
| Google Maps | several goo.gl/maps short links (e.g. https://goo.gl/maps/BnVwsWZwTDxADK54A). Resolve and confirm the GBP listing manually. |
| Analytics | GA4 `G-NNBMPZYSQW` plus Google tag `GT-NGKQQCJ` via Site Kit 1.111.1 |

### Logos
- **Current header logo:** `https://www.lagenyazilim.com.tr/wp-content/uploads/2021/01/lagen-logo-yeni-1.png` (230 KB raster PNG on an opaque white canvas, about 1536×1024 with heavy padding). It shows a hexagonal "L" mark with a blue gradient, the navy wordmark "Lagen." and the tagline "YAZILIM VE TASARIM".
- **Footer / white version:** `.../2021/01/lagen-Duzenlendi.png` (155 KB, white on transparent).
- **Old serif wordmark, still used as og:image and schema logo:** `.../2021/01/Lagen_Yazilim_Logo-1.png` (755×330). Brand inconsistency.
- **Site icons:** `.../2021/01/cropped-lagen-logo-yeni-1-32x32.png`, `-180x180.png`, `-192x192.png`, `-270x270.png`.
- **No SVG logo exists.** Ask the client for vector source files.

### Brand colors
These are inline hex counts on the homepage. Most of them are the **Ewebot theme defaults**, not a deliberate brand palette.
- `#6254E7` violet (theme primary, 60 uses)
- `#3B3663` dark indigo for headings (22)
- `#696687` muted body text (18)
- `#FF7426` orange accent (11)
- `#39599E` (12)
- `#9289F1` light violet
- `#F0AC0E` / `#FBB102` yellow
- `#25D366` WhatsApp green

**Logo colors (sampled by eye, verify against source files):** deep navy wordmark about `#0D1B6E`, with a mark gradient from royal blue about `#1A3FB5` to cyan about `#13A8E8`. The logo is navy/blue while the site UI is violet/orange, so the logo and the site palette do not match.

### Fonts
- Google Fonts request (Elementor) loads **7 families × 18 weights**: Rubik, Nunito, Roboto, Manrope, Roboto Slab, Montserrat, Nunito Sans (`display=swap`, latin-ext).
- Inline CSS actually uses **Nunito** (body) and **Rubik** (headings), which are the Ewebot defaults. FontAwesome and the "Theme_icon" icon font are also loaded.

### CMS and stack
- WordPress 6.4.14 (outdated), **Ewebot theme (GT3 Themes)** with WPDA Builder Pro (header), Elementor 3.16.6 and Elementor Pro, Slider Revolution 6.6.12.
- Rank Math PRO (SEO), Site Kit by Google.
- Contact Form 7 and WPForms Lite.
- WooCommerce with YITH Wishlist, YITH Quick View, Woo Variation Swatches and Woo AJAX Filters (shop unused, demo products only).
- GT3 Photo Video Gallery Pro, GT3 Themes Core, Creame WhatsApp Me (Joinchat).
- The single WP user is `hilkom`.

## 5. References, clients, testimonials and claims

### Testimonials ("Velinimetlerimizin Yorumları", on `/` and `/hakkimizda/`)
| Quote (paraphrased) | Name | Company | Verifiability |
|---|---|---|---|
| "Very satisfied with the service" | Kerem Faruk | Fimaksan | Plausible real Turkish firm. Confirm consent and get a photo or logo. |
| "Growing digitally with a young, dynamic team" | Kağan Hoşgören | Doğuş Makina | Plausible. Reads like a slogan, not a customer quote. Confirm. |
| "First agency that comes to mind for e-commerce" | Talip Polar | Efe İş Elbiseleri | Plausible. Confirm. |
| Lead line: "Lagen Yazılım leads with digital marketing trends" | n/a | n/a | Self-claim, not a testimonial |

These are the only real-looking client names on the site. There are no logos, links, ratings or dates.

### Placeholder or template content (flag and remove)
- **Partner/client logo strip** (`2019/07/1.png`–`4.png`): **Zazzle Media, AirTrack** and two more. These are Ewebot demo brand logos, not real clients.
- **"Our Case Studies"** homepage block (English): "Online Media Management", "Mannix Marketing" (×2 each) link to theme demo portfolio items with stock photos.
- **27 portfolio items** with English stock titles ("Happy Amazed Blonde", "Satisfied Hipster Girl", "Twice Profit Than Before" and so on) and an identical demo description. All are indexed and in the sitemap.
- **8 team members** (Sandra Willson, Dan Brake, Angela Long, Sam Jordan, Anna Red, Andrew Rich, Vanessa Lucky, Victor Liuw) with Latin lorem text. All are indexed.
- **50 WooCommerce products** (furniture, lamps, books; many "-2" duplicates) with lorem ipsum descriptions and Product/Offer schema. `/shop/` carries a "Sign up now & get 15 off" block. All are indexed.
- The blog meta description "August 2, 2020John1 comment" comes from the demo, and the homepage blog teaser "Bilgi paylaştıkça çoğalır" shows no posts.
- Mixed English UI strings: "Our Case Studies", "featured Projects", "Home" breadcrumb, "Search", the 404 text "Sorry We Can't Find That Page!", "Time to read" labels.

### Unverifiable or inconsistent claims
- "10 yılı aşkın tecrübe" / "10 Yıllık Tecrübe" vs "© 2014" (12 years). The number has not been updated.
- "binden fazla proje" (1000+ projects) vs "250 Mutlu Müşteri". Possible, but unsupported by any portfolio.
- "100 % Profesyonel ve Genç Ekip" and "100 % Yaratıcı Tasarımlar" are filler counters.
- "Ankara web tasarım konusunda akıllara gelen ilk firmayız" (the first firm that comes to mind) is a superlative with no evidence.
- "Tüketicilerin %97'si…" is a statistic with no source.
- Every service page H1 and title says **"2023"** (outdated).
- The SEO page FAQ answers "Are there SEO agencies in Ankara?" generically ("yes, many"), which promotes competitors.
- The Hakkımızda service list says "Profesyonel **Promosyon** Ürünleri" while the homepage says "Katalog Ürünleri", so the service naming is inconsistent.
- Body copy mentions services **not in the menu**: Google Ads consultancy, graphic design, Kurumsal Kimlik (corporate identity), e-commerce (implied by a testimonial).

## 6. Services and content summary

| Service (menu label) | URL | Summary (paraphrased) |
|---|---|---|
| Web Tasarım | `/ankara-web-tasarim/` | Longest page, about 2,000 words of generic copy. Covers a 6-step process (project design, UX, graphics, typography, content, keywords), corporate web design traits (professional, usable, SEO-friendly, mobile, CMS, security, social integration), WordPress design/maintenance, quote-based pricing, and a 10-item FAQ with duplicates. Has no portfolio, pricing or proof. |
| Seo Hizmeti | `/ankara-seo-hizmeti/` | Defines SEO and lists the tools used (GA, GSC, SEMrush, Ahrefs, Moz, Screaming Frog, with tool logos). Covers a 6-step process (keyword research, site audit, competitor analysis, content optimisation, backlinks, reporting), on-page and off-page explainers, timing ("a few months to a year"), and an FAQ. Embeds the free SEO analysis form. **Factual error:** it defines backlinks as links *from your site to others*. |
| Sosyal Medya Yönetimi | `/ankara-sosyal-medya-yonetimi/` | Short (about 380 words of body). Covers strategy, content planning, engagement, visual quality, analytics, and local hashtags ("Etkiketleri" typo). No packages or platforms listed. |
| Özel Yazılım | `/ankara-ozel-yazilim/` | Short generic piece on the benefits of custom software (competitive edge, tailored, efficiency) and criteria for choosing a vendor. No tech stack, case studies or process. |
| Katalog Tasarımı | `/ankara-katalog-tasarimi/` | Explains print and digital catalogues as a marketing tool. Lists 5 factors (brand fit, product visuals, legibility, usability, print quality) and a how-to. No samples. |
| Fotoğraf ve Drone Çekimi | `/ankara-fotograf-cekimi/` | Explains why photography matters (6 points). The drone section covers aerial perspective, ads, construction/land survey, and tourism/events. No gallery of real work, and no mention of licensing or permits. |

Homepage service cards repeat the same 6 services with one-line taglines. The H3 list mentions web design, photo/drone, corporate identity and catalogue products.

## 7. Blog

**There are no blog posts.** The WP REST API returns `X-WP-Total: 0` for posts, `/blog-2/` renders only the H1 "Blog", and the 12 categories all have count 0. `/blog/` 301s to `/blog-2/`. The new site needs a blog launched from scratch, so there are no post URLs to redirect.

---

## Content issues
1. About 87 indexed theme-demo URLs (50 products, 27 portfolio, 8 team, plus 2 archives and `/shop/`) are thin, lorem ipsum and English. They dilute the topical focus and site quality.
2. Template partner logos (Zazzle Media, AirTrack, …) shown as clients: misleading.
3. Outdated "2023" in every service H1 and title. The years-of-experience number contradicts the founding year.
4. Inflated or unsourced claims (1000+ projects, "first firm that comes to mind", 97% statistic, 100% counters).
5. Mixed TR/EN interface strings and an English demo case-study block on the homepage.
6. Generic, keyword-stuffed copy ("Ankara web tasarım" repeated, with a space before commas). It shows little experience (E-E-A-T): no real projects, team, process photos or pricing.
7. Factual error on the SEO page (backlink definition) and a typo ("Etkiketleri").
8. Duplicate FAQ entries on the web design page.
9. **Form bug:** in the CF7 contact form (on `/`, `/iletisim/` and elsewhere) the "Telefon" field is also named `your-name`, so the phone value collides with or overwrites the name. "Web site*" is required on a general contact form, which hurts conversion. There is no KVKK consent checkbox.
10. No privacy policy, KVKK notice, cookie banner or terms, even though GA4 runs and personal data is collected (KVKK risk).
11. The outbound keyword link to hilkomyazilim.com and the author "hilkom" suggest content built by a third party.
12. Inconsistent naming of services (Katalog vs Promosyon Ürünleri). Services mentioned in copy have no pages (Google Ads, Kurumsal Kimlik, E-ticaret, Grafik Tasarım).

## SEO gaps
1. **Index bloat:** product, team and portfolio sitemaps plus `/shop/` (which serves a 200 "Page Not Found") are indexable. In the rebuild, return **410** for these (or 301 the 4 portfolio URLs linked from the homepage to the new `/referanslar/`).
2. **No LocalBusiness / ProfessionalService schema** (with no address, geo, openingHours or sameAs), no Service schema on service pages, no FAQPage schema despite FAQ content, and no BreadcrumbList on real pages. The Organization `name` includes a "| Ankara Web Tasarım" suffix.
3. Homepage title starts with "- ", og:title is empty, and og:type is `article` everywhere.
4. Multiple H1s on `/hakkimizda/` and `/ankara-web-tasarim/`. The homepage H1 is the motto, not a keyword or value proposition.
5. All logo and decorative images (about 90% of images) have empty alt text. The logo has no alt text.
6. No contextual internal links between related services. Each page links only through the nav.
7. Trailing-slash variants return 200 instead of 301 (canonical only).
8. Incomplete NAP (no building number or postcode, no working hours), with no embedded map or GBP link on the contact page.
9. No llms.txt, no `favicon.ico`, and no hreflang (TR only, which is fine).
10. Performance: 7 font families in 18 weights each, 58 scripts and 43 stylesheets on the homepage, Slider Revolution, WooCommerce assets on non-shop pages, and an oversized PNG logo (230 KB).
11. No security headers. WP 6.4 is outdated. The users endpoint exposes the author slug.
12. No blog, so there is no topical cluster or GEO content. The only long-form content is the generic service copy.
13. Images in the product sitemap are template assets.

## Download list (assets worth keeping)
Real brand assets:
- https://www.lagenyazilim.com.tr/wp-content/uploads/2021/01/lagen-logo-yeni-1.png (current logo, colour)
- https://www.lagenyazilim.com.tr/wp-content/uploads/2021/01/lagen-Duzenlendi.png (current logo, white)
- https://www.lagenyazilim.com.tr/wp-content/uploads/2021/01/cropped-lagen-logo-yeni-1-270x270.png (site icon, largest crop)
- https://www.lagenyazilim.com.tr/wp-content/uploads/2021/01/Lagen_Yazilim_Logo-1.png (old wordmark, archive only)

Possibly own content (verify origin before reuse):
- https://www.lagenyazilim.com.tr/wp-content/uploads/2023/06/ankara-ozel-yazilim.jpeg
- https://www.lagenyazilim.com.tr/wp-content/uploads/2023/06/ankara-katalog-tasarimi.png
- https://www.lagenyazilim.com.tr/wp-content/uploads/2023/06/b1ccbb3599.jpeg (photo page; likely stock)
- https://www.lagenyazilim.com.tr/wp-content/uploads/2023/06/f6f216afca-removebg-preview.png (likely stock)
- https://www.lagenyazilim.com.tr/wp-content/uploads/2024/11/Home_Backround.png (hero visual, 785 px)

Do **not** reuse: the `2019/*`, `2020/*` and most `2021/01/home10-*` images (Ewebot demo artwork), the partner logos `2019/07/1–4.png`, the portfolio, team and product images, or the third-party SEO tool logos.

**Request from the client:** vector logo (SVG/AI), brand colour codes, real project screenshots, testimonial consent and logos, legal entity name, full address with building number and postcode, working hours, and any other social profiles.

## Could not be verified
- The goo.gl/maps short links were not resolved, so the Google Business Profile has not been verified.
- Form behaviour was not tested (no submissions, by design).
- The Instagram profile content was not fetched.
- Real client websites (Fimaksan, Doğuş Makina, Efe İş Elbiseleri) have not been cross-checked.
