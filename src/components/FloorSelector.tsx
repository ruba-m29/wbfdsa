import React from "react";
import { Building2, Layers, Plus } from "lucide-react";

interface FloorSelectorProps {
  buildings: any[];
  selectedBuildingId: string | null;
  onSelectBuilding: (id: string) => void;
  floors: any[];
  selectedFloorLevel: number | null;
  onSelectFloor: (level: number) => void;
  onAddFloor?: () => void;
}

export function FloorSelector({
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  floors,
  selectedFloorLevel,
  onSelectFloor,
  onAddFloor,
}: FloorSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Building Dropdown Card */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
          <Building2 className="h-3.5 w-3.5 text-primary" /> Building
        </label>
        <select
          value={selectedBuildingId ?? ""}
          onChange={(e) => onSelectBuilding(e.target.value)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus:border-primary"
        >
          {buildings.length === 0 ? (
            <option value="">No buildings found</option>
          ) : (
            buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Floors List Card */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" /> Floors
          </span>
          {onAddFloor && selectedBuildingId && (
            <button
              onClick={onAddFloor}
              className="grid h-6 w-6 place-items-center rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm hover:scale-105 transform duration-150"
              title="Add Floor"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {floors.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No floors added yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {floors.map((f) => (
              <li key={f.id || f.level}>
                <button
                  onClick={() => onSelectFloor(f.level)}
                  className={`w-full text-left rounded-md px-3 py-2 text-xs transition-all flex items-center justify-between ${
                    selectedFloorLevel === f.level
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm translate-x-1"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{f.name || `Floor ${f.level}`}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedFloorLevel === f.level ? "bg-primary-foreground/20" : "bg-muted"
                    }`}
                  >
                    L{f.level}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
