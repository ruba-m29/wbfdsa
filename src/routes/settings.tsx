import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useState } from "react";
import { ZONE_MULTIPLIER } from "@/lib/vulnerability";
import { db } from "@/lib/db";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — WB-FDVA" }, { name: "description", content: "Application preferences, templates, and zone multipliers." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [mult, setMult] = useState(ZONE_MULTIPLIER);

  return (
    <AppShell title="Settings" subtitle="Templates, multipliers, and preferences">
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Zone Multipliers" description="Used in the impact magnitude formula (display only — engine uses defaults).">
          {(["RED", "ORANGE", "YELLOW", "SAFE"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <span className="capitalize">{k.toLowerCase()}</span>
              <input type="number" step="0.1" value={mult[k]} onChange={(e) => setMult({ ...mult, [k]: +e.target.value })} className="input w-24 text-right" />
            </div>
          ))}
        </Section>
        <Section title="Occupancy Defaults" description="Used when seeding new floors.">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label><span className="block text-muted-foreground mb-1">Default Occupancy</span><input className="input w-full" defaultValue="25" /></label>
            <label><span className="block text-muted-foreground mb-1">Default Exits</span><input className="input w-full" defaultValue="3" /></label>
          </div>
        </Section>
        <Section title="Building Templates" description="Quickly seed buildings of a common type.">
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>· Hotel — 6 floors · 5 zones each</li>
            <li>· Hospital — 5 floors · patient + corridor heavy</li>
            <li>· Office — 4 floors · open zones</li>
          </ul>
        </Section>
        <Section title="Data Management" description="Local IndexedDB used by this session.">
          <button onClick={async () => {
            if (!confirm("This wipes all local data and re-seeds. Continue?")) return;
            await Promise.all([db.buildings.clear(), db.floors.clear(), db.zones.clear(), db.personnel.clear(), db.incidents.clear(), db.occupancy.clear(), db.activity.clear()]);
            toast.success("Database cleared — reload to re-seed.");
          }} className="rounded-md border border-risk-red/50 bg-risk-red/10 px-3 py-2 text-xs font-semibold text-risk-red">Reset Local Database</button>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}