import type { RiskLevel } from "@/lib/vulnerability";
import { RISK_LABEL } from "@/lib/vulnerability";

const styles: Record<RiskLevel, string> = {
  RED: "bg-risk-red/15 text-risk-red border-risk-red/40",
  ORANGE: "bg-risk-orange/15 text-risk-orange border-risk-orange/40",
  YELLOW: "bg-risk-yellow/15 text-risk-yellow border-risk-yellow/40",
  SAFE: "bg-risk-green/15 text-risk-green border-risk-green/40",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[level]}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
      {RISK_LABEL[level]}
    </span>
  );
}