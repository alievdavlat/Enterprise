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
  Boxes,
  Sparkles,
} from "lucide-react";
import { RoutesPanel } from "@/components/builder/RoutesPanel";
import { MiddlewaresPanel } from "@/components/builder/MiddlewaresPanel";
import { CronPanel } from "@/components/builder/CronPanel";
import { ServicesPanel } from "@/components/builder/ServicesPanel";
import { LifecyclesPanel } from "@/components/builder/LifecyclesPanel";
import { ExtensionsPanel } from "@/components/builder/ExtensionsPanel";
import { PluginsPanel } from "@/components/builder/PluginsPanel";

type TabId = "routes" | "middlewares" | "cron" | "services" | "lifecycles" | "extensions" | "plugins";

interface TabDef {
  id: TabId;
  label: string;
  icon: typeof Network;
  hint: string;
  available: boolean;
  phase?: string;
}

const TABS: TabDef[] = [
  { id: "routes", label: "Routes", icon: Network, hint: "Custom REST endpoints", available: true },
  { id: "middlewares", label: "Middlewares", icon: Layers, hint: "Request pipeline", available: true },
  { id: "cron", label: "Cron jobs", icon: Clock, hint: "Scheduled tasks", available: true },
  { id: "services", label: "Services", icon: Wand2, hint: "Reusable business logic", available: true },
  { id: "lifecycles", label: "Lifecycles", icon: Activity, hint: "Entity hooks", available: true },
  { id: "extensions", label: "Extensions", icon: Puzzle, hint: "Hook into built-in plugins", available: true },
  { id: "plugins", label: "Plugins", icon: Boxes, hint: "Bundle the above as a plugin", available: true },
];

/**
 * Unified no-code backend builder. One page, tabbed nav — author routes /
 * middlewares / cron / (soon) services / lifecycles / plugins without
 * leaving the browser. Selected tab is mirrored in `?tab=...` so reload,
 * back / forward and deep links keep their place.
 */
export default function BuilderPage() {
  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <BuilderInner />
    </Suspense>
  );
}

function BuilderInner() {
  const router = useRouter();
  const search = useSearchParams();
  const initial = (search.get("tab") as TabId | null) ?? "routes";
  const [active, setActive] = useState<TabId>(initial);

  useEffect(() => {
    const current = search.get("tab");
    if (current !== active) {
      router.replace(`/settings/builder?tab=${active}`, { scroll: false });
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeDef = TABS.find((t) => t.id === active);

  return (
    <div className="p-6 md:p-8 space-y-6 animate-in fade-in duration-300 w-full">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-3 rounded-2xl border border-primary/20 shadow-sm">
            <Wrench className="w-7 h-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Code Builder</h1>
              <Sparkles className="w-5 h-5 text-primary/70" />
            </div>
            <p className="text-muted-foreground mt-1.5 max-w-xl text-sm leading-relaxed">
              Build your backend from the UI — routes, middlewares, scheduled tasks and more.
              No code editor, no restart.
            </p>
          </div>
        </div>
        {activeDef && (
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Now editing</span>
            <span className="font-semibold flex items-center gap-2">
              <activeDef.icon className="w-4 h-4" />
              {activeDef.label}
            </span>
          </div>
        )}
      </header>

      {/* Tabs */}
      <Tabs value={active} onValueChange={(v) => setActive(v as TabId)} className="space-y-6">
        <TabsList
          className={[
            // The base variant forces h-8 (32px). Our triggers are 40px so
            // we explicitly raise the container — important enough to leave
            // the comment, the clipped descenders were a real bug.
            "!h-auto min-h-14 p-1.5",
            "bg-muted/40 backdrop-blur",
            "w-full justify-start gap-1",
            "rounded-xl border border-border/50",
            // Horizontal scroll on narrow screens, no vertical bar.
            "overflow-x-auto overflow-y-hidden",
            "flex-nowrap",
          ].join(" ")}>
          {TABS.map(({ id, label, icon: Icon, available, phase, hint }) => (
            <TabsTrigger
              key={id}
              value={id}
              disabled={!available}
              title={available ? hint : `Coming in Phase ${phase}`}
              className={[
                "group relative flex items-center gap-2 h-10 px-4 rounded-lg shrink-0 whitespace-nowrap",
                "text-sm font-medium transition-all",
                "data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground",
                "data-[state=inactive]:text-muted-foreground hover:text-foreground hover:bg-background/60",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {!available && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 ml-0.5 border-amber-400/40 bg-amber-400/10 text-amber-500 dark:text-amber-300">
                  Soon
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="routes" className="m-0 outline-none"><RoutesPanel /></TabsContent>
        <TabsContent value="middlewares" className="m-0 outline-none"><MiddlewaresPanel /></TabsContent>
        <TabsContent value="cron" className="m-0 outline-none"><CronPanel /></TabsContent>
        <TabsContent value="services" className="m-0 outline-none"><ServicesPanel /></TabsContent>
        <TabsContent value="lifecycles" className="m-0 outline-none"><LifecyclesPanel /></TabsContent>
        <TabsContent value="extensions" className="m-0 outline-none"><ExtensionsPanel /></TabsContent>
        <TabsContent value="plugins" className="m-0 outline-none"><PluginsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function ComingSoon({ def }: { def: TabDef }) {
  const Icon = def.icon;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-gradient-to-br from-muted/20 via-transparent to-muted/20 p-12 md:p-16 text-center">
      <div className="absolute inset-0 bg-grid-white/5 pointer-events-none" />
      <div className="relative space-y-5 max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-semibold tracking-tight">{def.label}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{def.hint}</p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          Coming in Phase {def.phase}
        </div>
        <div className="text-xs text-muted-foreground/80 pt-2 space-y-1">
          <p>Need this today? Scaffold from the CLI:</p>
          <code className="inline-block text-[11px] bg-muted px-2 py-1 rounded font-mono">
            enterprise generate {def.label.toLowerCase().split(" ")[0]} &lt;name&gt;
          </code>
        </div>
      </div>
    </div>
  );
}

function BuilderSkeleton() {
  return (
    <div className="p-8 space-y-6 animate-pulse">
      <div className="h-20 bg-muted/30 rounded-2xl" />
      <div className="h-12 bg-muted/30 rounded-xl" />
      <div className="h-96 bg-muted/30 rounded-2xl" />
    </div>
  );
}
