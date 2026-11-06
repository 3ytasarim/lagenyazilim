import { BookOpen, Camera, Code2, LayoutTemplate, Search, Share2, ShoppingBag, Sparkles, type LucideProps } from "lucide-react";
import type { ServiceIcon as IconName } from "@/types/content";

const ICONS = {
  layout: LayoutTemplate,
  search: Search,
  share: Share2,
  code: Code2,
  book: BookOpen,
  camera: Camera,
  cart: ShoppingBag,
  sparkles: Sparkles,
} satisfies Record<IconName, unknown>;

export function ServiceIcon({ name, ...props }: { name: IconName } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden strokeWidth={1.6} {...props} />;
}
