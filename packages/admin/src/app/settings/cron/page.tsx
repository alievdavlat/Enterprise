"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from "@enterprise/design-system";
import { Clock, Code2 } from "lucide-react";
import { api } from "@/lib/api";

type System = {
  plugins: { registered: string[]; disabled: string[] };
  middlewares: { resolved: string[]; unresolved: string[]; discovered: string[] };
  cron: { name: string; schedule: string; running: boolean }[];
  services: { registered: string[]; skipped: string[] };
};

export default function CronPage() {
  const [system, setSystem] = useState<System | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/system")
      .then((r) => setSystem(r.data?.data ?? null))
      .catch(() => setSystem(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cron jobs</h1>
            <p className="text-muted-foreground mt-1">
              Scheduled tasks loaded from <code>config/cron.ts</code> or{" "}
              <code>src/cron/*.ts</code>.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Registered jobs</CardTitle>
          <CardDescription>
            Jobs run while the server is up. Edit your project files and restart to add or remove
            entries.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : !system || system.cron.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No cron jobs registered. Add one with:
              <pre className="bg-muted/50 mt-3 mx-auto max-w-md p-3 rounded text-xs text-left">
                {`// config/cron.ts\nexport default {\n  cleanupTokens: {\n    schedule: "0 * * * *",\n    task: async ({ app }) => { ... }\n  }\n}`}
              </pre>
            </div>
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold uppercase text-xs">Name</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Schedule</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {system.cron.map((j) => (
                  <TableRow key={j.name} className="border-border/50">
                    <TableCell className="font-medium">{j.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{j.schedule}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={j.running ? "default" : "secondary"} className="uppercase text-[10px]">
                        {j.running ? "Running" : "Stopped"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          )}
        </CardContent>
      </Card>

      {system && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="w-4 h-4" /> Auto-discovered services
            </CardTitle>
            <CardDescription>
              Files under <code>src/api/&lt;name&gt;/services/&lt;name&gt;.ts</code> registered with
              the service registry. Call them from plugins or routes via{" "}
              <code>app.service(uid)</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {system.services.registered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services registered.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {system.services.registered.map((u) => (
                  <li key={u} className="font-mono text-xs">
                    {u}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
