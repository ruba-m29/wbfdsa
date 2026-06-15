import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Plus, Search, Trash2, Pencil, X, Heart } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { db, type Personnel } from "@/lib/db";

export const Route = createFileRoute("/personnel")({
  head: () => ({ meta: [{ title: "Personnel — WB-FDVA" }, { name: "description", content: "Personnel database with badge, device, and special-needs flags." }] }),
  component: PersonnelPage,
});

const EMPTY: Omit<Personnel, "id"> = { employeeId: "", name: "", age: 30, gender: "Other", department: "Operations", cardId: "", deviceId: "", specialNeeds: false, emergencyContact: "" };

function PersonnelPage() {
  const [q, setQ] = useState("");
  const list = useLiveQuery(() => db.personnel.toArray(), []);
  const [editing, setEditing] = useState<Personnel | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = (list ?? []).filter((p) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.employeeId.toLowerCase().includes(s) || p.department.toLowerCase().includes(s);
  });

  return (
    <AppShell title="Personnel" subtitle={`${list?.length ?? 0} registered`}
      actions={<button onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="h-3.5 w-3.5" /> Add</button>}>
      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, ID, or department" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Dept</th>
              <th className="px-3 py-2 text-left">Card</th>
              <th className="px-3 py-2 text-left">Device</th>
              <th className="px-3 py-2 text-left">Flag</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.slice(0, 100).map((p) => (
              <tr key={p.id} className="hover:bg-secondary/40">
                <td className="px-3 py-2 font-mono text-xs">{p.employeeId}</td>
                <td className="px-3 py-2">{p.name} <span className="text-xs text-muted-foreground">· {p.age}</span></td>
                <td className="px-3 py-2 text-xs">{p.department}</td>
                <td className="px-3 py-2 font-mono text-xs">{p.cardId}</td>
                <td className="px-3 py-2 font-mono text-xs">{p.deviceId}</td>
                <td className="px-3 py-2">{p.specialNeeds && <span className="inline-flex items-center gap-1 rounded bg-accent/20 text-accent px-1.5 py-0.5 text-[10px] font-semibold"><Heart className="h-3 w-3" /> Assist</span>}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => setEditing(p)} className="mr-1 grid h-7 w-7 inline-grid place-items-center rounded hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => db.personnel.delete(p.id!)} className="grid h-7 w-7 inline-grid place-items-center rounded text-risk-red hover:bg-risk-red/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No personnel match your search.</div>}
      </div>

      {(creating || editing) && (
        <PersonnelForm initial={editing ?? EMPTY} onClose={() => { setCreating(false); setEditing(null); }} onSave={async (data) => {
          if (editing) await db.personnel.update(editing.id!, data);
          else await db.personnel.add(data);
          setCreating(false); setEditing(null);
        }} />
      )}
    </AppShell>
  );
}

function PersonnelForm({ initial, onClose, onSave }: { initial: Omit<Personnel, "id"> | Personnel; onClose: () => void; onSave: (p: Omit<Personnel, "id">) => void }) {
  const [form, setForm] = useState({ ...initial });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-semibold">{"id" in initial && initial.id ? "Edit Personnel" : "Add Personnel"}</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); const { id: _i, ...rest } = form as Personnel; onSave(rest); }} className="grid gap-3 p-5 sm:grid-cols-2">
          <Input label="Employee ID" value={form.employeeId} onChange={(v) => setForm({ ...form, employeeId: v })} />
          <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Age" type="number" value={String(form.age)} onChange={(v) => setForm({ ...form, age: +v })} />
          <label className="text-xs"><span className="block text-muted-foreground mb-1">Gender</span>
            <select className="input w-full" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Personnel["gender"] })}>
              <option>M</option><option>F</option><option>Other</option>
            </select>
          </label>
          <Input label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
          <Input label="Card ID" value={form.cardId} onChange={(v) => setForm({ ...form, cardId: v })} />
          <Input label="Device ID" value={form.deviceId} onChange={(v) => setForm({ ...form, deviceId: v })} />
          <Input label="Emergency Contact" value={form.emergencyContact} onChange={(v) => setForm({ ...form, emergencyContact: v })} />
          <label className="sm:col-span-2 mt-1 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.specialNeeds} onChange={(e) => setForm({ ...form, specialNeeds: e.target.checked })} />
            Requires special assistance during evacuation
          </label>
          <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="text-xs"><span className="block text-muted-foreground mb-1">{label}</span>
      <input className="input w-full" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}