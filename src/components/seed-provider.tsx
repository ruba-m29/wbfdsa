import { useEffect, useState, type ReactNode } from "react";
import { seedIfEmpty } from "@/lib/seed";
import { Flame } from "lucide-react";

export function SeedProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    seedIfEmpty().finally(() => setReady(true));
  }, []);
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Flame className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-sm tracking-wide uppercase">Initializing WB-FDVA</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}