"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Webhook, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { toast } from "sonner";

type WebhookRow = {
  id: number;
  name: string;
  url: string;
  headers?: string;
  events?: string;
  enabled?: boolean;
  createdAt?: string;
};

const EVENTS_OPTIONS = ["entry.create", "entry.update", "entry.delete", "entry.publish", "entry.unpublish"];

export default function WebhooksPage() {
  const [list, setList] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WebhookRow | null>(null);
  const [form, setForm] = useState({ name: "", url: "", headers: "{}", events: [] as string[], enabled: true });
  const [triggering, setTriggering] = useState<number | null>(null);

  const load = () => {
    api
      .get("/webhooks")
      .then((res) => setList(res.data?.data ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", url: "", headers: "{}", events: [], enabled: true });
    setOpen(true);
  };

  const openEdit = (row: WebhookRow) => {
    setEditing(row);
    let events: string[] = [];
    try {
      const parsed = typeof row.events === "string" ? JSON.parse(row.events || "[]") : row.events;
      events = Array.isArray(parsed) ? parsed : [];
    } catch {}
    setForm({
      name: row.name || "",
      url: row.url || "",
      headers: typeof row.headers === "string" ? row.headers : JSON.stringify(row.headers || {}),
      events,
      enabled: row.enabled ?? true,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      toast.error("Name and URL are required");
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        url: form.url.trim(),
        headers: (() => {
          try {
            return JSON.parse(form.headers || "{}");
          } catch {
            return {};
          }
        })(),
        events: form.events,
        enabled: form.enabled,
      };
      if (editing) {
        await api.put(`/webhooks/${editing.id}`, payload);
        toast.success("Webhook updated");
      } else {
        await api.post("/webhooks", payload);
        toast.success("Webhook created");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to save");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this webhook?")) return;
    try {
      await api.delete(`/webhooks/${id}`);
      toast.success("Webhook deleted");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to delete");
    }
  };

  const trigger = async (id: number) => {
    setTriggering(id);
    try {
      const res = await api.post(`/webhooks/${id}/trigger`);
      toast.success(`Triggered (HTTP ${res.data?.data?.status ?? "—"})`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Trigger failed");
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Send HTTP requests to external URLs when events occur
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Create new webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit webhook" : "Create webhook"}</DialogTitle>
              <DialogDescription>Configure URL, headers and events.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="My webhook"
                />
              </div>
              <div className="grid gap-2">
                <Label>URL</Label>
                <Input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://example.com/hook"
                />
              </div>
              <div className="grid gap-2">
                <Label>Headers (JSON)</Label>
                <Input
                  value={form.headers}
                  onChange={(e) => setForm((f) => ({ ...f, headers: e.target.value }))}
                  placeholder='{"X-Custom": "value"}'
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.enabled}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
                />
                <Label>Enabled</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
              <Webhook className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">No webhooks yet</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
              Create a webhook to send HTTP requests when content or other events occur.
            </p>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Create new webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-semibold uppercase text-xs">Name</TableHead>
                <TableHead className="font-semibold uppercase text-xs">URL</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Status</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id} className="border-border/50">
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm max-w-[280px] truncate">
                    {row.url}
                  </TableCell>
                  <TableCell>
                    <span className={row.enabled ? "text-green-600" : "text-muted-foreground"}>
                      {row.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => trigger(row.id)}
                        disabled={triggering === row.id}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => remove(row.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
