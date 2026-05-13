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
  Button,
  Input,
  Label,
  Textarea,
  Switch,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@enterprise/design-system";
import { Clock, Code2, Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

type System = {
  plugins: { registered: string[]; disabled: string[] };
  middlewares: { resolved: string[]; unresolved: string[]; discovered: string[] };
  cron: { name: string; schedule: string; running: boolean }[];
  services: { registered: string[]; skipped: string[] };
};

type UserCron = {
  id: number;
  name: string;
  schedule: string;
  code: string;
  enabled: boolean | number;
  description?: string | null;
  created_at?: string;
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

const DEFAULT_CODE = `// Available in scope:
//   app   — EnterpriseServer instance (use app.getDb, app.service(uid), etc.)
//   ctx   — { now: Date, logger: console }
//
// Example: log every hour to verify the job fires.
ctx.logger.log("[cron] tick at", ctx.now.toISOString());`;

export default function CronPage() {
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
    } catch {
      setSystem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (row: UserCron) => {
    setEditing(row);
    setDialogOpen(true);
  };

  const handleDelete = async (row: UserCron) => {
    if (!confirm(`Delete cron "${row.name}"?`)) return;
    try {
      await api.delete(`/admin/cron-jobs/${row.id}`);
      toast.success("Cron deleted");
      load();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Delete failed");
    }
  };

  const toggleEnabled = async (row: UserCron) => {
    try {
      await api.put(`/admin/cron-jobs/${row.id}`, { enabled: !row.enabled });
      load();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Toggle failed");
    }
  };

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
              Schedule tasks from the UI — no code files, no restart.
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> New cron
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Your scheduled jobs</CardTitle>
            <CardDescription>
              Created via the admin UI. Toggle enabled to pause without deleting.
            </CardDescription>
          </div>
          <Badge variant="outline">{userCrons.length}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : userCrons.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No cron jobs yet. Click <b>New cron</b> to create your first one.
            </div>
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold uppercase text-xs">Name</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Schedule</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Enabled</TableHead>
                  <TableHead className="font-semibold uppercase text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userCrons.map((j) => (
                  <TableRow key={j.id} className="border-border/50">
                    <TableCell className="font-medium">
                      <div>{j.name}</div>
                      {j.description && (
                        <div className="text-xs text-muted-foreground">{j.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{j.schedule}</code>
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!j.enabled} onCheckedChange={() => toggleEnabled(j)} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(j)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(j)}>
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

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">File-based jobs</CardTitle>
          <CardDescription>
            Loaded from <code>config/cron.ts</code> or <code>src/cron/*.ts</code>. Read-only here —
            edit your project files to change them.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!system || system.cron.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No file-based cron jobs registered.
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

      {system && system.services.registered.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="w-4 h-4" /> Auto-discovered services
            </CardTitle>
            <CardDescription>
              Files under <code>src/api/&lt;name&gt;/services/&lt;name&gt;.ts</code>. Call them via{" "}
              <code>app.service(uid)</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {system.services.registered.map((u) => (
                <li key={u} className="font-mono text-xs">{u}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <CronDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
      />
    </div>
  );
}

function CronDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: UserCron | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState("0 * * * *");
  const [preset, setPreset] = useState<string>("0 * * * *");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setSchedule(editing.schedule);
      const presetMatch = PRESET_SCHEDULES.find((p) => p.value === editing.schedule);
      setPreset(presetMatch ? presetMatch.value : "");
      setCode(editing.code);
      setDescription(editing.description ?? "");
      setEnabled(!!editing.enabled);
    } else {
      setName("");
      setSchedule("0 * * * *");
      setPreset("0 * * * *");
      setCode(DEFAULT_CODE);
      setDescription("");
      setEnabled(true);
    }
  }, [editing, open]);

  const handleSave = async () => {
    if (!name.trim() || !schedule.trim() || !code.trim()) {
      toast.error("Name, schedule, and code are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/cron-jobs/${editing.id}`, {
          name,
          schedule,
          code,
          description,
          enabled,
        });
        toast.success("Cron updated");
      } else {
        await api.post("/admin/cron-jobs", {
          name,
          schedule,
          code,
          description,
          enabled,
        });
        toast.success("Cron created");
      }
      onSaved();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit cron job" : "New cron job"}</DialogTitle>
          <DialogDescription>
            Code runs server-side at the scheduled time. `app` and `ctx` are in scope.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cron-name">Name</Label>
              <Input
                id="cron-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cleanupTokens"
                disabled={!!editing}
              />
              <p className="text-xs text-muted-foreground">Unique. Used as the job key.</p>
            </div>
            <div className="space-y-2">
              <Label>Preset</Label>
              <Select
                value={preset}
                onValueChange={(v) => {
                  setPreset(v);
                  if (v) setSchedule(v);
                }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a preset" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_SCHEDULES.map((p) => (
                    <SelectItem key={p.label} value={p.value || "__custom__"}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cron-schedule">Schedule (5-field cron)</Label>
            <Input
              id="cron-schedule"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              placeholder="0 * * * *"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cron-description">Description (optional)</Label>
            <Input
              id="cron-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this job does"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cron-code">Task code</Label>
            <Textarea
              id="cron-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Runs inside an async function. Use{" "}
              <code>await app.getDb.findMany(&quot;table&quot;)</code>,{" "}
              <code>app.service(uid)</code>, etc.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch id="cron-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="cron-enabled">Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create cron"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
