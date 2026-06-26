import React from "react";
import { ShieldAlert, Users, User, Flame } from "lucide-react";
import { motion } from "framer-motion";
import type { RiskLevelType } from "@/types/floor";

interface RiskCardsProps {
  floorRisk: RiskLevelType;
  occupancyRisk: RiskLevelType;
  individualRisk: RiskLevelType;
  overallFireRisk: RiskLevelType;
}

const RISK_CONFIG = {
  LOW: {
    bg: "bg-risk-green/10 border-risk-green/30 text-risk-green",
    badge: "bg-risk-green/20 text-risk-green",
  },
  MEDIUM: {
    bg: "bg-risk-yellow/10 border-risk-yellow/30 text-risk-yellow",
    badge: "bg-risk-yellow/20 text-risk-yellow",
  },
  HIGH: {
    bg: "bg-risk-orange/10 border-risk-orange/30 text-risk-orange",
    badge: "bg-risk-orange/20 text-risk-orange",
  },
  CRITICAL: {
    bg: "bg-risk-red/10 border-risk-red/30 text-risk-red",
    badge: "bg-risk-red/20 text-risk-red",
  }
};

export function RiskCards({
  floorRisk = "LOW",
  occupancyRisk = "LOW",
  individualRisk = "LOW",
  overallFireRisk = "LOW"
}: RiskCardsProps) {
  const cards = [
    { title: "Floor Risk", value: floorRisk, icon: ShieldAlert, desc: "Building structural & evacuation risk" },
    { title: "Occupancy Risk", value: occupancyRisk, icon: Users, desc: "Density & movement speed coefficient" },
    { title: "Individual Risk", value: individualRisk, icon: User, desc: "Vulnerable personnel & special needs" },
    { title: "Overall Fire Risk", value: overallFireRisk, icon: Flame, desc: "Aggregate audit score assessment" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((c, i) => {
        const Icon = c.icon;
        const config = RISK_CONFIG[c.value] || RISK_CONFIG.LOW;
        
        return (
          <motion.div
            key={c.title}
            variants={item}
            whileHover={{ scale: 1.02, translateY: -2 }}
            className={`rounded-xl border p-4 shadow-sm transition-all bg-card border-border flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">{c.title}</span>
              <div className={`p-1.5 rounded-lg bg-secondary text-muted-foreground`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            
            <div className="space-y-1 mt-2">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase ${config.badge}`}>
                {c.value}
              </span>
              <p className="text-[10px] text-muted-foreground leading-normal">{c.desc}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
