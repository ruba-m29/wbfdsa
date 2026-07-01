import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "danger" | "warn" | "success";
  hint?: string;
}) {
  const toneClass = {
    default: "text-foreground",
    danger: "text-risk-red",
    warn: "text-risk-orange",
    success: "text-risk-green",
  }[tone];
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
