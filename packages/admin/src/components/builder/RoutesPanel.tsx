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
import { Plus, Pencil, Trash2, Network as NetworkIcon } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { EmptyState, PanelLoadingSkeleton } from "./shared";

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
const DEFAULT_CODE = `// req, res, ctx in scope. ctx.params has the URL placeholders.
res.json({ data: { message: \`Hello \${ctx.params.name || "world"}\` } });`;

export function RoutesPanel() {
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

  const toggle = async (row: UserRoute) => {
    try {
      await api.put(`/admin/user-routes/${row.id}`, { enabled: !row.enabled });
      load();
    } catch (e) {
      toast.error(asMsg(e) ?? "Toggle failed");
    }
  };

  const remove = async (row: UserRoute) => {
    if (!confirm(`Delete route "${row.name}"?`)) return;
    try {
      await api.delete(`/admin/user-routes/${row.id}`);
      toast.success("Route deleted");
      load();
    } catch (e) {
      toast.error(asMsg(e) ?? "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">Custom routes</CardTitle>
            <CardDescription>
              REST endpoints mounted under <code>/api/u/...</code>. Paths can use{" "}
              <code>:param</code> placeholders — values arrive in <code>ctx.params</code>.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline">{rows.length}</Badge>
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New route
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <PanelLoadingSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={NetworkIcon}
              title="No custom routes yet"
              description="Build your own REST endpoints right here — they go live at /api/u/... without a server restart."
              ctaLabel="Create your first route"
              onCta={() => { setEditing(null); setDialogOpen(true); }}
            />
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs uppercase">Method</TableHead>
                  <TableHead className="text-xs uppercase">Path</TableHead>
                  <TableHead className="text-xs uppercase">Name</TableHead>
                  <TableHead className="text-xs uppercase">Enabled</TableHead>
                  <TableHead className="text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-border/50">
                    <TableCell><Badge variant="outline" className="uppercase">{r.method}</Badge></TableCell>
                    <TableCell><code className="text-xs bg-muted px-2 py-0.5 rounded">/api/u{r.path}</code></TableCell>
                    <TableCell className="font-medium">
                      <div>{r.name}</div>
                      {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
                    </TableCell>
                    <TableCell><Switch checked={!!r.enabled} onCheckedChange={() => toggle(r)} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setDialogOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(r)}>
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
  open, onOpenChange, editing, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; editing: UserRoute | null; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/hello/:name");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name); setMethod(editing.method); setPath(editing.path);
      setCode(editing.code); setDescription(editing.description ?? "");
      setEnabled(!!editing.enabled);
    } else {
      setName(""); setMethod("GET"); setPath("/hello/:name"); setCode(DEFAULT_CODE);
      setDescription(""); setEnabled(true);
    }
  }, [editing, open]);

  const save = async () => {
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
        await api.put(`/admin/user-routes/${editing.id}`, { name, method, path, code, description, enabled });
        toast.success("Route updated");
      } else {
        await api.post("/admin/user-routes", { name, method, path, code, description, enabled });
        toast.success("Route created");
      }
      onSaved();
    } catch (e) {
      toast.error(asMsg(e) ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit route" : "New route"}</DialogTitle>
          <DialogDescription>Mounted under <code>/api/u</code>. Paths support <code>:param</code> placeholders.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_2fr]">
            <div className="space-y-2">
              <Label htmlFor="route-name">Name</Label>
              <Input id="route-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="helloWorld" disabled={!!editing} />
            </div>
            <div className="space-y-2 w-32">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="route-path">Path</Label>
              <Input id="route-path" value={path} onChange={(e) => setPath(e.target.value)} placeholder="/hello/:name" className="font-mono" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="route-description">Description (optional)</Label>
            <Input id="route-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="route-code">Handler code</Label>
            <Textarea id="route-code" value={code} onChange={(e) => setCode(e.target.value)} rows={12} className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground">Must call <code>res.json(...)</code> etc. <code>ctx.params</code> has path values.</p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch id="route-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="route-enabled">Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create route"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function asMsg(e: unknown): string | undefined {
  return (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
}
