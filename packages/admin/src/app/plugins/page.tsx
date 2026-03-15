"use client";

import { useState } from "react";
import { Button } from "@enterprise/design-system";
import { Blocks } from "lucide-react";
import { toast } from "sonner";
import { PLUGINS } from "@/consts/plugin-middleware.const";
import { PluginCard } from "@/components/shared";

export default function PluginsManager() {
  const [plugins, setPlugins] = useState(PLUGINS);

  const togglePlugin = (id: string, current: boolean) => {
    setPlugins(
      plugins.map((p) => (p.id === id ? { ...p, enabled: !current } : p)),
    );
    toast.success(`${current ? "Disabled" : "Enabled"} plugin: ${id}`);
    // api.post('/admin/plugins/toggle', { plugin: id, enabled: !current })
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
