import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { assessBuilding } from "@/lib/vulnerability";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — WB-FDVA" }, { name: "description", content: "Generate incident and building audit reports." }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const buildings = useLiveQuery(() => db.buildings.toArray(), []);
  const incidents = useLiveQuery(() => db.incidents.orderBy("startedAt").reverse().toArray(), []);
  const [reportType, setReportType] = useState<"incident" | "audit">("incident");
  const [targetId, setTargetId] = useState<number | "">("");

  const exportCsv = async () => {
    let rows: string[][] = [];
    if (reportType === "incident" && targetId) {
      const inc = incidents?.find((i) => i.id === targetId);
      if (!inc) return;
      const floors = await db.floors.where("buildingId").equals(inc.buildingId).toArray();
      const zones = await db.zones.where("buildingId").equals(inc.buildingId).toArray();
      const incLevel = floors.find((f) => f.id === inc.floorId)?.level ?? 1;
      const impacts = assessBuilding(zones, floors, incLevel);
      rows = [
        ["Incident", inc.incidentId],
        ["Started", new Date(inc.startedAt).toISOString()],
        [],
        ["Zone", "Floor", "Occupancy", "Special Needs", "Exits", "Risk", "Impact"],
        ...impacts.map((i) => [i.zone.zoneId, String(i.floor.level), String(i.zone.occupancy), String(i.zone.specialNeeds), String(i.floor.availableExits), i.risk, i.breakdown.total.toFixed(2)]),
      ];
    } else if (reportType === "audit" && targetId) {
      const b = buildings?.find((x) => x.id === targetId);
      if (!b) return;
      const floors = await db.floors.where("buildingId").equals(b.id!).sortBy("level");
      const zones = await db.zones.where("buildingId").equals(b.id!).toArray();
      rows = [
        ["Building Audit", b.name],
        ["Type", b.type], ["Address", b.address],
        [],
        ["Floor", "Name", "Total Exits", "Available", "Blocked", "Elevator", "Zones", "Occupancy"],
        ...floors.map((f) => {
          const fz = zones.filter((z) => z.floorId === f.id);
          return [String(f.level), f.name, String(f.totalExits), String(f.availableExits), String(f.blockedExits), f.elevatorWorking ? "OK" : "OFFLINE", String(fz.length), String(fz.reduce((s, z) => s + z.occupancy, 0))];
        }),
      ];
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace?.(/"/g, '""') ?? c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${reportType}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    // Lightweight: render printable HTML via window.print
    window.print();
  };

  return (
    <AppShell title="Reports" subtitle="Audit and incident reporting">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Build Report</h3>
          <label className="block text-xs"><span className="block text-muted-foreground mb-1">Type</span>
            <select value={reportType} onChange={(e) => { setReportType(e.target.value as any); setTargetId(""); }} className="input w-full">
              <option value="incident">Incident Report</option>
              <option value="audit">Building Audit Report</option>
            </select>
          </label>
          <label className="block text-xs"><span className="block text-muted-foreground mb-1">Target</span>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value ? +e.target.value : "")} className="input w-full">
              <option value="">Select…</option>
              {reportType === "incident"
                ? incidents?.map((i) => <option key={i.id} value={i.id}>{i.incidentId} — {new Date(i.startedAt).toLocaleDateString()}</option>)
                : buildings?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={exportCsv} disabled={!targetId} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"><FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV</button>
            <button onClick={exportPdf} disabled={!targetId} className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-semibold disabled:opacity-40"><Download className="h-3.5 w-3.5" /> Print / PDF</button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Report Templates</h3>
          <ul className="space-y-2 text-sm">
            <Template title="Incident Report" items={["Incident Summary", "Building Details", "Occupancy Snapshot", "Vulnerability Calculations", "Rescue Priorities"]} />
            <Template title="Building Audit Report" items={["Floor Information", "Exit Analysis", "Occupancy Analysis"]} />
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function Template({ title, items }: { title: string; items: string[] }) {
  return (
    <li className="rounded-md border border-border bg-secondary p-3">
      <div className="font-semibold text-sm">{title}</div>
      <ul className="mt-1 text-xs text-muted-foreground list-disc list-inside">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </li>
  );
}