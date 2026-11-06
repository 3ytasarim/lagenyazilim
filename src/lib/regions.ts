/** Bölge sayfasının public adresi: ilçe → /ankara/ilce/, mahalle → /ankara/ilce/mahalle/, hizmet+ilçe → /ankara/ilce/web-tasarim/ */
export function regionPath(region: { slug: string; kind: string }, parentSlug: string | null, serviceSlug: string | null) {
  const base = region.kind === "district" ? `/hizmet-bolgeleri/ankara/${region.slug}/` : `/hizmet-bolgeleri/ankara/${parentSlug}/${region.slug}/`;
  return serviceSlug ? `${base}${serviceComboSlug(serviceSlug)}/` : base;
}

/** "ankara-web-tasarim" → "web-tasarim" (bölge adresinde şehir tekrar edilmez). */
export const serviceComboSlug = (serviceSlug: string) => serviceSlug.replace(/^ankara-/, "");
