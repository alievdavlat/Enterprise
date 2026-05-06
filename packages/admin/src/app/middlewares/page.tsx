"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { MiddlewareCard } from "@/components/shared";
import { MIDDLEWARES } from "@/consts/plugin-middleware.const";
import { api } from "@/lib/api";

export default function MiddlewaresManager() {
  const [middlewares, setMiddlewares] = useState(MIDDLEWARES);

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
    </div>
  );
}
