"use client";

import { useEffect, useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Input, Label, Textarea, Switch,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@enterprise/design-system";
import { Plus, Pencil, Trash2, Layers as LayersIcon } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { EmptyState, PanelLoadingSkeleton } from "./shared";

type UserMiddleware = {
  id: number;
  name: string;
  code: string;
  enabled: boolean | number;
  priority: number;
  description?: string | null;
};

const DEFAULT_CODE = `// req, res, next in scope.
// Call next() to continue, or short-circuit with res.send / res.json.
res.setHeader("X-Request-Id", req.headers["x-request-id"] || crypto.randomUUID());
next();`;

export function MiddlewaresPanel() {
  const [rows, setRows] = useState<UserMiddleware[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserMiddleware | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/middlewares-list");
      setRows((res.data?.data ?? []) as UserMiddleware[]);
    } catch {
      toast.error("Failed to load middlewares");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (row: UserMiddleware) => {
    try { await api.put(`/admin/middlewares-list/${row.id}`, { enabled: !row.enabled }); load(); }
    catch (e) { toast.error(asMsg(e) ?? "Toggle failed"); }
  };

  const remove = async (row: UserMiddleware) => {
    if (!confirm(`Delete middleware "${row.name}"?`)) return;
    try { await api.delete(`/admin/middlewares-list/${row.id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(asMsg(e) ?? "Delete failed"); }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Middlewares</CardTitle>
            <CardDescription>Run on every request before the API routers. Lower priority runs first.</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline">{rows.length}</Badge>
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New middleware
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <PanelLoadingSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={LayersIcon}
              title="No middlewares yet"
              description="Intercept every request — add auth checks, request IDs, rate limits or anything else. Saved changes apply instantly."
              ctaLabel="Create your first middleware"
              onCta={() => { setEditing(null); setDialogOpen(true); }}
            />
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs uppercase">Priority</TableHead>
                  <TableHead className="text-xs uppercase">Name</TableHead>
                  <TableHead className="text-xs uppercase">Enabled</TableHead>
                  <TableHead className="text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-border/50">
                    <TableCell><code className="text-xs bg-muted px-2 py-0.5 rounded">{r.priority}</code></TableCell>
                    <TableCell className="font-medium">
                      <div>{r.name}</div>
                      {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
                    </TableCell>
                    <TableCell><Switch checked={!!r.enabled} onCheckedChange={() => toggle(r)} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(r)}><Trash2 className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          )}
        </CardContent>
      </Card>
      <MiddlewareDialog
        open={dialogOpen} onOpenChange={setDialogOpen} editing={editing}
        onSaved={() => { setDialogOpen(false); load(); }}
      />
    </div>
  );
}

function MiddlewareDialog({
  open, onOpenChange, editing, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: UserMiddleware | null; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [priority, setPriority] = useState(100);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name); setCode(editing.code);
      setDescription(editing.description ?? ""); setEnabled(!!editing.enabled);
      setPriority(editing.priority ?? 100);
    } else {
      setName(""); setCode(DEFAULT_CODE); setDescription(""); setEnabled(true); setPriority(100);
    }
  }, [editing, open]);

  const save = async () => {
    if (!name.trim() || !code.trim()) { toast.error("Name and code are required"); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/middlewares-list/${editing.id}`, { name, code, description, enabled, priority });
        toast.success("Updated");
      } else {
        await api.post("/admin/middlewares-list", { name, code, description, enabled, priority });
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
          <DialogTitle>{editing ? "Edit middleware" : "New middleware"}</DialogTitle>
          <DialogDescription>Compiled to <code>(req, res, next) =&gt; ...</code> and dispatched on every request.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mw-name">Name</Label>
              <Input id="mw-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="requestId" disabled={!!editing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mw-priority">Priority (lower runs first)</Label>
              <Input id="mw-priority" type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value) || 100)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mw-description">Description (optional)</Label>
            <Input id="mw-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mw-code">Code</Label>
            <Textarea id="mw-code" value={code} onChange={(e) => setCode(e.target.value)} rows={12} className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground">Must call <code>next()</code> or short-circuit with <code>res.*</code>.</p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch id="mw-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="mw-enabled">Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} loading={saving}>{editing ? "Save changes" : "Create middleware"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function asMsg(e: unknown): string | undefined {
  return (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
}
