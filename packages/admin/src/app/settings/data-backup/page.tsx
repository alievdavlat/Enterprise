"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAppStore } from "@/store/app";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Badge,
  Input,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@enterprise/design-system";
import { Clock, RefreshCw } from "lucide-react";
import {
  Download,
  Upload,
  FileJson,
  Database,
  ShieldAlert,
  CheckCircle2,
  ArrowDown,
  ArrowUp,
  HardDriveDownload,
  HardDriveUpload,
} from "lucide-react";

type ImportSummary = {
  schemas: number;
  contentEntries: number | null;
};

export default function DataBackupPage() {
  const [exportIncludeContent, setExportIncludeContent] = useState(true);
  const [exportIncludeUploads, setExportIncludeUploads] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (exportIncludeContent) params.set("includeContent", "1");
      if (exportIncludeUploads) params.set("includeUploads", "1");
      const q = params.toString() ? `?${params.toString()}` : "";
      const res = await api.get(`/admin/export${q}`);

      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      a.download = `enterprise-backup-${ts}.json`;
      a.click();
      URL.revokeObjectURL(a.href);

      toast.success("Backup downloaded successfully");
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Export failed");
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error("Please select a backup file first");
      return;
    }
    setImporting(true);
    setImportSummary(null);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      if (!data.schemas || !Array.isArray(data.schemas)) {
        toast.error("Invalid backup file: schemas array required");
        setImporting(false);
        return;
      }
      const res = await api.post("/admin/import", data);
      const summary: ImportSummary = {
        schemas: data.schemas.length,
        contentEntries: data.content
          ? Object.values(data.content).reduce(
              (s: number, arr: any) => s + (Array.isArray(arr) ? arr.length : 0),
              0
            )
          : null,
      };
      setImportSummary(summary);
      toast.success(
        `Restored ${summary.schemas} schema(s)${
          summary.contentEntries !== null
            ? ` and ${summary.contentEntries} entry/entries`
            : ""
        }`
      );
      setImportFile(null);
      useAppStore.getState().fetchContentTypes();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Import failed");
      console.error(e);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Data Backup</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Export your project schemas, content & uploads or restore from a previous backup
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* EXPORT */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent border-b">
            <div className="flex items-center gap-2 text-primary">
              <ArrowDown className="w-5 h-5" />
              <CardTitle>Export</CardTitle>
            </div>
            <CardDescription>
              Download a portable JSON backup of your project. Use it to migrate to a new server, archive a snapshot, or version-control your data.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="space-y-3">
              <p className="text-sm font-medium">What to include</p>

              <label className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
                <Checkbox
                  checked={true}
                  disabled
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Content-Type schemas</span>
                    <Badge variant="secondary" className="text-[10px]">always included</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Field definitions for every collection & component
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
                <Checkbox
                  checked={exportIncludeContent}
                  onCheckedChange={(v) => setExportIncludeContent(!!v)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">All content entries</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Every row across every collection. Backup file size grows with content.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
                <Checkbox
                  checked={exportIncludeUploads}
                  onCheckedChange={(v) => setExportIncludeUploads(!!v)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    Media uploads <Badge variant="secondary" className="text-[10px] ml-1">beta</Badge>
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Embed images & files as base64. Significantly increases backup size.
                  </p>
                </div>
              </label>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting}
              className="w-full gap-2"
              size="lg"
            >
              <HardDriveDownload className="w-4 h-4" />
              {exporting ? "Preparing backup…" : "Download backup"}
            </Button>
          </CardContent>
        </Card>

        {/* IMPORT */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="bg-gradient-to-br from-orange-500/5 to-transparent border-b">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <ArrowUp className="w-5 h-5" />
              <CardTitle>Import</CardTitle>
            </div>
            <CardDescription>
              Restore schemas (and optionally content) from a previously exported JSON backup.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-orange-600 dark:text-orange-400" />
              <div className="text-xs text-muted-foreground">
                Import is destructive for existing schemas with the same name. Always export
                a fresh backup before restoring.
              </div>
            </div>

            <div className="space-y-2">
              <Label>Backup file</Label>
              <label
                htmlFor="backup-file"
                className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <FileJson className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {importFile?.name ?? "Click to choose .json backup"}
                </p>
                {importFile && (
                  <p className="text-xs text-muted-foreground">
                    {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
                <input
                  id="backup-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </div>

            <Button
              onClick={handleImport}
              disabled={importing || !importFile}
              className="w-full gap-2"
              size="lg"
              variant="default"
            >
              <HardDriveUpload className="w-4 h-4" />
              {importing ? "Restoring backup…" : "Restore from backup"}
            </Button>

            {importSummary && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-600 dark:text-green-500" />
                <div className="text-xs">
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Restore complete
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {importSummary.schemas} schema(s)
                    {importSummary.contentEntries !== null
                      ? `, ${importSummary.contentEntries} content entry/entries`
                      : ", schemas only"}{" "}
                    restored.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Backup file format</CardTitle>
          <CardDescription>
            JSON with this top-level shape — safe to inspect, version-control, or generate programmatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted/40 rounded-lg p-4 overflow-x-auto">
{`{
  "version": 1,
  "exportedAt": "2026-05-07T16:00:00.000Z",
  "schemas": [ /* ContentTypeSchema[] */ ],
  "content": {                  // optional
    "<modelName>": [ /* entries */ ]
  },
  "uploads": [ /* media files (beta) */ ]
}`}
          </pre>
        </CardContent>
      </Card>

      <ScheduledBackupSection />
    </div>
  );
}

interface BackupSchedule {
  enabled?: boolean;
  frequency?: "hourly" | "daily" | "weekly" | "cron";
  cron?: string;
  includeContent?: boolean;
  includeUploads?: boolean;
  retention?: number;
}

interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

/**
 * Phase 15 UI — schedule + history. Configures the admin::backup-schedule
 * core_store entry that EnterpriseServer.applyBackupSchedule reads. Toggle
 * the switch and the server (re)registers a cron job.
 */
function ScheduledBackupSection() {
  const [schedule, setSchedule] = useState<BackupSchedule>({
    enabled: false,
    frequency: "daily",
    includeContent: true,
    includeUploads: false,
    retention: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [files, setFiles] = useState<BackupFile[]>([]);

  const load = async () => {
    try {
      const [s, f] = await Promise.all([
        api.get("/admin/backup-schedule"),
        api.get("/admin/backups"),
      ]);
      setSchedule(s.data?.data ?? schedule);
      setFiles((f.data?.data ?? []) as BackupFile[]);
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (patch: Partial<BackupSchedule>) => {
    const next = { ...schedule, ...patch };
    setSchedule(next);
    setSaving(true);
    try {
      await api.post("/admin/backup-schedule", next);
      toast.success("Schedule saved");
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const res = await api.post("/admin/backup-now");
      const path = res.data?.data?.filePath;
      toast.success(path ? `Backup written: ${path.split(/[/\\]/).pop()}` : "Backup written");
      load();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Backup failed");
    } finally {
      setRunning(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Scheduled backups</CardTitle>
            </div>
            <CardDescription>
              Server writes a JSON backup to <code>backups/</code> on the configured cadence. Toggle off to pause.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={runNow} disabled={running}>
            <RefreshCw className={`w-4 h-4 mr-2 ${running ? "animate-spin" : ""}`} />
            {running ? "Running…" : "Run now"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div>
            <div className="font-medium">Enable scheduled backups</div>
            <p className="text-xs text-muted-foreground">
              The cron job (re)registers automatically when this toggle changes.
            </p>
          </div>
          <Switch
            checked={!!schedule.enabled}
            disabled={loading || saving}
            onCheckedChange={(v) => save({ enabled: v })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={schedule.frequency ?? "daily"}
              onValueChange={(v) => save({ frequency: v as BackupSchedule["frequency"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily (3am)</SelectItem>
                <SelectItem value="weekly">Weekly (Sun 3am)</SelectItem>
                <SelectItem value="cron">Custom cron expression</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="retention">Retention (keep last N)</Label>
            <Input
              id="retention"
              type="number"
              min={1}
              value={schedule.retention ?? 7}
              onChange={(e) => setSchedule((s) => ({ ...s, retention: Number(e.target.value) || 7 }))}
              onBlur={() => save({ retention: schedule.retention })}
            />
          </div>
          {schedule.frequency === "cron" && (
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="cron-expr">Cron expression (5 fields)</Label>
              <Input
                id="cron-expr"
                value={schedule.cron ?? ""}
                placeholder="0 3 * * *"
                className="font-mono"
                onChange={(e) => setSchedule((s) => ({ ...s, cron: e.target.value }))}
                onBlur={() => save({ cron: schedule.cron })}
              />
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <Switch
              id="bk-content"
              checked={schedule.includeContent ?? true}
              onCheckedChange={(v) => save({ includeContent: v })}
            />
            <Label htmlFor="bk-content" className="cursor-pointer">Include content entries</Label>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border">
            <Switch
              id="bk-uploads"
              checked={schedule.includeUploads ?? false}
              onCheckedChange={(v) => save({ includeUploads: v })}
            />
            <Label htmlFor="bk-uploads" className="cursor-pointer">Include media metadata</Label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Backup history</h3>
            <Badge variant="outline">{files.length}</Badge>
          </div>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center border rounded-lg bg-muted/20">
              No backups yet. Toggle the schedule or click <b>Run now</b>.
            </p>
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase">File</TableHead>
                  <TableHead className="text-xs uppercase">Size</TableHead>
                  <TableHead className="text-xs uppercase">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((f) => (
                  <TableRow key={f.name}>
                    <TableCell className="font-mono text-xs">{f.name}</TableCell>
                    <TableCell className="text-xs">{formatSize(f.size)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(f.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
