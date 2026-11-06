import type { Region } from "@/types/content";

/** Ankara'nın 25 ilçesi. Öncelik 1 = ilk içerik dalgası (bkz. docs/local-seo-plan.md). */
export const DISTRICT_SEED: [slug: string, name: string, priority: number][] = [
  ["cankaya", "Çankaya", 1],
  ["yenimahalle", "Yenimahalle", 1],
  ["etimesgut", "Etimesgut", 1],
  ["kecioren", "Keçiören", 1],
  ["golbasi", "Gölbaşı", 1],
  ["sincan", "Sincan", 1],
  ["altindag", "Altındağ", 1],
  ["mamak", "Mamak", 1],
  ["pursaklar", "Pursaklar", 1],
  ["akyurt", "Akyurt", 2],
  ["ayas", "Ayaş", 2],
  ["bala", "Bala", 2],
  ["beypazari", "Beypazarı", 2],
  ["camlidere", "Çamlıdere", 2],
  ["cubuk", "Çubuk", 2],
  ["elmadag", "Elmadağ", 2],
  ["evren", "Evren", 2],
  ["gudul", "Güdül", 2],
  ["haymana", "Haymana", 2],
  ["kalecik", "Kalecik", 2],
  ["kahramankazan", "Kahramankazan", 2],
  ["kizilcahamam", "Kızılcahamam", 2],
  ["nallihan", "Nallıhan", 2],
  ["polatli", "Polatlı", 2],
  ["sereflikochisar", "Şereflikoçhisar", 2],
];

/** Sprint 4'te yayın kapısından geçen ilçe sayfaları burada (sonra veritabanında) işaretlenir. */
const PUBLISHED_DISTRICT_PAGES = new Set<string>();

export const ANKARA_DISTRICTS: Region[] = DISTRICT_SEED.map(([slug, name, priority]) => ({
  slug,
  name,
  kind: "district",
  priority,
  hasPage: PUBLISHED_DISTRICT_PAGES.has(slug),
}));
