import React from "react";
import { LogOut, DoorOpen, LayoutGrid, Compass, Landmark, ArrowUpDown, Users, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { FloorStatistics as FloorStatsType } from "@/types/floor";

interface FloorStatisticsProps {
  stats: FloorStatsType;
}

export function FloorStatistics({ stats }: FloorStatisticsProps) {
  const items = [
    { label: "Direct Exits", value: stats.directExits, icon: LogOut, color: "text-risk-green bg-risk-green/10" },
    { label: "Doors", value: stats.doors, icon: DoorOpen, color: "text-blue-500 bg-blue-500/10" },
    { label: "Windows", value: stats.windows, icon: LayoutGrid, color: "text-amber-500 bg-amber-500/10" },
    { label: "Distance to Staircase", value: stats.distanceToStaircase, icon: Compass, color: "text-purple-500 bg-purple-500/10" },
    { label: "Staircases", value: stats.staircases, icon: Landmark, color: "text-orange-500 bg-orange-500/10" },
    { label: "Lifts", value: stats.lifts, icon: ArrowUpDown, color: "text-cyan-500 bg-cyan-500/10" },
    { label: "Maximum Occupancy", value: stats.maxOccupancy, icon: Users, color: "text-pink-500 bg-pink-500/10" },
    { label: "Current Occupancy", value: stats.currentOccupancy, icon: UserCheck, color: "text-teal-500 bg-teal-500/10" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const cardVariant = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-3 grid-cols-2 md:grid-cols-4"
    >
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <motion.div
            key={it.label}
            variants={cardVariant}
            whileHover={{ scale: 1.02 }}
            className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-3.5 hover:shadow-md transition-all duration-200"
          >
            <div className={`p-2.5 rounded-lg shrink-0 ${it.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{it.label}</p>
              <h4 className="text-base font-bold text-foreground mt-0.5">{it.value}</h4>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
