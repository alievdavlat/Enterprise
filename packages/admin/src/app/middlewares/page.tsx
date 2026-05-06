"use client";

import { useEffect, useState } from "react";
import { Settings2, Folder } from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@enterprise/design-system";
import { MiddlewareCard } from "@/components/shared";
import { MIDDLEWARES } from "@/consts/plugin-middleware.const";
import { api } from "@/lib/api";

type DiscoveredMiddlewares = {
  resolved: string[];
  unresolved: string[];
  discovered: string[];
};

export default function MiddlewaresManager() {
  const [middlewares, setMiddlewares] = useState(MIDDLEWARES);
  const [discovered, setDiscovered] = useState<DiscoveredMiddlewares | null>(null);

  useEffect(() => {
    api
      .get("/admin/middlewares")
      .then((res) => {
        const state = (res.data?.data ?? {}) as Record<string, boolean>;
        if (Object.keys(state).length === 0) return;
        setMiddlewares((prev) =>
          prev.map((m) => (m.id in state ? { ...m, enabled: state[m.id] } : m)),
        );
      })
      .catch(() => {});
    api
      .get("/admin/system")
      .then((r) => setDiscovered(r.data?.data?.middlewares ?? null))
      .catch(() => setDiscovered(null));
  }, []);

  const toggleMiddleware = async (id: string, current: boolean) => {
    const next = !current;
    setMiddlewares((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: next } : m)),
    );
    try {
      await api.post("/admin/middlewares/toggle", {
        middleware: id,
        enabled: next,
      });
      toast.success(`${next ? "Enabled" : "Disabled"} middleware: ${id}`);
    } catch (e) {
      setMiddlewares((prev) =>
        prev.map((m) => (m.id === id ? { ...m, enabled: current } : m)),
      );
      toast.error(`Failed to ${next ? "enable" : "disable"} middleware: ${id}`);
    }
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
        {middlewares.map((middleware) => {
          return (
            <MiddlewareCard
              key={middleware.id}
              middleware={middleware}
              toggleMiddleware={toggleMiddleware}
            />
          );
        })}
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Folder className="w-4 h-4" /> User middlewares (auto-discovered)
          </CardTitle>
          <CardDescription>
            Add a file to <code>src/middlewares/&lt;name&gt;.ts</code> and reference it as{" "}
            <code>"global::&lt;name&gt;"</code> in <code>config/middlewares.ts</code>. Built-ins live
            under the <code>enterprise::</code> namespace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!discovered ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Files in <code>src/middlewares/</code>
                </p>
                {discovered.discovered.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    None.{" "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      npx create-enterprise-app generate middleware request-id
                    </code>
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {discovered.discovered.map((name) => (
                      <Badge key={name} className="bg-sky-500/10 text-sky-600 border-sky-500/30 border">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Resolved (active)
                </p>
                <div className="flex flex-wrap gap-2">
                  {discovered.resolved.map((name) => (
                    <Badge
                      key={name}
                      className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border font-mono text-xs"
                    >
                      {name}
                    </Badge>
                  ))}
                  {discovered.resolved.length === 0 && (
                    <span className="text-sm text-muted-foreground">None</span>
                  )}
                </div>
              </div>
              {discovered.unresolved.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Unresolved (skipped)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {discovered.unresolved.map((name) => (
                      <Badge
                        key={name}
                        className="bg-amber-500/10 text-amber-600 border-amber-500/30 border font-mono text-xs"
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
