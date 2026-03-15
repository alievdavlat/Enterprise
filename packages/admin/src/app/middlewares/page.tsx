"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { MiddlewareCard } from "@/components/shared";
import { MIDDLEWARES } from "@/consts/plugin-middleware.const";

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
