"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Switch,
} from "@enterprise/design-system";
import { Plus, Pencil, Trash2, Clock as ClockIcon } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { EmptyState, PanelLoadingSkeleton } from "./shared";

type UserCron = {
  id: number;
  name: string;
  schedule: string;
  code: string;
  enabled: boolean | number;
  description?: string | null;
};

type System = {
  cron: { name: string; schedule: string; running: boolean }[];
};

export function CronPanel() {
  const router = useRouter();
  const [system, setSystem] = useState<System | null>(null);
  const [userCrons, setUserCrons] = useState<UserCron[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [sys, crons] = await Promise.all([
        api.get("/admin/system"),
        api.get("/admin/cron-jobs"),
      ]);
      setSystem(sys.data?.data ?? null);
      setUserCrons((crons.data?.data ?? []) as UserCron[]);
    } catch {
      setSystem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (row: UserCron) => {
    try {
      await api.put(`/admin/cron-jobs/${row.id}`, { enabled: !row.enabled });
      load();
    } catch (e) {
      toast.error(asMsg(e) ?? "Toggle failed");
    }
  };

  const remove = async (row: UserCron) => {
    if (!confirm(`Delete cron "${row.name}"?`)) return;
    try {
      await api.delete(`/admin/cron-jobs/${row.id}`);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(asMsg(e) ?? "Delete failed");
    }
  };

  const goToNew = () => router.push("/settings/builder/cron/new");
  const goToEdit = (row: UserCron) =>
    router.push(`/settings/builder/cron/${row.id}`);

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Cron jobs</CardTitle>
            <CardDescription>
              Scheduled background tasks. Created from the UI, no restart
              required.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline">{userCrons.length}</Badge>
            <Button onClick={goToNew}>
              <Plus className="w-4 h-4 mr-2" /> New cron
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <PanelLoadingSkeleton />
          ) : userCrons.length === 0 ? (
            <EmptyState
              icon={ClockIcon}
              title="No scheduled tasks yet"
              description="Run code on a schedule — cleanups, digest emails, daily backups, anything. Pick a preset or write a 5-field cron expression."
              ctaLabel="Schedule your first cron"
              onCta={goToNew}
            />
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs uppercase">Name</TableHead>
                  <TableHead className="text-xs uppercase">Schedule</TableHead>
                  <TableHead className="text-xs uppercase">Enabled</TableHead>
                  <TableHead className="text-xs uppercase text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userCrons.map((j) => (
                  <TableRow
                    key={j.id}
                    className="border-border/50 cursor-pointer hover:bg-muted/30"
                    onClick={() => goToEdit(j)}>
                    <TableCell className="font-medium">
                      <div>{j.name}</div>
                      {j.description && (
                        <div className="text-xs text-muted-foreground">
                          {j.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {j.schedule}
                      </code>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={!!j.enabled}
                        onCheckedChange={() => toggle(j)}
                      />
                    </TableCell>
                    <TableCell
                      className="text-right space-x-1"
                      onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => goToEdit(j)}
                        title="Edit cron">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => remove(j)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          )}
        </CardContent>
      </Card>

      {system && system.cron.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm">
              File-based jobs (read-only)
            </CardTitle>
            <CardDescription>
              From <code>config/cron.ts</code> or <code>src/cron/*.ts</code>.
              Edit the files + restart to change.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs uppercase">Name</TableHead>
                  <TableHead className="text-xs uppercase">Schedule</TableHead>
                  <TableHead className="text-xs uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {system.cron.map((j) => (
                  <TableRow key={j.name} className="border-border/50">
                    <TableCell className="font-medium">{j.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {j.schedule}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={j.running ? "default" : "secondary"}
                        className="uppercase text-[10px]">
                        {j.running ? "Running" : "Stopped"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function asMsg(e: unknown): string | undefined {
  return (e as { response?: { data?: { error?: { message?: string } } } })
    ?.response?.data?.error?.message;
}
