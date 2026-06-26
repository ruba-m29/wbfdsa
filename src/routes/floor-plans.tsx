import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState, useMemo } from "react";
import { Map as MapIcon, Settings, Database, Check, AlertCircle, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { AppShell } from "@/components/app-shell";
import { db } from "@/lib/db";
import { FloorSelector } from "@/components/FloorSelector";
import { RiskCards } from "@/components/RiskCards";
import { FloorStatistics } from "@/components/FloorStatistics";
import { FloorInfoPanel } from "@/components/FloorInfoPanel";
import { CADViewer } from "@/components/CADViewer";
import { UploadCAD } from "@/components/UploadCAD";
import { useFloorData } from "@/hooks/useFloorData";
import { getBackendConfig, saveBackendConfig, type BackendConfig } from "@/services/config";
import { syncFromService, createFloorOnService } from "@/services/dbSync";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/floor-plans")({
  head: () => ({
    meta: [
      { title: "Floor Plans — WB-FDVA" },
      { name: "description", content: "Manage floors, CAD drawings, exits, and risks." }
    ]
  }),
  component: FloorPlansPage,
});

function FloorPlansPage() {
  // Local cache reactive queries for dropdown & selector list
  const buildings = useLiveQuery(() => db.buildings.toArray(), []);
  const [bId, setBId] = useState<number | null>(null);

  // Set default building ID
  useEffect(() => {
    if (!bId && buildings?.length) {
      setBId(buildings[0].id!);
    }
  }, [buildings, bId]);

  const floors = useLiveQuery(
    () => (bId ? db.floors.where("buildingId").equals(bId).sortBy("level") : Promise.resolve<any[]>([])),
    [bId]
  );
  
  const [fLevel, setFLevel] = useState<number | null>(null);

  // Query zones for the selected building to compute occupancy at the floor level
  const zones = useLiveQuery(
    () => (bId ? db.zones.where("buildingId").equals(bId).toArray() : Promise.resolve<any[]>([])),
    [bId]
  );

  // Find the selected floor object
  const selectedFloorObj = useMemo(() => {
    return floors?.find((f) => f.level === fLevel);
  }, [floors, fLevel]);

  // Calculate occupants on this specific floor level
  const floorOccupants = useMemo(() => {
    if (!zones || !selectedFloorObj) return 0;
    const fZones = zones.filter((z) => z.floorId === selectedFloorObj.id);
    return fZones.reduce((s, z) => s + z.occupancy, 0);
  }, [zones, selectedFloorObj]);

  // Constants for heatmap & trend
  const HOURS_2H = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 2), []);
  const DAYS = useMemo(() => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], []);

  // Compute building-occupancy heatmap scaled to floor census
  const heatmapData = useMemo(() => {
    const scale = floorOccupants || 25; // fallback
    return DAYS.map((d, di) =>
      HOURS_2H.map((h) => {
        const weekday = di < 5 ? 1.0 : 0.45;
        const hourFactor = Math.max(0.15, Math.sin(((h - 5) / 12) * Math.PI));
        return Math.round(scale * weekday * hourFactor * 0.15);
      })
    );
  }, [floorOccupants, DAYS, HOURS_2H]);

  // Compute daily trend for charts
  const dailyTrend = useMemo(() => {
    const scale = floorOccupants || 25;
    return HOURS_2H.map((h) => ({
      hour: `${h}:00`,
      occupants: Math.round(scale * (0.2 + 0.8 * Math.max(0.1, Math.sin(((h - 5) / 12) * Math.PI)))),
    }));
  }, [floorOccupants, HOURS_2H]);

  // Set default floor level
  useEffect(() => {
    if (floors?.length) {
      // Find matches
      const currentExists = floors.some(f => f.level === fLevel);
      if (!currentExists) {
        setFLevel(floors[0].level);
      }
    } else {
      setFLevel(null);
    }
  }, [floors]);

  // Hook for floor details, statistics, and drawings fetched from Google Sheets/Airtable
  const buildingIdStr = bId ? String(bId) : null;
  const { floorData, loading, uploadCADFile, updateFloorStats } = useFloorData(buildingIdStr, fLevel);

  // Integration settings state
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<BackendConfig>(getBackendConfig());
  const [syncing, setSyncing] = useState(false);

  const handleSaveConfig = (updates: Partial<BackendConfig>) => {
    const updated = saveBackendConfig(updates);
    setConfig(updated);
    toast.success(`Active storage set to: ${updated.serviceType === "googleSheets" ? "Google Sheets" : "Airtable"}`);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    toast.info("Syncing cached data from selected service...");
    try {
      await syncFromService();
      toast.success("Sync completed successfully!");
      // Reload pages
      if (buildings?.length) {
        setBId(buildings[0].id!);
      }
    } catch {
      toast.error("Failed to sync from backend service.");
    } finally {
      setSyncing(false);
    }
  };

  const handleAddFloor = async () => {
    if (!bId) return;
    const nextLvl = (floors?.length ?? 0) + 1;
    toast.info(`Adding Floor ${nextLvl}...`);
    try {
      await createFloorOnService({
        buildingId: String(bId),
        level: nextLvl,
        name: `Floor ${nextLvl}`,
        totalExits: 2,
        availableExits: 2,
        blockedExits: 0,
        elevatorWorking: true
      });
      toast.success(`Floor ${nextLvl} added successfully!`);
    } catch (err) {
      toast.error("Failed to add floor on active service.");
    }
  };

  return (
    <AppShell 
      title="Floor Plans" 
      subtitle="CAD Draw-sheets, exit counts, and fire risk assessment matrices"
      actions={
        <div className="flex gap-2">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition-colors"
          >
            <Settings className="h-3.5 w-3.5" /> Configure Storage
          </button>
          <button 
            onClick={handleSyncNow}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            <Database className="h-3.5 w-3.5" /> {syncing ? "Syncing..." : "Sync Cache"}
          </button>
        </div>
      }
    >
      {/* Backend Integration Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <div className="p-4 space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="font-semibold flex items-center gap-2 text-foreground">
                  <Database className="h-4 w-4 text-primary" /> Active Storage Service Settings
                </h3>
                <button onClick={() => setShowConfig(false)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <label className="block text-xs">
                  <span className="block text-muted-foreground mb-1">Active Backend Service</span>
                  <select 
                    value={config.serviceType}
                    onChange={(e) => handleSaveConfig({ serviceType: e.target.value as any })}
                    className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                  >
                    <option value="googleSheets">Google Sheets</option>
                    <option value="airtable">Airtable</option>
                  </select>
                </label>
                
                {config.serviceType === "googleSheets" ? (
                  <>
                    <label className="block text-xs">
                      <span className="block text-muted-foreground mb-1">Spreadsheet ID</span>
                      <input 
                        type="text" 
                        placeholder="Spreadsheet key..." 
                        value={config.googleSheetsSpreadsheetId}
                        onChange={(e) => handleSaveConfig({ googleSheetsSpreadsheetId: e.target.value })}
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      />
                    </label>
                    <label className="block text-xs">
                      <span className="block text-muted-foreground mb-1">Apps Script Web App URL</span>
                      <input 
                        type="password" 
                        placeholder="https://script.google.com/..." 
                        value={config.googleSheetsApiKey}
                        onChange={(e) => handleSaveConfig({ googleSheetsApiKey: e.target.value })}
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="block text-xs">
                      <span className="block text-muted-foreground mb-1">Base ID</span>
                      <input 
                        type="text" 
                        placeholder="app..." 
                        value={config.airtableBaseId}
                        onChange={(e) => handleSaveConfig({ airtableBaseId: e.target.value })}
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      />
                    </label>
                    <label className="block text-xs">
                      <span className="block text-muted-foreground mb-1">Personal Access Token (PAT)</span>
                      <input 
                        type="password" 
                        placeholder="pat..." 
                        value={config.airtableApiKey}
                        onChange={(e) => handleSaveConfig({ airtableApiKey: e.target.value })}
                        className="w-full h-8 rounded border border-input bg-background px-2 text-xs"
                      />
                    </label>
                  </>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                <label className="flex items-center gap-1.5 text-muted-foreground">
                  <input 
                    type="checkbox" 
                    checked={config.useMockFallback}
                    onChange={(e) => handleSaveConfig({ useMockFallback: e.target.checked })}
                    className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  Use local storage mock sandbox if keys are unconfigured
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Configured: {config.useMockFallback ? "Local Sandbox Sandbox" : "Remote Live Sync"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Left Side Selector (Desktop Layout) */}
        <div className="space-y-4">
          <FloorSelector
            buildings={buildings ?? []}
            selectedBuildingId={bId ? String(bId) : null}
            onSelectBuilding={(id) => setBId(Number(id))}
            floors={floors ?? []}
            selectedFloorLevel={fLevel}
            onSelectFloor={(level) => setFLevel(level)}
            onAddFloor={handleAddFloor}
          />
          
          {floorData && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">
                Quick Exit Edit
              </h4>
              <div className="grid gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Direct Exits</span>
                  <input
                    type="number"
                    min={0}
                    value={floorData.stats.directExits}
                    onChange={(e) => updateFloorStats({ directExits: Number(e.target.value) })}
                    className="w-16 h-8 rounded border border-input bg-background px-2 text-right text-xs"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Doors Count</span>
                  <input
                    type="number"
                    min={0}
                    value={floorData.stats.doors}
                    onChange={(e) => updateFloorStats({ doors: Number(e.target.value) })}
                    className="w-16 h-8 rounded border border-input bg-background px-2 text-right text-xs"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Windows Count</span>
                  <input
                    type="number"
                    min={0}
                    value={floorData.stats.windows}
                    onChange={(e) => updateFloorStats({ windows: Number(e.target.value) })}
                    className="w-16 h-8 rounded border border-input bg-background px-2 text-right text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload Widget under selector */}
          {floorData && (
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1.5">
                Layout Management
              </h4>
              <UploadCAD onUpload={uploadCADFile} />
            </div>
          )}
        </div>

        {/* Right Side Content Pane */}
        <div className="space-y-4 min-w-0">
          {loading ? (
            <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
              <p className="text-xs text-muted-foreground mt-4">Loading floor blueprint data from active storage...</p>
            </div>
          ) : floorData ? (
            <div className="space-y-4">
              {/* Risk Cards */}
              <RiskCards
                floorRisk={floorData.risks.floorRisk}
                occupancyRisk={floorData.risks.occupancyRisk}
                individualRisk={floorData.risks.individualRisk}
                overallFireRisk={floorData.risks.overallFireRisk}
              />

              {/* Floor Details Panel */}
              <FloorInfoPanel details={floorData.details} />

              {/* CAD Viewer Container */}
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-4 py-2.5">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapIcon className="h-4 w-4 text-primary" /> Blueprints & CAD Viewer
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Level {floorData.level} · {floorData.name}
                  </span>
                </div>
                
                <CADViewer drawing={floorData.drawing} />
              </div>

              {/* Floor Statistics Cards */}
              <FloorStatistics stats={floorData.stats} />

              {/* Occupancy Heatmap & Daily Trends */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-500" /> Floor Occupancy Heatmap & Trends
                  </h3>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Active Census: {floorOccupants} occupants
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-[1fr_260px]">
                  {/* Weekly Heatmap */}
                  <div className="space-y-2 overflow-hidden">
                    <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Weekly Load Cycle</h4>
                    <div className="overflow-x-auto">
                      <div className="inline-grid gap-1 py-1" style={{ gridTemplateColumns: `60px repeat(12, minmax(28px, 1fr))` }}>
                        <div />
                        {HOURS_2H.map((h) => <div key={h} className="text-[9px] text-center text-muted-foreground font-mono">{h}:00</div>)}
                        {DAYS.map((d, di) => (
                          <DayRow key={d} label={d} values={heatmapData[di]} maxVal={floorOccupants * 0.15 || 1} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-medium">
                      <span>Low Load</span>
                      {[15, 35, 55, 75, 95].map((v) => (
                        <span key={v} className="h-3 w-8 rounded-sm" style={{ background: `rgba(229, 90, 50, ${v / 100})` }} />
                      ))}
                      <span>Peak Load</span>
                    </div>
                  </div>

                  {/* Daily Trend Line Chart */}
                  <div className="flex flex-col justify-between min-h-[140px]">
                    <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Daily Census Cycle</h4>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyTrend} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                          <XAxis dataKey="hour" tick={{ fill: "var(--muted-foreground)", fontSize: 8 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 8 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 9 }} />
                          <Line type="monotone" dataKey="occupants" stroke="rgba(229, 90, 50, 1)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center min-h-[400px]">
              <MapIcon className="mx-auto h-10 w-10 mb-3 text-muted-foreground/60" />
              <h4 className="font-semibold text-foreground mb-1">Select a Building & Floor</h4>
              <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
                Choose a registered building and floor level from the left selector pane to display details, risks, and drawing vector layouts.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function DayRow({ label, values, maxVal }: { label: string; values: number[]; maxVal: number }) {
  return (
    <>
      <div className="flex items-center text-[10px] text-muted-foreground font-bold pr-2">{label}</div>
      {values.map((v, i) => {
        const opacity = maxVal > 0 ? Math.min(1.0, Math.max(0.1, v / maxVal)) : 0.1;
        return (
          <div
            key={i}
            className="aspect-square w-full rounded-sm border border-black/5"
            style={{
              background: `rgba(229, 90, 50, ${opacity})`,
            }}
            title={`${v} occupants`}
          />
        );
      })}
    </>
  );
}