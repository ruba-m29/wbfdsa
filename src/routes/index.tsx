import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Building2, Flame, Users, ShieldAlert, Gauge, ArrowRight, Activity } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { db } from "@/lib/db";
import { assessBuilding } from "@/lib/vulnerability";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WB-FDVA" },
      { name: "description", content: "Executive view of buildings, incidents, occupancy, and vulnerability across your portfolio." },
    ],
  }),
  component: Index,
});

function Index() {
  const buildings = useLiveQuery(() => db.buildings.toArray(), []);
  const floors = useLiveQuery(() => db.floors.toArray(), []);
  const zones = useLiveQuery(() => db.zones.toArray(), []);
  const incidents = useLiveQuery(() => db.incidents.orderBy("startedAt").reverse().toArray(), []);
  const activity = useLiveQuery(() => db.activity.orderBy("timestamp").reverse().limit(10).toArray(), []);

  const totalOccupants = zones?.reduce((s, z) => s + z.occupancy, 0) ?? 0;
  const activeIncidents = incidents?.filter((i) => i.status === "active") ?? [];

  const allImpacts = (() => {
    if (!buildings || !floors || !zones) return [];
    return buildings.flatMap((b) => {
      const bFloors = floors.filter((f) => f.buildingId === b.id);
      const bZones = zones.filter((z) => z.buildingId === b.id);
      const incident = activeIncidents.find((i) => i.buildingId === b.id);
      const incFloor = incident ? bFloors.find((f) => f.id === incident.floorId)?.level ?? null : null;
      return assessBuilding(bZones, bFloors, incFloor);
    });
  })();

  const criticalZones = allImpacts.filter((z) => z.risk === "RED").length;
  const avgVuln = allImpacts.length
    ? Math.round(allImpacts.reduce((s, z) => s + z.breakdown.total, 0) / allImpacts.length)
    : 0;

  const occupancyTrend = Array.from({ length: 12 }, (_, i) => ({
    hour: `${i * 2}:00`,
    occupants: Math.round(totalOccupants * (0.4 + 0.6 * Math.sin((i / 12) * Math.PI))),
  }));

  const incidentTrend = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(Date.now() - (6 - i) * 86400000);
    const count = incidents?.filter((inc) => new Date(inc.startedAt).toDateString() === day.toDateString()).length ?? 0;
    return { day: day.toLocaleDateString(undefined, { weekday: "short" }), count };
  });

  const riskDist = [
    { name: "Critical", value: allImpacts.filter((z) => z.risk === "RED").length, color: "var(--risk-red)" },
    { name: "High", value: allImpacts.filter((z) => z.risk === "ORANGE").length, color: "var(--risk-orange)" },
    { name: "Elevated", value: allImpacts.filter((z) => z.risk === "YELLOW").length, color: "var(--risk-yellow)" },
    { name: "Normal", value: allImpacts.filter((z) => z.risk === "SAFE").length, color: "var(--risk-green)" },
  ];

  return (
    <AppShell
      title="Operations Dashboard"
      subtitle="Real-time portfolio readiness and incident status"
      actions={
        <Link to="/commander" className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">
          Commander View <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard label="Total Buildings" value={buildings?.length ?? 0} icon={Building2} />
        <KpiCard label="Active Incidents" value={activeIncidents.length} icon={Flame} tone={activeIncidents.length ? "danger" : "success"} />
        <KpiCard label="CAD Files" value={(buildings?.length ?? 0) * 3} icon={Building2} />
        <KpiCard label="Total Occupants" value={totalOccupants.toLocaleString()} icon={Users} />
        <KpiCard label="Critical Buildings" value={criticalZones > 0 ? 1 : 0} icon={ShieldAlert} tone={criticalZones ? "danger" : "default"} />
        <KpiCard label="Avg Vulnerability" value={avgVuln} icon={Gauge} tone={avgVuln > 50 ? "warn" : "default"} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Vulnerability Trends (Past 6 Months)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={Array.from({ length: 6 }, (_, i) => ({ month: new Date(new Date().setMonth(new Date().getMonth() - (5 - i))).toLocaleString('default', { month: 'short' }), score: 45 + Math.random() * 20 }))}>
              <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Line type="monotone" dataKey="score" stroke="var(--chart-3)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Building Category Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={buildings?.reduce((acc: any[], b) => { const existing = acc.find(x => x.category === b.type); if (existing) existing.count++; else acc.push({ category: b.type, count: 1 }); return acc; }, []) || []}>
              <XAxis dataKey="category" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Bar dataKey="count" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Occupancy Trend (24h)">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={occupancyTrend}>
              <XAxis dataKey="hour" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Line type="monotone" dataKey="occupants" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Incidents (7 days)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incidentTrend}>
              <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Zone Risk Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskDist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                {riskDist.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-[10px] text-muted-foreground">
            {riskDist.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: d.color }} />{d.name} · {d.value}</span>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Activity</h2>
        </div>
        <ul className="divide-y divide-border">
          {(activity ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-block h-2 w-2 rounded-full ${a.kind === "incident" ? "bg-risk-red" : a.kind === "occupancy" ? "bg-risk-orange" : a.kind === "building" ? "bg-chart-4" : "bg-muted-foreground"}`} />
                <span className="truncate">{a.message}</span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-3">{new Date(a.timestamp).toLocaleString()}</span>
            </li>
          ))}
          {(activity ?? []).length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">No activity yet</li>}
        </ul>
      </div>
    </AppShell>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">{title}</h3>
      {children}
    </div>
  );
}
