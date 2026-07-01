import type { Floor, Zone } from "@/lib/db";
import { RISK_COLORS, type RiskLevel } from "@/lib/vulnerability";
import { DoorOpen, DoorClosed } from "lucide-react";

interface FloorPlanProps {
  floor: Floor;
  zones: Zone[];
  zoneRisks?: Record<number, RiskLevel>;
  onZoneClick?: (zone: Zone) => void;
  selectedZoneId?: number | null;
  showExits?: boolean;
  transparentBackground?: boolean;
}

export function FloorPlan({
  floor,
  zones,
  zoneRisks,
  onZoneClick,
  selectedZoneId,
  showExits = true,
  transparentBackground = false,
}: FloorPlanProps) {
  const exits = Array.from({ length: floor.totalExits }).map((_, i) => ({
    idx: i,
    blocked: i < floor.blockedExits,
    pos: [
      { x: 2, y: 50 },
      { x: 98, y: 50 },
      { x: 50, y: 2 },
      { x: 50, y: 98 },
    ][i % 4],
  }));

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border border-border ${transparentBackground ? "bg-transparent" : "bg-secondary"}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="block w-full h-auto relative z-10"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id={`grid-${floor.id}`} width="5" height="5" patternUnits="userSpaceOnUse">
            <path
              d="M 5 0 L 0 0 0 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.15"
              className="text-border"
            />
          </pattern>
        </defs>
        {!transparentBackground && (
          <rect width="100" height="100" fill={`url(#grid-${floor.id})`} />
        )}
        <rect
          x="1"
          y="1"
          width="98"
          height="98"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border"
        />

        {zones.map((z) => {
          const risk: RiskLevel = zoneRisks?.[z.id!] ?? "SAFE";
          const fill = RISK_COLORS[risk];
          const selected = selectedZoneId === z.id;
          return (
            <g
              key={z.id}
              onClick={() => onZoneClick?.(z)}
              className={onZoneClick ? "cursor-pointer" : ""}
            >
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                fill={fill}
                fillOpacity={
                  risk === "SAFE"
                    ? transparentBackground
                      ? 0.05
                      : 0.18
                    : transparentBackground
                      ? 0.35
                      : 0.55
                }
                stroke={selected ? "white" : fill}
                strokeWidth={selected ? 0.7 : transparentBackground ? 0.5 : 0.3}
              />
              <text
                x={z.x + 1.5}
                y={z.y + 4}
                fontSize="2.4"
                fill="white"
                fontWeight="600"
                style={{ pointerEvents: "none" }}
              >
                {z.zoneId}
              </text>
              <text
                x={z.x + 1.5}
                y={z.y + 7}
                fontSize="2"
                fill="white"
                fillOpacity="0.85"
                style={{ pointerEvents: "none", display: transparentBackground ? "none" : "block" }}
              >
                {z.name} · {z.occupancy} pax
              </text>
            </g>
          );
        })}

        {showExits &&
          exits.map((e) => (
            <g key={e.idx} transform={`translate(${e.pos.x - 2.5}, ${e.pos.y - 2.5})`}>
              <rect
                width="5"
                height="5"
                rx="1"
                fill={e.blocked ? "var(--risk-red)" : "var(--risk-green)"}
              />
            </g>
          ))}
      </svg>
      {showExits && (
        <div className="absolute bottom-2 right-2 flex gap-3 rounded-md bg-card/80 px-3 py-1.5 text-[10px] backdrop-blur z-20">
          <span className="flex items-center gap-1">
            <DoorOpen className="h-3 w-3 text-risk-green" /> {floor.availableExits} open
          </span>
          <span className="flex items-center gap-1">
            <DoorClosed className="h-3 w-3 text-risk-red" /> {floor.blockedExits} blocked
          </span>
        </div>
      )}
    </div>
  );
}
