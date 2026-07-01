import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { assessBuilding } from "@/lib/vulnerability";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — WB-FDVA" },
      { name: "description", content: "Generate incident and building audit reports." },
    ],
  }),
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
      const personnel = await db.personnel.toArray();
      const incLevel = floors.find((f) => f.id === inc.floorId)?.level ?? 1;
      const impacts = assessBuilding(zones, floors, incLevel);

      // IVA summary stats
      const totalSpecialNeeds = personnel.filter((p) => p.specialNeeds).length;
      const totalVulnScore = personnel.reduce(
        (s, p) => s + (p.individualVulnerabilityScore ?? 0),
        0,
      );
      const fireImpactTotal = impacts.reduce((s, i) => s + i.breakdown.total, 0);

      rows = [
        ["Incident", inc.incidentId],
        ["Started", new Date(inc.startedAt).toISOString()],
        ["Total Special Needs Personnel", String(totalSpecialNeeds)],
        ["Total IVA Score (all personnel)", totalVulnScore.toFixed(4)],
        ["Total Fire Impact Magnitude", fireImpactTotal.toFixed(2)],
        [],
        ["Zone", "Floor", "Occupancy", "Special Needs", "Exits", "Risk", "Zone Impact"],
        ...impacts.map((i) => [
          i.zone.zoneId,
          String(i.floor.level),
          String(i.zone.occupancy),
          String(i.zone.specialNeeds),
          String(i.floor.availableExits),
          i.risk,
          i.breakdown.total.toFixed(2),
        ]),
        [],
        ["Personnel IVA Report"],
        [
          "Employee ID",
          "Name",
          "Age",
          "Gender",
          "Dept",
          "Assigned Floor",
          "Special Need Category",
          "Disability Factor",
          "IVA Score",
          "Risk Class",
          "Evacuation Priority",
        ],
        ...personnel
          .sort((a, b) => (a.evacuationPriority ?? 7) - (b.evacuationPriority ?? 7))
          .map((p) => [
            p.employeeId,
            p.name,
            String(p.age),
            p.gender,
            p.department,
            String(p.assignedFloor ?? 1),
            p.specialNeedCategory ?? "None",
            String((p.disabilityFactor ?? 1.0).toFixed(2)),
            String(((p.individualVulnerabilityScore ?? 0) * 100).toFixed(1)) + "%",
            p.individualRiskClass ?? "Low",
            String(p.evacuationPriority ?? 7),
          ]),
      ];
    } else if (reportType === "audit" && targetId) {
      const b = buildings?.find((x) => x.id === targetId);
      if (!b) return;
      const floors = await db.floors.where("buildingId").equals(b.id!).sortBy("level");
      const zones = await db.zones.where("buildingId").equals(b.id!).toArray();
      rows = [
        ["Building Audit", b.name],
        ["Type", b.type],
        ["Address", b.address],
        [],
        ["Floor", "Name", "Total Exits", "Available", "Blocked", "Elevator", "Zones", "Occupancy"],
        ...floors.map((f) => {
          const fz = zones.filter((z) => z.floorId === f.id);
          return [
            String(f.level),
            f.name,
            String(f.totalExits),
            String(f.availableExits),
            String(f.blockedExits),
            f.elevatorWorking ? "OK" : "OFFLINE",
            String(fz.length),
            String(fz.reduce((s, z) => s + z.occupancy, 0)),
          ];
        }),
      ];
    }
    const csv = rows
      .map((r) => r.map((c) => `"${c.replace?.(/"/g, '""') ?? c}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}-${Date.now()}.csv`;
    a.click();
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
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> Build Report
          </h3>
          <label className="block text-xs">
            <span className="block text-muted-foreground mb-1">Type</span>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as any);
                setTargetId("");
              }}
              className="input w-full"
            >
              <option value="incident">Incident Report</option>
              <option value="audit">Building Audit Report</option>
              <option value="vulnerability">Vulnerability Report</option>
              <option value="compliance">Fire Safety Compliance Report</option>
            </select>
          </label>
          <label className="block text-xs">
            <span className="block text-muted-foreground mb-1">Target</span>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value ? +e.target.value : "")}
              className="input w-full"
            >
              <option value="">Select…</option>
              {reportType === "incident"
                ? incidents?.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.incidentId} — {new Date(i.startedAt).toLocaleDateString()}
                    </option>
                  ))
                : buildings?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
            </select>
          </label>
          <div className="flex gap-2 pt-2">
            <button
              onClick={exportCsv}
              disabled={!targetId}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button
              onClick={exportPdf}
              disabled={!targetId}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-semibold disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" /> Print / PDF
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Report Templates</h3>
          <ul className="space-y-2 text-sm max-h-[400px] overflow-y-auto">
            <Template
              title="Incident Report"
              items={[
                "Incident Summary",
                "Building Details",
                "Occupancy Snapshot",
                "Vulnerability Calculations",
                "Rescue Priorities",
              ]}
            />
            <Template
              title="Building Audit Report"
              items={[
                "Floor Information",
                "Exit Analysis",
                "Occupancy Analysis",
                "CAD Drawings",
                "Maps",
              ]}
            />
            <Template
              title="Vulnerability Report"
              items={[
                "Patient Vulnerability Index (PVI)",
                "Floor-Level Vulnerability (FLVI)",
                "Formulas",
                "Charts",
              ]}
            />
            <Template
              title="Fire Safety Compliance"
              items={[
                "Compliance Checklist",
                "Fire Resistance Ratings",
                "Exit Capacity Verification",
              ]}
            />
          </ul>
        </div>
      </div>

      {/* Hidden printable report layout */}
      <div className="hidden print:block absolute inset-0 bg-white text-black p-8 z-50 overflow-visible">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wide">TrustGrid.AI</h1>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mt-1">
              Official {reportType.replace("-", " ")} Report
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Generated: {new Date().toLocaleString()}</p>
            <p>ID: {targetId || "N/A"}</p>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">
              Building Details
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Name:</strong> {buildings?.find((b) => b.id === targetId)?.name || "N/A"}
              </div>
              <div>
                <strong>Type:</strong> {buildings?.find((b) => b.id === targetId)?.type || "N/A"}
              </div>
              <div className="col-span-2">
                <strong>Address:</strong>{" "}
                {buildings?.find((b) => b.id === targetId)?.address || "N/A"}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">Location Map</h2>
              <div className="h-48 bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500 text-sm">
                [Map Rendered Here]
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">
                CAD Drawing Preview
              </h2>
              <div className="h-48 bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-500 text-sm">
                [CAD Layout Rendered Here]
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4">
              Vulnerability & Formulas
            </h2>
            <div className="text-sm space-y-2">
              <p>
                <strong>Fire Impact Magnitude Formula:</strong>
              </p>
              <div className="p-4 bg-gray-50 border border-gray-200 font-mono text-xs mt-2">
                FIM = [N × Z × L × (1 / (S − 1))] + (P^Z)
                <br />
                N = Occupants | Z = Zone Multiplier | L = Floor Multiplier
                <br />S = Available Exits | P = Vulnerability-weighted Special Needs Count
              </div>
              <p className="mt-3">
                <strong>Individual Vulnerability Assessment (IVA):</strong>
              </p>
              <div className="p-4 bg-gray-50 border border-gray-200 font-mono text-xs mt-2">
                IVA Score = Base + FloorContribution + DisabilityContribution + AgeContribution +
                SpecialNeedContribution
                <br />
                FloorContribution = (assignedFloor - 1) × 0.08 | (floor dependency, mandatory)
                <br />
                DisabilityContribution = (1 - disabilityFactor) × 0.40
                <br />
                Classification: Low (&lt;25%) | Medium (25–49%) | High (50–74%) | Critical (≥75%)
              </div>
              <p className="mt-3">
                <strong>Total Vulnerability:</strong>
              </p>
              <p className="text-xs text-gray-600">
                Total Vulnerability = f(Floor-Level Vulnerability, Individual Vulnerability) | where
                P in FIM is derived from IVA scores of special-needs personnel on each floor.
              </p>
            </div>
          </section>
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
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </li>
  );
}
