import { QUOTE_STATUS_LABEL, type QuoteStatus } from "@/lib/crm";
import { cn } from "@/lib/utils";

const TONE: Record<QuoteStatus, string> = {
  new: "bg-brand text-on-brand",
  reviewing: "bg-brand-tint text-brand",
  contacted: "bg-brand-tint text-brand",
  preparing: "bg-warning/15 text-warning",
  sent: "bg-warning/15 text-warning",
  meeting: "bg-warning/15 text-warning",
  won: "bg-success/15 text-success",
  lost: "bg-danger/10 text-danger",
  archived: "bg-surface-2 text-ink-soft",
};

export function QuoteStatusBadge({ status }: { status: string }) {
  const s = status as QuoteStatus;
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap", TONE[s] ?? "bg-surface-2")}>{QUOTE_STATUS_LABEL[s] ?? status}</span>;
}
