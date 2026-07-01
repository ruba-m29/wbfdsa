import React from "react";
import {
  LogOut,
  DoorOpen,
  LayoutGrid,
  Compass,
  Landmark,
  ArrowUpDown,
  Users,
  UserCheck,
  Navigation,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import type {
  FloorStatistics as FloorStatsType,
  FloorVulnerability,
  RiskLevelType,
} from "@/types/floor";

interface FloorStatisticsProps {
  stats: FloorStatsType;
  vulnerability?: FloorVulnerability;
  floorRisk?: RiskLevelType;
}

const RISK_COLOR: Record<RiskLevelType, string> = {
  LOW: "text-risk-green bg-risk-green/10",
  MEDIUM: "text-amber-500 bg-amber-500/10",
  HIGH: "text-orange-500 bg-orange-500/10",
  CRITICAL: "text-risk-red bg-risk-red/10",
};

export function FloorStatistics({ stats, vulnerability, floorRisk }: FloorStatisticsProps) {
  const items = [
    // ── Risk / vulnerability summary cards ──
    ...(floorRisk
      ? [
          {
            label: "Floor Risk Level",
            value: floorRisk,
            icon: ShieldCheck,
            color: RISK_COLOR[floorRisk],
          },
        ]
      : []),
    ...(vulnerability
      ? [
          {
            label: "Vulnerability Score",
            value: `${vulnerability.overallVulnerability}%`,
            icon: AlertTriangle,
            color:
              vulnerability.overallVulnerability > 75
                ? "text-risk-red bg-risk-red/10"
                : vulnerability.overallVulnerability > 55
                  ? "text-orange-500 bg-orange-500/10"
                  : vulnerability.overallVulnerability > 35
                    ? "text-amber-500 bg-amber-500/10"
                    : "text-risk-green bg-risk-green/10",
          },
        ]
      : []),

    // ── Structural stats ──
    {
      label: "Direct Exits",
      value: stats.directExits,
      icon: LogOut,
      color: "text-risk-green bg-risk-green/10",
    },
    {
      label: "Emergency Exits",
      value: stats.emergencyExits ?? 0,
      icon: AlertTriangle,
      color: "text-red-500 bg-red-500/10",
    },
    { label: "Doors", value: stats.doors, icon: DoorOpen, color: "text-blue-500 bg-blue-500/10" },
    {
      label: "Windows",
      value: stats.windows,
      icon: LayoutGrid,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      label: "Staircases",
      value: stats.staircases,
      icon: Landmark,
      color: "text-orange-500 bg-orange-500/10",
    },
    {
      label: "Lifts",
      value: stats.lifts,
      icon: ArrowUpDown,
      color: "text-cyan-500 bg-cyan-500/10",
    },
    {
      label: "Avg Dist · Staircase",
      value: stats.distanceToStaircase,
      icon: Compass,
      color: "text-purple-500 bg-purple-500/10",
    },
    {
      label: "Avg Dist · Lift",
      value: stats.distanceToLift || "N/A",
      icon: Navigation,
      color: "text-indigo-500 bg-indigo-500/10",
    },
    {
      label: "Max Occupancy",
      value: stats.maxOccupancy,
      icon: Users,
      color: "text-pink-500 bg-pink-500/10",
    },
    {
      label: "Current Occupancy",
      value: stats.currentOccupancy,
      icon: UserCheck,
      color: "text-teal-500 bg-teal-500/10",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.03 },
    },
  };

  const cardVariant = {
    hidden: { opacity: 0, scale: 0.93, y: 6 },
    show: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <motion.div
      key={`${stats.doors}-${stats.staircases}`} // re-animate when floor changes
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
    >
      {items.map((it) => {
        const Icon = it.icon;
        const isString = typeof it.value === "string";
        return (
          <motion.div
            key={it.label}
            variants={cardVariant}
            whileHover={{ scale: 1.03, translateY: -2 }}
            className="rounded-xl border border-border bg-card/60 p-3 shadow-sm flex flex-col justify-center gap-1.5 hover:shadow-md transition-all duration-200"
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-full truncate">
              {it.label}
            </p>
            <div className="flex items-center gap-2 w-full">
              <div className={`p-1 rounded-md ${it.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <h4
                className={`${isString ? "text-base" : "text-xl"} font-bold text-foreground truncate leading-none`}
                title={String(it.value)}
              >
                {it.value}
              </h4>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
