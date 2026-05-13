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
import { Network, Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

type UserRoute = {
  id: number;
  name: string;
  method: string;
  path: string;
  code: string;
  enabled: boolean | number;
  description?: string | null;
};

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "ALL"];
const DEFAULT_CODE = `// Available in scope:
//   req   — Express Request
//   res   — Express Response
//   ctx   — { params: { ... }, logger: console }
//
// app is reachable via res.app (the Express instance the server attached).
// Use req.app.locals or your own utilities to talk to the DB.
//
// Example: greet a route param.
res.json({ data: { message: \`Hello, \${ctx.params.name || "world"}!\` } });`;

/**
 * Settings → Custom routes. No-code builder Phase 16.3: user defines
 * (method, path, code) and the server mounts it under /api/u/* without a
 * restart.
 */
export default function UserRoutesPage() {
  const [rows, setRows] = useState<UserRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserRoute | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/user-routes");
      setRows((res.data?.data ?? []) as UserRoute[]);
    } catch {
      toast.error("Failed to load routes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleEnabled = async (row: UserRoute) => {
    try {
      await api.put(`/admin/user-routes/${row.id}`, { enabled: !row.enabled });
      load();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Toggle failed");
    }
  };

  const handleDelete = async (row: UserRoute) => {
    if (!confirm(`Delete route "${row.name}"?`)) return;
    try {
      await api.delete(`/admin/user-routes/${row.id}`);
      toast.success("Route deleted");
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
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Custom routes</h1>
            <p className="text-muted-foreground mt-1">
              Author your own REST endpoints from the UI. Mounted at <code>/api/u/...</code>.
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New route
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Custom endpoints</CardTitle>
            <CardDescription>
              Paths support <code>:param</code> segments — values arrive in <code>ctx.params</code>.
            </CardDescription>
          </div>
          <Badge variant="outline">{rows.length}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No routes yet. Click <b>New route</b> to start.
            </div>
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold uppercase text-xs">Method</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Path</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Name</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Enabled</TableHead>
                  <TableHead className="font-semibold uppercase text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-border/50">
                    <TableCell>
                      <Badge variant="outline" className="uppercase">{r.method}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">/api/u{r.path}</code>
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

      <RouteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSaved={() => { setDialogOpen(false); load(); }}
      />
    </div>
  );
}

function RouteDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: UserRoute | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/hello/:name");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setMethod(editing.method);
      setPath(editing.path);
      setCode(editing.code);
      setDescription(editing.description ?? "");
      setEnabled(!!editing.enabled);
    } else {
      setName("");
      setMethod("GET");
      setPath("/hello/:name");
      setCode(DEFAULT_CODE);
      setDescription("");
      setEnabled(true);
    }
  }, [editing, open]);

  const handleSave = async () => {
    if (!name.trim() || !path.trim() || !code.trim()) {
      toast.error("Name, path, and code are required");
      return;
    }
    if (!path.startsWith("/")) {
      toast.error("Path must start with /");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/user-routes/${editing.id}`, {
          name, method, path, code, description, enabled,
        });
        toast.success("Route updated");
      } else {
        await api.post("/admin/user-routes", {
          name, method, path, code, description, enabled,
        });
        toast.success("Route created");
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
          <DialogTitle>{editing ? "Edit route" : "New route"}</DialogTitle>
          <DialogDescription>
            Mounted under <code>/api/u</code>. Paths support <code>:param</code> placeholders.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_2fr]">
            <div className="space-y-2">
              <Label htmlFor="route-name">Name</Label>
              <Input
                id="route-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="helloWorld"
                disabled={!!editing}
              />
            </div>
            <div className="space-y-2 w-32">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="route-path">Path</Label>
              <Input
                id="route-path"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/hello/:name"
                className="font-mono"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="route-description">Description (optional)</Label>
            <Input
              id="route-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this route does"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="route-code">Handler code</Label>
            <Textarea
              id="route-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Must call <code>res.json(...)</code> or similar. <code>ctx.params</code> has path values.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch id="route-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="route-enabled">Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create route"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
