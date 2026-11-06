/**
 * Teklif sihirbazı seçenekleri — Sprint 2'de quote_service_options / budget_ranges tablolarına taşınır
 * ve yönetim panelinden düzenlenir. Bütçe aralıkları başlangıç değeridir, firma tarafından güncellenmelidir.
 */
export type QuoteExtraField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect" | "number";
  options?: string[];
  placeholder?: string;
};

export type QuoteServiceOption = {
  key: string;
  label: string;
  description: string;
  extraFields: QuoteExtraField[];
};

export const QUOTE_SERVICE_OPTIONS: QuoteServiceOption[] = [
  {
    key: "kurumsal-web",
    label: "Kurumsal Web Sitesi",
    description: "Yeni site veya mevcut sitenin yenilenmesi",
    extraFields: [
      { key: "web_pages", label: "Tahmini sayfa sayısı", type: "select", options: ["1–5", "6–15", "16–40", "40+", "Bilmiyorum"] },
      { key: "web_languages", label: "Dil seçenekleri", type: "multiselect", options: ["Türkçe", "İngilizce", "Arapça", "Rusça", "Almanca", "Diğer"] },
      { key: "web_content", label: "Metin ve görseller hazır mı?", type: "select", options: ["Hazır", "Kısmen hazır", "Hazır değil, destek istiyoruz"] },
    ],
  },
  {
    key: "e-ticaret",
    label: "E-Ticaret",
    description: "Online satış sitesi veya pazaryeri entegrasyonu",
    extraFields: [
      { key: "shop_products", label: "Yaklaşık ürün sayısı", type: "select", options: ["1–50", "51–500", "501–5.000", "5.000+"] },
      { key: "shop_integrations", label: "Gerekli entegrasyonlar", type: "multiselect", options: ["Sanal POS", "Kargo", "Muhasebe / e-Fatura", "ERP", "Pazaryerleri"] },
    ],
  },
  {
    key: "ozel-yazilim",
    label: "Özel Yazılım",
    description: "Yönetim paneli, portal, iş süreci yazılımı",
    extraFields: [
      { key: "sw_roles", label: "Kullanıcı rolleri", type: "textarea", placeholder: "Örn. yönetici, satış, bayi, müşteri" },
      { key: "sw_integrations", label: "Entegrasyon ihtiyaçları", type: "textarea", placeholder: "Örn. muhasebe programı, ERP, SMS, e-posta" },
      { key: "sw_users", label: "Tahmini kullanıcı sayısı", type: "select", options: ["1–10", "11–50", "51–250", "250+"] },
    ],
  },
  {
    key: "seo",
    label: "SEO",
    description: "Teknik SEO, içerik ve yerel görünürlük",
    extraFields: [
      { key: "seo_goal", label: "Öncelikli hedef", type: "select", options: ["Daha fazla organik trafik", "Yerel aramalarda görünürlük", "Site yenileme sonrası kayıp", "Teknik sorunlar"] },
      { key: "seo_keywords", label: "Görünmek istediğiniz aramalar", type: "textarea" },
    ],
  },
  {
    key: "sosyal-medya",
    label: "Sosyal Medya",
    description: "İçerik planı, tasarım ve hesap yönetimi",
    extraFields: [
      { key: "sm_platforms", label: "Platformlar", type: "multiselect", options: ["Instagram", "LinkedIn", "Facebook", "YouTube", "TikTok", "X"] },
    ],
  },
  {
    key: "katalog",
    label: "Katalog Tasarımı",
    description: "Basılı ve dijital ürün/firma kataloğu",
    extraFields: [
      { key: "cat_pages", label: "Tahmini sayfa sayısı", type: "select", options: ["8–16", "17–48", "49–100", "100+"] },
      { key: "cat_format", label: "Format", type: "multiselect", options: ["Basılı", "Dijital PDF", "Web kataloğu"] },
    ],
  },
  { key: "diger", label: "Diğer", description: "Listede olmayan bir ihtiyaç", extraFields: [] },
];

export const BUDGET_RANGES = [
  { id: "belirsiz", label: "Henüz belirlemedim" },
  { id: "100k-alti", label: "100.000 ₺'ye kadar" },
  { id: "100k-250k", label: "100.000 – 250.000 ₺" },
  { id: "250k-500k", label: "250.000 – 500.000 ₺" },
  { id: "500k-ustu", label: "500.000 ₺ üzeri" },
] as const;

export const START_TIMINGS = ["Hemen", "1 ay içinde", "1–3 ay içinde", "3 aydan sonra", "Henüz belli değil"] as const;
export const PRIORITIES = ["Takvim öncelikli", "Bütçe öncelikli", "Kalite / kapsam öncelikli"] as const;
export const CONTACT_METHODS = [
  { id: "email", label: "E-posta" },
  { id: "phone", label: "Telefon" },
  { id: "whatsapp", label: "WhatsApp" },
] as const;
