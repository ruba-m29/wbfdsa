import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Building2, Map, Users, Flame, ShieldAlert, FileText, Settings, CalendarRange, Radio } from "lucide-react";
import { useApp } from "@/lib/store";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/buildings", label: "Buildings", icon: Building2 },
  { to: "/floor-plans", label: "Floor Plans", icon: Map },
  { to: "/occupancy", label: "Occupancy", icon: CalendarRange },
  { to: "/personnel", label: "Personnel", icon: Users },
  { to: "/incidents", label: "Fire Incidents", icon: Flame },
  { to: "/vulnerability", label: "Vulnerability", icon: ShieldAlert },
  { to: "/commander", label: "Commander View", icon: Radio },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { role } = useApp();

  return (
    <aside className="hidden md:flex h-screen sticky top-0 w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-[0_0_24px_-6px_var(--primary)]">
          <Flame className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-tight">WB-FDVA</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Ops Console</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3 text-xs">
        <div className="text-muted-foreground">Signed in as</div>
        <div className="font-medium">{role}</div>
      </div>
    </aside>
  );
}