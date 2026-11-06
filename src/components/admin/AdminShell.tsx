"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Briefcase,
  ExternalLink,
  FileText,
  Inbox,
  ListChecks,
  MapPinned,
  SearchCheck,
  Shuffle,
  MailCheck,
  MessagesSquare,
  History,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutList,
  LogOut,
  Menu,
  Settings,
  Tags,
  UserPen,
  Users,
  X,
  type LucideIcon, Megaphone } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { can, ROLE_LABEL, type Permission, type Role } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { logout } from "@/server/actions/auth";

type Item = { href: string; label: string; icon: LucideIcon; perm: Permission };
type Group = { label: string; items: Item[] };

const NAV: Group[] = [
  { label: "", items: [{ href: "/admin/", label: "Panel", icon: LayoutDashboard, perm: "dashboard" }] },
  {
    label: "Satış",
    items: [
      { href: "/admin/teklifler/", label: "Teklifler", icon: Inbox, perm: "crm" },
      { href: "/admin/basvurular/", label: "Başvurular", icon: MessagesSquare, perm: "crm" },
      { href: "/admin/bildirimler/", label: "Bildirimler", icon: MailCheck, perm: "crm" },
    ],
  },
  {
    label: "İçerik",
    items: [
      { href: "/admin/blog/", label: "Blog yazıları", icon: BookOpen, perm: "content" },
      { href: "/admin/blog/kategoriler/", label: "Kategori ve etiketler", icon: Tags, perm: "content" },
      { href: "/admin/blog/yazarlar/", label: "Yazarlar", icon: UserPen, perm: "content" },
      { href: "/admin/hizmetler/", label: "Hizmetler", icon: LayoutList, perm: "content" },
      { href: "/admin/projeler/", label: "Projeler", icon: Briefcase, perm: "content" },
      { href: "/admin/sayfalar/", label: "Sayfalar", icon: FileText, perm: "content" },
      { href: "/admin/medya/", label: "Medya", icon: ImageIcon, perm: "content" },
      { href: "/admin/duyurular/", label: "Duyurular", icon: Megaphone, perm: "content" },
    ],
  },
  {
    label: "SEO",
    items: [
      { href: "/admin/seo/", label: "SEO kontrol merkezi", icon: SearchCheck, perm: "seo" },
      { href: "/admin/bolgeler/", label: "Bölge sayfaları", icon: MapPinned, perm: "seo" },
      { href: "/admin/seo/yonlendirmeler/", label: "Yönlendirmeler", icon: Shuffle, perm: "seo" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/ayarlar/", label: "Site ayarları", icon: Settings, perm: "settings" },
      { href: "/admin/form-ayarlari/", label: "Teklif formu", icon: ListChecks, perm: "settings" },
      { href: "/admin/kullanicilar/", label: "Kullanıcılar", icon: Users, perm: "users" },
      { href: "/admin/islem-kaydi/", label: "İşlem kaydı", icon: History, perm: "audit" },
    ],
  },
];

type Props = { user: { name: string; email: string; role: Role }; csrf: string; children: React.ReactNode };

export function AdminShell({ user, csrf, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // En uzun eşleşen menü öğesi aktif (örn. /admin/blog/kategoriler/ → "Kategori ve etiketler")
  const allHrefs = NAV.flatMap((g) => g.items.map((i) => i.href));
  const active = allHrefs.filter((h) => (h === "/admin/" ? pathname === "/admin" || pathname === "/admin/" : pathname.startsWith(h.replace(/\/$/, "")))).sort((a, b) => b.length - a.length)[0];

  const sidebar = (
    <nav aria-label="Yönetim menüsü" className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Link href="/admin/" className="flex items-center gap-2.5">
          <Image src="/brand/lagen-mark.png" alt="" width={28} height={28} />
          <span className="font-display text-lg font-semibold">Lagen Yönetim</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV.map((g) => {
          const items = g.items.filter((i) => can(user.role, i.perm));
          if (items.length === 0) return null;
          return (
            <div key={g.label || "root"} className="mt-4">
              {g.label ? <p className="px-3 pb-2 text-xs font-semibold tracking-wider text-ink-soft uppercase">{g.label}</p> : null}
              <ul className="grid gap-0.5">
                {items.map(({ href, label, icon: Icon }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active === href ? "page" : undefined}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-md px-3 text-[0.9375rem] transition-colors",
                        active === href ? "bg-brand-tint font-semibold text-brand" : "text-ink-muted hover:bg-surface-2 hover:text-ink",
                      )}
                    >
                      <Icon aria-hidden className="size-4" strokeWidth={1.8} />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-line p-4">
        <Link href="/admin/hesabim/" className="block truncate text-sm font-semibold hover:text-brand">
          {user.name}
        </Link>
        <p className="truncate text-xs text-ink-soft">
          {ROLE_LABEL[user.role]} · {user.email}
        </p>
        <div className="mt-3 flex items-center gap-1">
          <form action={logout}>
            <input type="hidden" name="csrf" value={csrf} />
            <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-ink-muted hover:bg-surface-2 hover:text-ink">
              <LogOut aria-hidden className="size-4" /> Çıkış
            </button>
          </form>
          <Link href="/" target="_blank" className="inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-ink-muted hover:bg-surface-2 hover:text-ink">
            <ExternalLink aria-hidden className="size-4" /> Site
          </Link>
          <ThemeToggle className="ml-auto size-9" />
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-surface lg:block">{sidebar}</aside>

      {/* Mobil */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Menüyü aç" aria-expanded={open} className="inline-flex size-10 items-center justify-center rounded-md hover:bg-surface-2">
          <Menu aria-hidden className="size-5" />
        </button>
        <span className="font-display font-semibold">Lagen Yönetim</span>
        <span className="size-10" />
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Yönetim menüsü">
          <button type="button" aria-label="Menüyü kapat" className="absolute inset-0 bg-deep/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-surface shadow-float">
            <button type="button" onClick={() => setOpen(false)} aria-label="Menüyü kapat" className="absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-md hover:bg-surface-2">
              <X aria-hidden className="size-5" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="min-w-0">{children}</div>
    </div>
  );
}
