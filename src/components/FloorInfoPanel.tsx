import React from "react";
import { Calendar, Clipboard, Info, Maximize, ShieldAlert, Users } from "lucide-react";
import type { FloorDetails, RiskLevelType } from "@/types/floor";

interface FloorInfoPanelProps {
  details: FloorDetails;
}

const RISK_BADGE_CLASSES: Record<RiskLevelType, string> = {
  LOW: "bg-risk-green/20 text-risk-green border-risk-green/30",
  MEDIUM: "bg-risk-yellow/20 text-risk-yellow border-risk-yellow/30",
  HIGH: "bg-risk-orange/20 text-risk-orange border-risk-orange/30",
  CRITICAL: "bg-risk-red/20 text-risk-red border-risk-red/30",
};

export function FloorInfoPanel({ details }: FloorInfoPanelProps) {
  const items = [
    { label: "Floor Area", value: `${details.floorArea} sq.m`, icon: Maximize },
    { label: "Max Occupancy", value: `${details.maxOccupancy} Pax`, icon: Users },
    { label: "Current Occupancy", value: `${details.currentOccupancy} Pax`, icon: Users },
    { label: "Revision Number", value: details.revisionNumber, icon: Clipboard },
    { label: "Upload Date", value: details.uploadDate, icon: Calendar },
  ];

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 border-b border-border/80 pb-2.5">
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active Floor Details</span>
          <h3 className="text-base font-bold text-foreground">{details.floorName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" /> Risk Level:</span>
          <span className={`px-2 py-0.5 text-xs font-semibold rounded border uppercase ${RISK_BADGE_CLASSES[details.riskLevel]}`}>
            {details.riskLevel}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <Icon className="h-3 w-3 text-primary" /> {it.label}
              </span>
              <p className="text-xs font-semibold text-foreground pl-4.5">{it.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
