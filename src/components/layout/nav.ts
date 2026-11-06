import type { ServiceIcon } from "@/types/content";

export type NavService = { href: string; name: string; summary: string; icon: ServiceIcon };

export type NavItem = { label: string; href: string; mega?: "services" };

/** Projeler ve Blog, yayımlanmış içerik yoksa menüde gösterilmez (bkz. layout). */
export function buildNav(opts: { hasProjects: boolean; hasPosts: boolean }): NavItem[] {
  return [
    { label: "Kurumsal", href: "/hakkimizda/" },
    { label: "Hizmetlerimiz", href: "/hizmetlerimiz/", mega: "services" },
    ...(opts.hasProjects ? [{ label: "Projelerimiz", href: "/projeler/" }] : []),
    { label: "Çözümler", href: "/cozumler/" },
    { label: "Hizmet Bölgeleri", href: "/hizmet-bolgeleri/" },
    ...(opts.hasPosts ? [{ label: "Blog", href: "/blog/" }] : []),
    { label: "İletişim", href: "/iletisim/" },
  ];
}
