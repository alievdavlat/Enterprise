"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Switch,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  Textarea,
} from "@enterprise/design-system";
import {
  Blocks,
  Settings,
  Layers,
  Clock,
  Repeat2,
  Search,
  ExternalLink,
  Filter,
  Plus,
  Check,
  Trash2,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { PLUGINS, MIDDLEWARES } from "@/consts/plugin-middleware.const";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared";
import { PluginsPanel, MiddlewaresPanel, ExtensionsPanel, CronPanel, LifecyclesPanel } from "./panels";

const TABS = [
  { value: "plugins", label: "Plugins", icon: Blocks },
  { value: "middlewares", label: "Middlewares", icon: Settings },
  { value: "extensions", label: "Extensions", icon: Layers },
  { value: "cron", label: "Cron Jobs", icon: Clock },
  { value: "lifecycles", label: "Lifecycles", icon: Repeat2 },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as TabValue) || "plugins";
  const [tab, setTab] = useState<TabValue>(initialTab);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");

  const onTabChange = (next: string) => {
    setTab(next as TabValue);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Blocks}
        title="Plugins & Tools"
        description="Manage plugins, middlewares, extensions, scheduled jobs and lifecycle hooks — all in one place."
        variant="primary"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-9 w-full sm:w-72"
              />
            </div>
            <div className="flex gap-1 bg-muted/40 p-1 rounded-md">
              {(["all", "enabled", "disabled"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded transition-colors capitalize font-medium",
                    filter === f
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={onTabChange} className="w-full">
        <TabsList className="bg-muted/40 p-1 rounded-xl mb-2 w-full sm:w-fit overflow-x-auto flex">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
            >
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="plugins" className="mt-4">
          <PluginsPanel search={search} filter={filter} />
        </TabsContent>
        <TabsContent value="middlewares" className="mt-4">
          <MiddlewaresPanel search={search} filter={filter} />
        </TabsContent>
        <TabsContent value="extensions" className="mt-4">
          <ExtensionsPanel search={search} />
        </TabsContent>
        <TabsContent value="cron" className="mt-4">
          <CronPanel search={search} filter={filter} />
        </TabsContent>
        <TabsContent value="lifecycles" className="mt-4">
          <LifecyclesPanel search={search} filter={filter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ================== PLUGINS PANEL ==================
