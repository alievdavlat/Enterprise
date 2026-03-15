"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Blocks,
  Upload,
  Mail,
  Globe,
  Search,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const PLUGINS = [
  {
    id: "i18n",
    name: "Internationalization",
    description: "Create multilingual content",
    icon: Globe,
    enabled: true,
    version: "1.0.0",
  },
  {
    id: "upload",
    name: "Media Library",
    description: "Upload and manage media files",
    icon: Upload,
    enabled: true,
    version: "1.0.0",
  },
  {
    id: "users-permissions",
    name: "Users & Permissions",
    description: "Manage authentication and RBAC",
    icon: ShieldCheck,
    enabled: true,
    version: "1.0.0",
  },
  {
    id: "email",
    name: "Email Provider",
    description: "Send emails from your application",
    icon: Mail,
    enabled: false,
    version: "1.0.0",
  },
  {
    id: "seo",
    name: "SEO Toolkit",
    description: "Manage metadata and SEO attributes",
    icon: Search,
    enabled: false,
    version: "1.0.0",
  },
];

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
          const Icon = plugin.icon;
          return (
            <Card
              key={plugin.id}
              className={`transition-all duration-300 border-border/50 shadow-sm ${plugin.enabled ? "border-primary/30 ring-1 ring-primary/10 shadow-primary/5" : "opacity-80"}`}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div
                    className={`p-3 rounded-xl shadow-sm ${plugin.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <Switch
                    checked={plugin.enabled}
                    onCheckedChange={() =>
                      togglePlugin(plugin.id, plugin.enabled)
                    }
                  />
                </div>
                <CardTitle className="mt-4 flex items-center gap-2">
                  {plugin.name}
                  {plugin.enabled && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </CardTitle>
                <CardDescription className="min-h-[40px] text-sm leading-relaxed">
                  {plugin.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-2 flex justify-between items-center border-t border-border/30 bg-muted/10">
                <Badge
                  variant={plugin.enabled ? "default" : "secondary"}
                  className="font-mono text-xs shadow-none"
                >
                  v{plugin.version}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!plugin.enabled}
                  className="text-primary hover:text-primary hover:bg-primary/10 px-3"
                >
                  Configure
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
