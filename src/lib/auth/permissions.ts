export type Role = "super_admin" | "editor" | "sales";

export type Permission =
  | "dashboard"
  | "content" // blog, hizmet, proje, sayfa, medya
  | "seo" // SEO merkezi, yönlendirmeler, bölgeler
  | "crm" // teklifler, lead'ler
  | "settings"
  | "users"
  | "audit";

const MATRIX: Record<Role, Permission[]> = {
  super_admin: ["dashboard", "content", "seo", "crm", "settings", "users", "audit"],
  editor: ["dashboard", "content", "seo"],
  sales: ["dashboard", "crm"],
};

export const ROLE_LABEL: Record<Role, string> = { super_admin: "Süper yönetici", editor: "Editör", sales: "Satış" };

export function can(role: Role, perm: Permission): boolean {
  return MATRIX[role].includes(perm);
}
