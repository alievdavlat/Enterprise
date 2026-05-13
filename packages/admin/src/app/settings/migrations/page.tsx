"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Button, Input, Label, Badge,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@enterprise/design-system";
import { Database, Play, Undo2, Plus, CheckCircle2, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { EmptyState, PanelLoadingSkeleton } from "@/components/builder/shared";

interface MigrationRow {
  name: string;
  executed: boolean;
  executedAt?: string;
}

/**
 * Settings → Migrations (Phase 16.10). Mirrors the Phase 3 CLI commands
 * (migrate up / down / status / create) so the admin can manage database
 * schema changes from the browser. Useful when the team can't SSH into
 * the box or wants a single audit trail.
 */
export default function MigrationsPage() {
  const [rows, setRows] = useState<MigrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/migrations");
      setRows((res.data?.data ?? []) as MigrationRow[]);
    } catch (e) {
      toast.error(asMsg(e) ?? "Failed to load migrations");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const runUp = async () => {
    setRunning(true);
    try {
      const res = await api.post("/admin/migrations/up");
      const applied: string[] = res.data?.data?.applied ?? [];
      toast.success(applied.length ? `Applied ${applied.length} migration(s)` : "Already up to date");
      load();
    } catch (e) { toast.error(asMsg(e) ?? "Migrate up failed"); }
    finally { setRunning(false); }
  };

  const runDown = async () => {
    if (!confirm("Roll back the last migration? This runs its down() and removes the tracking row.")) return;
    setRunning(true);
    try {
      const res = await api.post("/admin/migrations/down", { steps: 1 });
      const rolled: string[] = res.data?.data?.rolled ?? [];
      toast.success(rolled.length ? `Rolled back ${rolled.length}` : "Nothing to roll back");
      load();
    } catch (e) { toast.error(asMsg(e) ?? "Migrate down failed"); }
    finally { setRunning(false); }
  };

  const create = async () => {
    if (!newName.trim()) { toast.error("Name required"); return; }
    try {
      await api.post("/admin/migrations/create", { name: newName.trim() });
      toast.success("Migration file created — edit it on disk, then run migrate up");
      setCreateOpen(false);
      setNewName("");
      load();
    } catch (e) { toast.error(asMsg(e) ?? "Create failed"); }
  };

  const pending = rows.filter((r) => !r.executed);
  const executed = rows.filter((r) => r.executed);

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Migrations</h1>
            <p className="text-muted-foreground mt-1">
              Apply, roll back and scaffold database migrations without leaving the browser.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create
          </Button>
          <Button variant="outline" onClick={runDown} disabled={running || executed.length === 0}>
            <Undo2 className="w-4 h-4 mr-2" /> Rollback last
          </Button>
          <Button onClick={runUp} disabled={running || pending.length === 0}>
            <Play className="w-4 h-4 mr-2" /> {running ? "Running…" : `Apply ${pending.length} pending`}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Status</CardTitle>
            <CardDescription>Files in <code>database/migrations/</code>. Sorted by filename — timestamps run in order.</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{pending.length} pending</Badge>
            <Badge variant="outline"><CheckCircle2 className="w-3 h-3 mr-1" />{executed.length} applied</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <PanelLoadingSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No migrations yet"
              description="Create a migration to evolve your database schema — add columns, indexes, seed data. The file lives in database/migrations and survives in git."
              ctaLabel="Create your first migration"
              onCta={() => setCreateOpen(true)}
            />
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase">Status</TableHead>
                  <TableHead className="text-xs uppercase">Name</TableHead>
                  <TableHead className="text-xs uppercase">Executed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.name}>
                    <TableCell>
                      {r.executed ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" variant="outline">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Applied
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-500 border-amber-500/20">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.executedAt ? new Date(r.executedAt).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create migration</DialogTitle>
            <DialogDescription>
              Drops a timestamped <code>.ts</code> file in <code>database/migrations/</code> with empty <code>up()</code> + <code>down()</code> stubs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="mig-name">Name</Label>
            <Input
              id="mig-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="add-slug-to-articles"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create file</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function asMsg(e: unknown): string | undefined {
  return (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
}
