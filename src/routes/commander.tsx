import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { assessBuilding, RISK_COLORS, IVA_RISK_COLORS } from "@/lib/vulnerability";
import { FloorPlan } from "@/components/floor-plan";
import { RiskBadge } from "@/components/risk-badge";
import { Users, Heart, Flame, MapPin, Navigation, Truck } from "lucide-react";
import type { IVARiskClass } from "@/lib/db";

export const Route = createFileRoute("/commander")({
  head: () => ({
    meta: [
      { title: "Commander View — WB-FDVA" },
      {
        name: "description",
        content: "Full-screen incident command and rescue prioritization dashboard.",
      },
    ],
  }),
  component: CommanderPage,
});

function CommanderPage() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const incident = useLiveQuery(
    () => db.incidents.where("status").equals("active").first(),
    [tick],
  );
  const building = useLiveQuery(
    () => (incident ? db.buildings.get(incident.buildingId) : Promise.resolve(undefined as any)),
    [incident],
  );
  const floors = useLiveQuery(
    () =>
      incident
        ? db.floors.where("buildingId").equals(incident.buildingId).sortBy("level")
        : Promise.resolve([] as any[]),
    [incident],
  );
  const zones = useLiveQuery(
    () =>
      incident
        ? db.zones.where("buildingId").equals(incident.buildingId).toArray()
        : Promise.resolve([] as any[]),
    [incident],
  );

  const incFloorLevel =
    incident && floors ? (floors.find((f) => f.id === incident.floorId)?.level ?? null) : null;
  const impacts = useMemo(
    () =>
      zones && floors
        ? assessBuilding(zones, floors, incFloorLevel).sort(
            (a, b) => b.breakdown.total - a.breakdown.total,
          )
        : [],
    [zones, floors, incFloorLevel],
  );
  const riskMap: Record<number, any> = Object.fromEntries(impacts.map((i) => [i.zone.id!, i.risk]));

  // IVA: load personnel for this building and sort by evacuation priority + IVA score
  const allPersonnel = useLiveQuery(() => db.personnel.toArray(), []);
  const ivaSorted = useMemo(() => {
    if (!allPersonnel) return [];
    return [...allPersonnel]
      .filter((p) => p.evacuationPriority !== undefined)
      .sort((a, b) => {
        const pa = a.evacuationPriority ?? 7;
        const pb = b.evacuationPriority ?? 7;
        if (pa !== pb) return pa - pb;
        return (b.individualVulnerabilityScore ?? 0) - (a.individualVulnerabilityScore ?? 0);
      });
  }, [allPersonnel]);

  const ivaSpecialCount = (allPersonnel ?? []).filter((p) => p.specialNeeds).length;

  if (!incident) {
    return (
      <AppShell title="Commander View" subtitle="Awaiting active incident">
        <div className="grid place-items-center py-24 text-center">
          <Flame className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-3 text-lg font-semibold">No active incident</h2>
          <p className="text-sm text-muted-foreground">
            Start an incident from the Fire Incidents page to activate this view.
          </p>
        </div>
      </AppShell>
    );
  }

  const totalOcc = impacts.reduce((s, i) => s + i.zone.occupancy, 0);
  const totalSN = ivaSpecialCount;
  const critical = impacts.filter((i) => i.risk === "RED");

  return (
    <AppShell
      title={`COMMAND · ${incident.incidentId}`}
      subtitle={`${building?.name} · Started ${new Date(incident.startedAt).toLocaleTimeString()} · auto-refresh 5s`}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Left Column - Maps & Floor Plans */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden h-64 relative">
            <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=40.7128,-74.0060&zoom=16&size=800x400&maptype=satellite')] bg-cover bg-center opacity-70 mix-blend-luminosity"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-risk-red" /> Building Location
                </h3>
                <p className="text-xs text-foreground/80">{building?.address}</p>
              </div>
              <div className="bg-background/90 backdrop-blur rounded px-3 py-1.5 border border-border shadow-sm flex items-center gap-2">
                <Navigation className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[10px] uppercase font-bold text-blue-500">
                  Evacuation Route: Primary Active
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-risk-red/40 bg-card p-4">
            <h3 className="text-xs uppercase tracking-[0.18em] text-risk-red mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 animate-pulse" /> Live Floor Plans
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {floors
                ?.slice()
                .reverse()
                .map((f) => (
                  <div key={f.id}>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      L{f.level}{" "}
                      {f.id === incident.floorId && (
                        <span className="ml-1 rounded bg-risk-red text-primary-foreground px-1.5 py-0.5">
                          ORIGIN
                        </span>
                      )}
                    </div>
                    <FloorPlan
                      floor={f}
                      zones={zones?.filter((z) => z.floorId === f.id) ?? []}
                      zoneRisks={riskMap}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Resources */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={Users} label="Occupants" value={totalOcc} />
            <Stat icon={Heart} label="Special Needs" value={totalSN} tone="warn" />
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" /> Resources Deployment
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-blue-500">Fire Engines</span>
                <span className="font-mono bg-secondary px-2 py-0.5 rounded">3 En Route</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-risk-orange">Ambulances</span>
                <span className="font-mono bg-secondary px-2 py-0.5 rounded">2 Arrived</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-risk-green">Hazmat Team</span>
                <span className="font-mono bg-secondary px-2 py-0.5 rounded">Standby</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3 text-sm font-semibold flex items-center justify-between">
              <span>Rescue Priority</span>
              <span className="text-[10px] uppercase text-muted-foreground">
                {critical.length} critical zones
              </span>
            </div>
            {/* IVA-sorted individual evacuation list */}
            {ivaSorted.length > 0 ? (
              <ol className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {ivaSorted.slice(0, 12).map((p, idx) => {
                  const rc = (p.individualRiskClass ?? "Low") as IVARiskClass;
                  const color = IVA_RISK_COLORS[rc];
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20"
                    >
                      <div
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md font-bold text-sm"
                        style={{ background: `${color}33`, color }}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          F{p.assignedFloor ?? 1} · {p.specialNeedCategory ?? "None"} · Age {p.age}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-bold" style={{ color }}>
                          {((p.individualVulnerabilityScore ?? 0) * 100).toFixed(0)}%
                        </div>
                        <div
                          className="inline-block rounded px-1.5 py-0.5 text-[10px] font-bold"
                          style={{ background: `${color}22`, color }}
                        >
                          {rc}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <ol className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {impacts.slice(0, 12).map((i, idx) => (
                  <li
                    key={i.zone.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20"
                  >
                    <div
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md font-bold text-sm"
                      style={{ background: `${RISK_COLORS[i.risk]}33`, color: RISK_COLORS[i.risk] }}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">
                        {i.zone.zoneId} · {i.zone.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        L{i.floor.level} · {i.zone.occupancy} pax · {i.zone.specialNeeds} SN
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="font-mono text-sm font-bold"
                        style={{ color: RISK_COLORS[i.risk] }}
                      >
                        {Math.round(i.breakdown.total)}
                      </div>
                      <RiskBadge level={i.risk} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: any) {
  const c = tone === "warn" ? "text-risk-orange" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${c}`} />
      </div>
      <div className={`mt-1 text-3xl font-bold tabular-nums ${c}`}>{value}</div>
    </div>
  );
}
