import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { Flame, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { db, logActivity } from "@/lib/db";

export const Route = createFileRoute("/incidents")({
  head: () => ({ meta: [{ title: "Fire Incidents — WB-FDVA" }, { name: "description", content: "Simulate, monitor, and resolve fire incidents." }] }),
  component: IncidentsPage,
});

function IncidentsPage() {
  const buildings = useLiveQuery(() => db.buildings.toArray(), []);
  const [bId, setBId] = useState<number | null>(null);
  useEffect(() => { if (!bId && buildings?.length) setBId(buildings[0].id!); }, [buildings, bId]);

  const floors = useLiveQuery(() => bId ? db.floors.where("buildingId").equals(bId).sortBy("level") : Promise.resolve([] as any[]), [bId]);
  const [fId, setFId] = useState<number | null>(null);
  useEffect(() => { if (floors?.length) setFId(floors[0].id!); }, [floors]);

  const zones = useLiveQuery(() => fId ? db.zones.where("floorId").equals(fId).toArray() : Promise.resolve([] as any[]), [fId]);
  const [zId, setZId] = useState<number | null>(null);
  useEffect(() => { if (zones?.length) setZId(zones[0].id!); }, [zones]);

  const incidents = useLiveQuery(() => db.incidents.orderBy("startedAt").reverse().toArray(), []);

  const startIncident = async () => {
    if (!bId || !fId || !zId) return;
    const id = `INC-${Date.now().toString().slice(-7)}`;
    await db.incidents.add({ incidentId: id, buildingId: bId, floorId: fId, zoneId: zId, sensorId: `SNS-${Math.floor(Math.random() * 900 + 100)}`, startedAt: Date.now(), status: "active" });
    await logActivity("incident", `Incident ${id} reported — vulnerability assessment triggered`);
  };

  const active = (incidents ?? []).filter((i) => i.status === "active");

  return (
    <AppShell title="Fire Incidents" subtitle="Simulate and manage active fire events">
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Flame className="h-4 w-4 text-primary" /> New Incident</h3>
          <label className="text-xs block"><span className="block text-muted-foreground mb-1">Building</span>
            <select className="input w-full" value={bId ?? ""} onChange={(e) => setBId(+e.target.value)}>
              {buildings?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="text-xs block"><span className="block text-muted-foreground mb-1">Floor</span>
            <select className="input w-full" value={fId ?? ""} onChange={(e) => setFId(+e.target.value)}>
              {floors?.map((f) => <option key={f.id} value={f.id}>L{f.level} · {f.name}</option>)}
            </select>
          </label>
          <label className="text-xs block"><span className="block text-muted-foreground mb-1">Zone</span>
            <select className="input w-full" value={zId ?? ""} onChange={(e) => setZId(+e.target.value)}>
              {zones?.map((z) => <option key={z.id} value={z.id}>{z.zoneId} · {z.name}</option>)}
            </select>
          </label>
          <button onClick={startIncident} className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:opacity-90">
            <Flame className="h-4 w-4" /> Start Incident
          </button>
        </div>

        <div className="space-y-4">
          {active.length > 0 && (
            <div className="rounded-lg border border-risk-red/40 bg-risk-red/10 p-4">
              <div className="flex items-center gap-2 text-risk-red font-bold uppercase text-xs tracking-wider">
                <AlertTriangle className="h-4 w-4 animate-pulse" /> {active.length} Active Incident{active.length > 1 ? "s" : ""}
              </div>
              <ul className="mt-3 space-y-2">
                {active.map((i) => {
                  const b = buildings?.find((x) => x.id === i.buildingId);
                  return (
                    <li key={i.id} className="flex items-center justify-between rounded-md bg-card/60 p-3 text-sm">
                      <div>
                        <div className="font-semibold">{i.incidentId}</div>
                        <div className="text-xs text-muted-foreground">{b?.name} · Sensor {i.sensorId} · {new Date(i.startedAt).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2">
                        <Link to="/commander" className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Commander <ArrowRight className="h-3 w-3" /></Link>
                        <button onClick={async () => { await db.incidents.update(i.id!, { status: "resolved", resolvedAt: Date.now() }); await logActivity("incident", `Resolved ${i.incidentId}`); }} className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs">
                          <CheckCircle2 className="h-3 w-3" /> Resolve
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3 text-sm font-semibold">Incident History</div>
            <ul className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {(incidents ?? []).filter((i) => i.status === "resolved").map((i) => {
                const b = buildings?.find((x) => x.id === i.buildingId);
                return (
                  <li key={i.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="font-mono text-xs">{i.incidentId}</div>
                      <div className="text-xs text-muted-foreground truncate">{b?.name} · {new Date(i.startedAt).toLocaleDateString()}</div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-risk-green">Resolved</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}