import React from "react";
import { ListOrdered, ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { FloorData } from "@/types/floor";
import { getEvacuationPriority } from "@/services/aiCadService";

interface EvacuationPriorityProps {
  floors: any[];
  currentFloorData?: FloorData | null;
  onSelectFloor: (level: number) => void;
  selectedFloorLevel: number | null;
}

const PRIORITY_STYLES: Record<number, string> = {
  1: "bg-risk-red text-white",
  2: "bg-orange-500 text-white",
  3: "bg-amber-500 text-white",
};

const RISK_BADGE: Record<string, string> = {
  CRITICAL: "text-risk-red bg-risk-red/10 border-risk-red/20",
  HIGH: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  MEDIUM: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  LOW: "text-risk-green bg-risk-green/10 border-risk-green/20",
};

export function EvacuationPriority({
  floors,
  currentFloorData,
  onSelectFloor,
  selectedFloorLevel,
}: EvacuationPriorityProps) {
  const { data: priorities = [], isLoading } = useQuery({
    queryKey: [
      "evacuationPriority",
      floors.map((f) => f.id),
      currentFloorData?.vulnerability?.overallVulnerability,
    ],
    queryFn: () => getEvacuationPriority(floors, currentFloorData),
    enabled: floors.length > 0,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm mt-4 p-6 flex flex-col items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Calculating priority scores...</p>
      </div>
    );
  }

  if (priorities.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden mt-4">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-orange-500" /> Evacuation Priority
        </h3>
        <span className="text-[10px] text-muted-foreground font-medium">
          {priorities.length} floors ranked
        </span>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-12 gap-1 px-3 py-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-card/40">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-3">Floor</div>
        <div className="col-span-2 text-center">Score</div>
        <div className="col-span-2 text-center">Risk</div>
        <div className="col-span-4">Recommended Action</div>
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {priorities.map((p) => {
          const isSelected = selectedFloorLevel === p.level;
          const badgeStyle =
            PRIORITY_STYLES[p.priorityOrder] || "bg-secondary text-muted-foreground";
          const riskStyle = RISK_BADGE[p.riskLevel] || RISK_BADGE.LOW;

          return (
            <button
              key={p.floorId}
              onClick={() => onSelectFloor(p.level)}
              className={`w-full grid grid-cols-12 gap-1 px-3 py-2.5 text-sm items-center border-b border-border transition-colors hover:bg-secondary/50 text-left ${
                isSelected ? "bg-blue-500/5 border-l-2 border-l-blue-500" : ""
              }`}
            >
              {/* Priority badge */}
              <div className="col-span-1 flex justify-center">
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${badgeStyle}`}
                >
                  {p.priorityOrder}
                </div>
              </div>

              {/* Floor name */}
              <div className="col-span-3 font-semibold text-[11px] text-foreground truncate">
                {p.floorName}
              </div>

              {/* Vulnerability score */}
              <div className="col-span-2 text-center font-bold font-mono text-[11px] text-muted-foreground">
                {p.vulnerabilityScore}
              </div>

              {/* Risk level badge */}
              <div className="col-span-2 flex justify-center">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${riskStyle}`}>
                  {p.riskLevel}
                </span>
              </div>

              {/* Recommended order */}
              <div className="col-span-4 flex items-center gap-1 text-[9px] text-muted-foreground leading-tight">
                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                <span className="truncate">{p.recommendedOrder}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 px-3 py-2 bg-secondary/20 border-t border-border text-[9px] text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider">Priority:</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-risk-red" />1 = Evacuate first
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-500" />2 = High risk
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />3 = Medium risk
        </span>
      </div>
    </div>
  );
}
