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
import {
  Settings2,
  ShieldAlert,
  Timer,
  ArrowLeftRight,
  FileCode2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const MIDDLEWARES = [
  {
    id: "logger",
    name: "Request Logger",
    description: "Log all incoming requests",
    icon: FileCode2,
    enabled: true,
  },
  {
    id: "cors",
    name: "CORS",
    description: "Enable Cross-Origin Resource Sharing",
    icon: ArrowLeftRight,
    enabled: true,
  },
  {
    id: "rateLimit",
    name: "Rate Limiter",
    description: "Limit repeated requests to APIs",
    icon: Timer,
    enabled: true,
  },
  {
    id: "bodySize",
    name: "Body Size Limit",
    description: "Restrict payload size",
    icon: ShieldAlert,
    enabled: true,
  },
  {
    id: "timeout",
    name: "Request Timeout",
    description: "Cancel slow requests automatically",
    icon: Clock,
    enabled: false,
  },
];

export default function MiddlewaresManager() {
  const [middlewares, setMiddlewares] = useState(MIDDLEWARES);

  const toggleMiddleware = (id: string, current: boolean) => {
    setMiddlewares(
      middlewares.map((m) => (m.id === id ? { ...m, enabled: !current } : m)),
    );
    toast.success(`${current ? "Disabled" : "Enabled"} middleware: ${id}`);
    // api.post('/admin/middlewares/toggle', { middleware: id, enabled: !current })
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 shadow-sm">
            <Settings2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Middlewares</h1>
            <p className="text-muted-foreground mt-1">
              Configure global application behavior and security
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {middlewares.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.id}
              className={`transition-all duration-300 border-border/50 shadow-sm ${m.enabled ? "border-primary/30 ring-1 ring-primary/10 shadow-primary/5" : "opacity-80"}`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2.5 rounded-lg shadow-sm ${m.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {m.name}
                      {m.enabled && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm mt-0.5">
                      {m.description}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={m.enabled}
                  onCheckedChange={() => toggleMiddleware(m.id, m.enabled)}
                  className="data-[state=checked]:bg-primary"
                />
              </CardHeader>
              <CardFooter className="pt-2 flex justify-between items-center border-t border-border/30 bg-muted/10 h-10">
                <div className="text-xs text-muted-foreground font-mono">
                  ID: {m.id}
                </div>
                <button
                  disabled={!m.enabled}
                  className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
                >
                  Edit Configuration
                </button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
