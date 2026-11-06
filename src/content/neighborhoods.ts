/**
 * Ankara mahalle / semt / ticari bölge kayıtları — kaynak: docs/neighborhood-verification.md (resmî listelerle 2026-11-04).
 * verified=false olanlar yayın kapısından geçemez; sınırları doğrulanmadan sayfa açılmamalı.
 */
export type NeighborhoodSeed = { name: string; slug: string; kind: "neighborhood" | "zone"; district: string; verified: boolean; source: string; officialNames: string[] };

export const NEIGHBORHOOD_SEED: NeighborhoodSeed[] = [
  {
    "name": "Kızılay",
    "slug": "kizilay",
    "kind": "neighborhood",
    "district": "cankaya",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/cankaya ; https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz (kontrol: 2026-11-04)",
    "officialNames": [
      "Kızılay"
    ]
  },
  {
    "name": "Çukurambar",
    "slug": "cukurambar",
    "kind": "neighborhood",
    "district": "cankaya",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/cankaya ; https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz (kontrol: 2026-11-04)",
    "officialNames": [
      "Çukurambar"
    ]
  },
  {
    "name": "Söğütözü",
    "slug": "sogutozu",
    "kind": "neighborhood",
    "district": "cankaya",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/cankaya ; https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz (kontrol: 2026-11-04)",
    "officialNames": [
      "Söğütözü"
    ]
  },
  {
    "name": "Balgat",
    "slug": "balgat",
    "kind": "neighborhood",
    "district": "cankaya",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/cankaya ; https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz (kontrol: 2026-11-04)",
    "officialNames": [
      "Balgat"
    ]
  },
  {
    "name": "Ayrancı",
    "slug": "ayranci",
    "kind": "neighborhood",
    "district": "cankaya",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/cankaya ; https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz (kontrol: 2026-11-04)",
    "officialNames": [
      "Ayrancı"
    ]
  },
  {
    "name": "Bahçelievler",
    "slug": "bahcelievler",
    "kind": "neighborhood",
    "district": "cankaya",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/cankaya ; https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz (kontrol: 2026-11-04)",
    "officialNames": [
      "Bahçelievler"
    ]
  },
  {
    "name": "Dikmen",
    "slug": "dikmen",
    "kind": "zone",
    "district": "cankaya",
    "verified": false,
    "source": "https://www.ankara.bel.tr/muhtarlar/cankaya ; https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz (kontrol: 2026-11-04)",
    "officialNames": [
      "Yukarı Dikmen"
    ]
  },
  {
    "name": "Oran",
    "slug": "oran",
    "kind": "neighborhood",
    "district": "cankaya",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/cankaya ; https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz (kontrol: 2026-11-04)",
    "officialNames": [
      "Or-An"
    ]
  },
  {
    "name": "Çayyolu",
    "slug": "cayyolu",
    "kind": "neighborhood",
    "district": "cankaya",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/cankaya ; https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz (kontrol: 2026-11-04)",
    "officialNames": [
      "Çayyolu"
    ]
  },
  {
    "name": "Ümitköy",
    "slug": "umitkoy",
    "kind": "zone",
    "district": "cankaya",
    "verified": false,
    "source": "https://www.ankara.bel.tr/muhtarlar/cankaya ; https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz (kontrol: 2026-11-04)",
    "officialNames": [
      "Ümit"
    ]
  },
  {
    "name": "Ostim",
    "slug": "ostim",
    "kind": "neighborhood",
    "district": "yenimahalle",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/yenimahalle ; https://www.yenimahalle.gov.tr/kurumlar/yenimahalle.gov.tr/yenimahalle/DERYA/muhtar/muhtarlar2024/2024-muhtar-listesi.pdf ; https://www.ostim.org.tr (kontrol: 2026-11-04)",
    "officialNames": [
      "Ostim"
    ]
  },
  {
    "name": "İvedik",
    "slug": "ivedik",
    "kind": "zone",
    "district": "yenimahalle",
    "verified": false,
    "source": "https://www.ankara.bel.tr/muhtarlar/yenimahalle ; https://www.yenimahalle.gov.tr/kurumlar/yenimahalle.gov.tr/yenimahalle/DERYA/muhtar/muhtarlar2024/2024-muhtar-listesi.pdf (kontrol: 2026-11-04)",
    "officialNames": []
  },
  {
    "name": "Batıkent",
    "slug": "batikent",
    "kind": "zone",
    "district": "yenimahalle",
    "verified": false,
    "source": "https://www.ankara.bel.tr/muhtarlar/yenimahalle (kontrol: 2026-11-04)",
    "officialNames": []
  },
  {
    "name": "Bağlıca",
    "slug": "baglica",
    "kind": "neighborhood",
    "district": "etimesgut",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/etimesgut ; http://www.etimesgut.gov.tr/kurumlar/etimesgut.gov.tr/18032024/2024-Muhtarlar-Telefon.pdf (kontrol: 2026-11-04)",
    "officialNames": [
      "Bağlıca"
    ]
  },
  {
    "name": "Eryaman",
    "slug": "eryaman",
    "kind": "neighborhood",
    "district": "etimesgut",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/etimesgut ; http://www.etimesgut.gov.tr/kurumlar/etimesgut.gov.tr/18032024/2024-Muhtarlar-Telefon.pdf (kontrol: 2026-11-04)",
    "officialNames": [
      "Eryaman"
    ]
  },
  {
    "name": "İncek",
    "slug": "incek",
    "kind": "neighborhood",
    "district": "golbasi",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/golbasi ; https://www.ankara.bel.tr/proje/golbasi-incek-mahallesi-park-alani-275 (kontrol: 2026-11-04)",
    "officialNames": [
      "İncek"
    ]
  },
  {
    "name": "Harbiye",
    "slug": "harbiye",
    "kind": "neighborhood",
    "district": "cankaya",
    "verified": true,
    "source": "https://www.ankara.bel.tr/muhtarlar/cankaya ; https://www.cankaya.bel.tr/rehber/muhtarlarimiz/muhtarlarimiz (kontrol: 2026-11-04)",
    "officialNames": [
      "Harbiye"
    ]
  }
];
