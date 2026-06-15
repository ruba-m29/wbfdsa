import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/occupancy")({
  head: () => ({ meta: [{ title: "Occupancy — WB-FDVA" }, { name: "description", content: "Occupancy heatmaps and overrides per zone and time." }] }),
  component: OccupancyPage,
});

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function OccupancyPage() {
  const zones = useLiveQuery(() => db.zones.toArray(), []);
  const [zoneId, setZoneId] = useState<number | null>(null);

  const heat = DAYS.map((d, di) => HOURS.map((h) => {
    const weekday = di < 5 ? 1 : 0.4;
    const office = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
    return Math.round(weekday * office * 100);
  }));

  const trend = HOURS.map((h) => ({
    hour: `${h}:00`,
    value: Math.round(Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)) * 100),
  }));

  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), start: "09:00", end: "11:00", expected: 25, label: "Conference Room A" });
  const overrides = useLiveQuery(() => zoneId ? db.occupancy.where("zoneId").equals(zoneId).reverse().toArray() : Promise.resolve([] as any[]), [zoneId]);

  return (
    <AppShell title="Occupancy" subtitle="Time-of-day, day-of-week, and override management">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Weekly Heatmap</h3>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `64px repeat(24, minmax(18px, 1fr))` }}>
              <div />
              {HOURS.map((h) => <div key={h} className="text-[9px] text-center text-muted-foreground">{h}</div>)}
              {DAYS.map((d, di) => (
                <DayRow key={d} label={d} values={heat[di]} />
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Low</span>
            {[10, 30, 50, 70, 90].map((v) => <span key={v} className="h-3 w-6 rounded" style={{ background: `rgba(229, 90, 50, ${v / 100})` }} />)}
            <span>High</span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">Daily Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend}>
              <XAxis dataKey="hour" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Line type="monotone" dataKey="value" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold mb-3">Manual Occupancy Override</h3>
        <div className="grid gap-3 sm:grid-cols-6">
          <label className="sm:col-span-2 text-xs"><span className="block text-muted-foreground mb-1">Zone</span>
            <select value={zoneId ?? ""} onChange={(e) => setZoneId(+e.target.value)} className="input w-full">
              <option value="">Select zone…</option>
              {zones?.map((z) => <option key={z.id} value={z.id}>{z.zoneId} · {z.name}</option>)}
            </select>
          </label>
          <label className="text-xs"><span className="block text-muted-foreground mb-1">Date</span><input type="date" className="input w-full" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <label className="text-xs"><span className="block text-muted-foreground mb-1">Start</span><input type="time" className="input w-full" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></label>
          <label className="text-xs"><span className="block text-muted-foreground mb-1">End</span><input type="time" className="input w-full" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></label>
          <label className="text-xs"><span className="block text-muted-foreground mb-1">Expected</span><input type="number" className="input w-full" value={form.expected} onChange={(e) => setForm({ ...form, expected: +e.target.value })} /></label>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            disabled={!zoneId}
            onClick={async () => {
              if (!zoneId) return;
              await db.occupancy.add({ zoneId, date: form.date, startTime: form.start, endTime: form.end, expectedOccupancy: form.expected, label: form.label });
              await db.zones.update(zoneId, { occupancy: form.expected });
            }}
            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40">
            Save Override
          </button>
        </div>
        {(overrides?.length ?? 0) > 0 && (
          <ul className="mt-4 divide-y divide-border text-xs">
            {overrides?.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2">
                <span>{o.date} · {o.startTime}–{o.endTime}</span>
                <span className="font-mono">{o.expectedOccupancy} pax</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function DayRow({ label, values }: { label: string; values: number[] }) {
  return (
    <>
      <div className="flex items-center text-[10px] text-muted-foreground pr-2">{label}</div>
      {values.map((v, i) => (
        <div key={i} className="aspect-square rounded-sm" style={{ background: `rgba(229, 90, 50, ${Math.min(1, v / 100)})` }} title={`${v}%`} />
      ))}
    </>
  );
}