"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger, Badge } from "@enterprise/design-system";
import {
  Wrench,
  Network,
  Layers,
  Clock,
  Wand2,
  Activity,
  Puzzle,
  Lock,
} from "lucide-react";
import { RoutesPanel } from "@/components/builder/RoutesPanel";
import { MiddlewaresPanel } from "@/components/builder/MiddlewaresPanel";
import { CronPanel } from "@/components/builder/CronPanel";

type TabId = "routes" | "middlewares" | "cron" | "services" | "lifecycles" | "plugins";

const TABS: { id: TabId; label: string; icon: typeof Network; available: boolean; phase?: string }[] = [
  { id: "routes", label: "Routes", icon: Network, available: true },
  { id: "middlewares", label: "Middlewares", icon: Layers, available: true },
  { id: "cron", label: "Cron jobs", icon: Clock, available: true },
  { id: "services", label: "Services", icon: Wand2, available: false, phase: "Phase 16.4" },
  { id: "lifecycles", label: "Lifecycles", icon: Activity, available: false, phase: "Phase 16.5" },
  { id: "plugins", label: "Plugins", icon: Puzzle, available: false, phase: "Phase 16.6" },
];

/**
 * Unified no-code backend builder. One page, one set of tabs — author
 * routes / middlewares / cron / (soon) services / lifecycles / plugins
 * without leaving the browser. Each tab's URL is reflected in the query
 * string so deep links work and the existing standalone pages can redirect
 * here.
 */
export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading…</div>}>
      <BuilderInner />
    </Suspense>
  );
}

function BuilderInner() {
  const router = useRouter();
  const search = useSearchParams();
  const initial = (search.get("tab") as TabId | null) ?? "routes";
  const [active, setActive] = useState<TabId>(initial);

  // Keep `?tab=...` in sync so reload + back/forward keep the right panel.
  useEffect(() => {
    const current = search.get("tab");
    if (current !== active) {
      const url = `/settings/builder?tab=${active}`;
      router.replace(url, { scroll: false });
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
          <Wrench className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Code Builder</h1>
          <p className="text-muted-foreground mt-1">
            Build your backend from the UI — routes, middlewares, scheduled tasks and more.
            No code editor, no restart.
          </p>
        </div>
      </div>

      <Tabs value={active} onValueChange={(v) => setActive(v as TabId)} className="space-y-4">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 gap-1">
          {TABS.map(({ id, label, icon: Icon, available, phase }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="flex flex-col h-auto py-2 gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary disabled:opacity-50"
              disabled={!available}
              title={!available && phase ? `Coming in ${phase}` : undefined}>
              <Icon className="w-4 h-4" />
              <span className="text-xs">{label}</span>
              {!available && (
                <Badge variant="outline" className="text-[9px] py-0 h-4 mt-0.5">
                  <Lock className="w-2.5 h-2.5 mr-1" />
                  Soon
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="routes" className="m-0"><RoutesPanel /></TabsContent>
        <TabsContent value="middlewares" className="m-0"><MiddlewaresPanel /></TabsContent>
        <TabsContent value="cron" className="m-0"><CronPanel /></TabsContent>
        <TabsContent value="services" className="m-0"><ComingSoon name="Services" phase="16.4" /></TabsContent>
        <TabsContent value="lifecycles" className="m-0"><ComingSoon name="Lifecycle hooks" phase="16.5" /></TabsContent>
        <TabsContent value="plugins" className="m-0"><ComingSoon name="Plugins" phase="16.6" /></TabsContent>
      </Tabs>
    </div>
  );
}

function ComingSoon({ name, phase }: { name: string; phase: string }) {
  return (
    <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-3 bg-muted/20">
      <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Coming in Phase {phase}. Until then, scaffold from the CLI:{" "}
        <code className="text-xs">enterprise generate {name.toLowerCase().split(" ")[0]} &lt;name&gt;</code>
      </p>
    </div>
  );
}
