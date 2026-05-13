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
} from "@enterprise/design-system";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

type UserMiddleware = {
  id: number;
  name: string;
  code: string;
  enabled: boolean | number;
  priority: number;
  description?: string | null;
};

const DEFAULT_CODE = `// Available in scope:
//   req   — Express Request
//   res   — Express Response
//   next  — call next() to continue, next(err) to short-circuit with error
//
// Example: tag every response with a request id.
res.setHeader("X-Request-Id", req.headers["x-request-id"] || crypto.randomUUID());
next();`;

/**
 * Settings → User middlewares. No-code builder Phase 16.2:
 * user writes a (req, res, next) snippet, server compiles it and inserts
 * into the live Express dispatch list with no restart.
 */
export default function UserMiddlewaresPage() {
  const [rows, setRows] = useState<UserMiddleware[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserMiddleware | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/middlewares-list");
      setRows((res.data?.data ?? []) as UserMiddleware[]);
    } catch (e) {
      toast.error("Failed to load middlewares");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleEnabled = async (row: UserMiddleware) => {
    try {
      await api.put(`/admin/middlewares-list/${row.id}`, { enabled: !row.enabled });
      load();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Toggle failed");
    }
  };

  const handleDelete = async (row: UserMiddleware) => {
    if (!confirm(`Delete middleware "${row.name}"?`)) return;
    try {
      await api.delete(`/admin/middlewares-list/${row.id}`);
      toast.success("Middleware deleted");
      load();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Delete failed");
    }
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">User middlewares</h1>
            <p className="text-muted-foreground mt-1">
              Author Express middlewares from the UI. Lower priority runs first.
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New middleware
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Registered middlewares</CardTitle>
            <CardDescription>
              Runs on every request before the API routers. Pause without deleting via the switch.
            </CardDescription>
          </div>
          <Badge variant="outline">{rows.length}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No middlewares yet. Click <b>New middleware</b> to start.
            </div>
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold uppercase text-xs">Priority</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Name</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Enabled</TableHead>
                  <TableHead className="font-semibold uppercase text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-border/50">
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">{r.priority}</code>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{r.name}</div>
                      {r.description && (
                        <div className="text-xs text-muted-foreground">{r.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!r.enabled} onCheckedChange={() => toggleEnabled(r)} />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setDialogOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(r)}>
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

      <MiddlewareDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => { setDialogOpen(false); load(); }}
      />
    </div>
  );
}

function MiddlewareDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: UserMiddleware | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [priority, setPriority] = useState(100);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setCode(editing.code);
      setDescription(editing.description ?? "");
      setEnabled(!!editing.enabled);
      setPriority(editing.priority ?? 100);
    } else {
      setName("");
      setCode(DEFAULT_CODE);
      setDescription("");
      setEnabled(true);
      setPriority(100);
    }
  }, [editing, open]);

  const handleSave = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error("Name and code are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/middlewares-list/${editing.id}`, {
          name, code, description, enabled, priority,
        });
        toast.success("Middleware updated");
      } else {
        await api.post("/admin/middlewares-list", {
          name, code, description, enabled, priority,
        });
        toast.success("Middleware created");
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
          <DialogTitle>{editing ? "Edit middleware" : "New middleware"}</DialogTitle>
          <DialogDescription>
            Compiled to `(req, res, next) =&gt; ...` and dispatched on every request.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mw-name">Name</Label>
              <Input
                id="mw-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="requestId"
                disabled={!!editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mw-priority">Priority (lower runs first)</Label>
              <Input
                id="mw-priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) || 100)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mw-description">Description (optional)</Label>
            <Input
              id="mw-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this middleware does"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mw-code">Code</Label>
            <Textarea
              id="mw-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Must call <code>next()</code> to continue or <code>res.send(...)</code> to short-circuit.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch id="mw-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="mw-enabled">Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create middleware"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
