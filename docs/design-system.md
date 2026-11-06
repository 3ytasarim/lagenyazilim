# Tasarım Sistemi ve Bileşen Planı

## Yön

Premium corporate · editoryal düzen · 12 kolon Swiss grid · güçlü tipografi, az renk. Renk markanın logosundan gelir; eski sitedeki mor/turuncu tema varsayılanları kullanılmaz.

## Renk token'ları (başlangıç — vektör logo gelince kesinleşir)

| Token | Açık | Koyu | Kullanım |
|---|---|---|---|
| `--bg` | `#F6F5F1` kırık beyaz | `#0A1024` | zemin |
| `--surface` | `#FFFFFF` | `#111A36` | kart |
| `--surface-2` | `#ECEBE5` | `#17213F` | alternatif bölüm |
| `--ink` | `#0E1530` | `#EEF0F7` | metin (AAA) |
| `--ink-muted` | `#4A5068` | `#A5ABC2` | ikincil metin (AA) |
| `--line` | `#DCDAD2` | `#26304F` | çizgi |
| `--brand` | `#1A3FB5` | `#6E8CFF` | vurgu, link, CTA (beyaz üstünde ~7:1) |
| `--brand-ink` | `#0D1B6E` | — | logo laciverti, derin bölüm zemini |
| `--brand-cyan` | `#13A8E8` | aynı | yalnızca dekoratif çizgi/ikon (metinde kullanılmaz: kontrast yetersiz) |

Derin lacivert bölüm: `--brand-ink` zemin + `--bg` metin. Gradient yalnızca logo işaretinde ve tek bir hero aksanında.

## Tipografi

- Başlık: **Instrument Sans** (variable, latin-ext — Türkçe tam) · gövde: **Inter** (variable, latin-ext)
- `next/font/google` → build sırasında indirilip self-host edilir; yalnızca `latin` + `latin-ext` alt kümeleri
- Akışkan ölçek (`clamp`): display 44→88px, h1 36→64, h2 28→44, h3 20→26, gövde 17→18, küçük 14
- Satır uzunluğu 60–72 karakter (`max-w-[68ch]`), başlıklarda `text-wrap: balance`

## Ölçüler

8px grid · radius `--r-sm 6px` `--r-md 10px` `--r-lg 16px` · gölge 2 seviye (kart, açılır panel) · hareket: 200ms mikro / 480ms bölüm, `cubic-bezier(0.16,1,0.3,1)`, `prefers-reduced-motion` → kapalı.

## Bileşenler

| Katman | Bileşenler |
|---|---|
| ui | Button, Link, Badge, Input, Textarea, Select, Checkbox, Radio cards, Label/FieldError, Accordion, Tabs, Dialog, Tooltip, Toast, Skeleton, EmptyState, Pagination, SearchField |
| layout | SiteHeader (sticky, scroll'da küçülen), MegaMenu (Hizmetler), MobileNav (Dialog tabanlı), SiteFooter, Breadcrumb, Container, Section, SectionHeading, StickyCta (mobil) |
| home | Hero (tipografi + özgün arayüz kompozisyonu SVG/HTML, görsel yok → hızlı LCP), TrustStrip (yalnız gerçek veri), ServicesGrid, WhyLagen, FeaturedProjects, ProcessTimeline, RegionDirectory, LatestPosts, ProjectCta |
| services | ServiceHero, ShortAnswer, ProblemSolution, ScopeGrid, SectorList, RelatedProjects, RelatedServices, FaqAccordion, RegionLinks |
| blog | PostCard, ArticleToc, ArticleBody (prose), AuthorBox, SourceList, RelatedPosts, CategoryFilter |
| portfolio | ProjectCard, CaseStudyLayout, Gallery |
| forms | QuoteWizard (5 adım, ilerleme, adım doğrulama, taslak localStorage), ContactForm, SeoAuditForm, FileDrop, ConsentCheckbox |
| seo | JsonLd, Breadcrumb şeması |
| admin | AdminShell, DataTable, FilterBar, StatusBadge, SeoPanel (SERP önizleme), RichTextEditor (Tiptap), MediaPicker, RevisionList, KpiCard |

Kural: bölümler veri yoksa render edilmez (boş "Referanslar" şeridi gösterilmez).
