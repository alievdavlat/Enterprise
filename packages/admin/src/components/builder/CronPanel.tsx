"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Input, Label, Textarea, Switch,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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

const PRESET_SCHEDULES = [
  { label: "Every minute (* * * * *)", value: "* * * * *" },
  { label: "Every 5 minutes (*/5 * * * *)", value: "*/5 * * * *" },
  { label: "Hourly (0 * * * *)", value: "0 * * * *" },
  { label: "Daily at 3am (0 3 * * *)", value: "0 3 * * *" },
  { label: "Weekly Sun 3am (0 3 * * 0)", value: "0 3 * * 0" },
  { label: "Monthly 1st 3am (0 3 1 * *)", value: "0 3 1 * *" },
  { label: "Custom", value: "" },
];

const DEFAULT_CODE = `// app + ctx in scope. ctx = { now, logger }.
// Example: log every tick.
ctx.logger.log("[cron] tick at", ctx.now.toISOString());`;

export function CronPanel() {
  const [system, setSystem] = useState<System | null>(null);
  const [userCrons, setUserCrons] = useState<UserCron[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserCron | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [sys, crons] = await Promise.all([
        api.get("/admin/system"),
        api.get("/admin/cron-jobs"),
      ]);
      setSystem(sys.data?.data ?? null);
      setUserCrons((crons.data?.data ?? []) as UserCron[]);
    } catch { setSystem(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (row: UserCron) => {
    try { await api.put(`/admin/cron-jobs/${row.id}`, { enabled: !row.enabled }); load(); }
    catch (e) { toast.error(asMsg(e) ?? "Toggle failed"); }
  };

  const remove = async (row: UserCron) => {
    if (!confirm(`Delete cron "${row.name}"?`)) return;
    try { await api.delete(`/admin/cron-jobs/${row.id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(asMsg(e) ?? "Delete failed"); }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Cron jobs</CardTitle>
            <CardDescription>Scheduled background tasks. Created from the UI, no restart required.</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline">{userCrons.length}</Badge>
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
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
              onCta={() => { setEditing(null); setDialogOpen(true); }}
            />
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs uppercase">Name</TableHead>
                  <TableHead className="text-xs uppercase">Schedule</TableHead>
                  <TableHead className="text-xs uppercase">Enabled</TableHead>
                  <TableHead className="text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userCrons.map((j) => (
                  <TableRow key={j.id} className="border-border/50">
                    <TableCell className="font-medium">
                      <div>{j.name}</div>
                      {j.description && <div className="text-xs text-muted-foreground">{j.description}</div>}
                    </TableCell>
                    <TableCell><code className="text-xs bg-muted px-2 py-0.5 rounded">{j.schedule}</code></TableCell>
                    <TableCell><Switch checked={!!j.enabled} onCheckedChange={() => toggle(j)} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(j); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(j)}><Trash2 className="w-4 h-4" /></Button>
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
            <CardTitle className="text-sm">File-based jobs (read-only)</CardTitle>
            <CardDescription>From <code>config/cron.ts</code> or <code>src/cron/*.ts</code>. Edit the files + restart to change.</CardDescription>
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
                    <TableCell><code className="text-xs bg-muted px-2 py-0.5 rounded">{j.schedule}</code></TableCell>
                    <TableCell>
                      <Badge variant={j.running ? "default" : "secondary"} className="uppercase text-[10px]">
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

      <CronDialog
        open={dialogOpen} onOpenChange={setDialogOpen} editing={editing}
        onSaved={() => { setDialogOpen(false); load(); }}
      />
    </div>
  );
}

function CronDialog({
  open, onOpenChange, editing, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: UserCron | null; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("0 * * * *");
  const [preset, setPreset] = useState<string>("0 * * * *");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name); setSchedule(editing.schedule);
      const p = PRESET_SCHEDULES.find((x) => x.value === editing.schedule);
      setPreset(p ? p.value : "");
      setCode(editing.code); setDescription(editing.description ?? ""); setEnabled(!!editing.enabled);
    } else {
      setName(""); setSchedule("0 * * * *"); setPreset("0 * * * *");
      setCode(DEFAULT_CODE); setDescription(""); setEnabled(true);
    }
  }, [editing, open]);

  const save = async () => {
    if (!name.trim() || !schedule.trim() || !code.trim()) { toast.error("Name, schedule, code required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/cron-jobs/${editing.id}`, { name, schedule, code, description, enabled });
        toast.success("Updated");
      } else {
        await api.post("/admin/cron-jobs", { name, schedule, code, description, enabled });
        toast.success("Created");
      }
      onSaved();
    } catch (e) { toast.error(asMsg(e) ?? "Save failed"); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit cron job" : "New cron job"}</DialogTitle>
          <DialogDescription>Runs server-side on schedule. <code>app</code> and <code>ctx</code> are in scope.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cron-name">Name</Label>
              <Input id="cron-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="cleanupTokens" disabled={!!editing} />
            </div>
            <div className="space-y-2">
              <Label>Preset</Label>
              <Select value={preset} onValueChange={(v) => { setPreset(v); if (v) setSchedule(v); }}>
                <SelectTrigger><SelectValue placeholder="Pick a preset" /></SelectTrigger>
                <SelectContent>{PRESET_SCHEDULES.map((p) => <SelectItem key={p.label} value={p.value || "__custom__"}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cron-schedule">Schedule (5-field cron)</Label>
            <Input id="cron-schedule" value={schedule} onChange={(e) => setSchedule(e.target.value)} className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cron-description">Description (optional)</Label>
            <Input id="cron-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cron-code">Task code</Label>
            <Textarea id="cron-code" value={code} onChange={(e) => setCode(e.target.value)} rows={12} className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground">Runs inside an async function. Use <code>await app.getDb.findMany(...)</code>, <code>app.service(uid)</code> etc.</p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch id="cron-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="cron-enabled">Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} loading={saving}>{editing ? "Save changes" : "Create cron"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function asMsg(e: unknown): string | undefined {
  return (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
}
