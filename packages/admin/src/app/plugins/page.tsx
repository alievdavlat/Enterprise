"use client";

import { useEffect, useState } from "react";
import { Button } from "@enterprise/design-system";
import { Blocks } from "lucide-react";
import { toast } from "sonner";
import { PLUGINS } from "@/consts/plugin-middleware.const";
import { PluginCard } from "@/components/shared";
import { api } from "@/lib/api";

export default function PluginsManager() {
  const [plugins, setPlugins] = useState(PLUGINS);

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
    </div>
  );
}
