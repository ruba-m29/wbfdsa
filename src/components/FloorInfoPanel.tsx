import React from "react";
import { Calendar, Clipboard, Info, Maximize, ShieldAlert, Users } from "lucide-react";
import type { FloorDetails, RiskLevelType } from "@/types/floor";

interface FloorInfoPanelProps {
  details: FloorDetails;
}

const RISK_BADGE_CLASSES: Record<RiskLevelType, string> = {
  LOW: "bg-risk-green/20 text-risk-green border-risk-green/30",
  MEDIUM: "bg-risk-yellow/20 text-risk-yellow border-risk-yellow/30",
  HIGH: "bg-risk-orange/90 text-white border-risk-orange",
  CRITICAL: "bg-risk-red/90 text-white border-risk-red",
};

export function FloorInfoPanel({ details }: FloorInfoPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2 mb-3">
        Floor Details
      </h4>
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Floor Name</span>
          <span className="font-semibold text-foreground text-right">{details.floorName}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Floor Area</span>
          <span className="font-semibold text-foreground text-right">
            {details.floorArea.toLocaleString()} sq ft
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Max Occupancy</span>
          <span className="font-semibold text-foreground text-right">
            {details.maxOccupancy} pax
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Current Occupancy</span>
          <span className="font-semibold text-foreground text-right">
            {details.currentOccupancy} pax
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Risk Level</span>
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-wider ${RISK_BADGE_CLASSES[details.riskLevel]}`}
          >
            {details.riskLevel}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Revision No.</span>
          <span className="font-semibold text-foreground text-right">{details.revisionNumber}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Upload Date</span>
          <span className="font-semibold text-foreground text-right">{details.uploadDate}</span>
        </div>
      </div>
    </div>
  );
}
