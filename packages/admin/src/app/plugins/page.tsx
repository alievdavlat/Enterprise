"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge } from "@enterprise/design-system";
import { Blocks, Folder } from "lucide-react";
import { toast } from "sonner";
import { PLUGINS } from "@/consts/plugin-middleware.const";
import { PluginCard } from "@/components/shared";
import { api } from "@/lib/api";

type DiscoveredPlugins = { registered: string[]; disabled: string[] };

export default function PluginsManager() {
  const [plugins, setPlugins] = useState(PLUGINS);
  const [discovered, setDiscovered] = useState<DiscoveredPlugins | null>(null);

  useEffect(() => {
    api
      .get("/admin/plugins")
      .then((res) => {
        const state = (res.data?.data ?? {}) as Record<string, boolean>;
        if (Object.keys(state).length === 0) return;
        setPlugins((prev) =>
          prev.map((p) => (p.id in state ? { ...p, enabled: state[p.id] } : p)),
        );
      })
      .catch(() => {});
    api
      .get("/admin/system")
      .then((r) => setDiscovered(r.data?.data?.plugins ?? null))
      .catch(() => setDiscovered(null));
  }, []);

  const togglePlugin = async (id: string, current: boolean) => {
    const next = !current;
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: next } : p)),
    );
    try {
      await api.post("/admin/plugins/toggle", { plugin: id, enabled: next });
      toast.success(`${next ? "Enabled" : "Disabled"} plugin: ${id}`);
    } catch (e) {
      setPlugins((prev) =>
        prev.map((p) => (p.id === id ? { ...p, enabled: current } : p)),
      );
      toast.error(`Failed to ${next ? "enable" : "disable"} plugin: ${id}`);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 shadow-sm">
            <Blocks className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Plugin Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Extend Enterprise CMS with core and community plugins
            </p>
          </div>
        </div>
        <Button className="shadow-sm font-semibold hover:-translate-y-0.5 transition-transform">
          Browse Market
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plugins.map((plugin) => {
          return (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              togglePlugin={togglePlugin}
            />
          );
        })}
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Folder className="w-4 h-4" /> User plugins (auto-discovered)
          </CardTitle>
          <CardDescription>
            Drop a plugin into <code>src/plugins/&lt;name&gt;/index.ts</code> and toggle it from{" "}
            <code>config/plugins.ts</code>. Reloads on next server start.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!discovered ||
          (discovered.registered.length === 0 && discovered.disabled.length === 0) ? (
            <p className="text-sm text-muted-foreground">
              No user plugins detected. Run{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded">npx create-enterprise-app generate plugin my-plugin</code>{" "}
              to scaffold one.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {discovered.registered.map((name) => (
                <Badge key={name} className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border">
                  {name}
                </Badge>
              ))}
              {discovered.disabled.map((name) => (
                <Badge key={name} variant="secondary" className="opacity-70 line-through">
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
