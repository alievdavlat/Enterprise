"use client";

import { useState, useEffect } from "react";
import { Plus, Globe, Pencil, Trash2, Star } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Toggle,
} from "@enterprise/design-system";
import { api } from "@/lib/api";
import { toast } from "@enterprise/design-system";

type Locale = { id: number; name: string; code: string; isDefault?: boolean; is_default?: boolean };

export default function InternationalizationPage() {
  const [list, setList] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Locale | null>(null);
  const [form, setForm] = useState({ name: "", code: "", isDefault: false });

  const load = () => {
    api.get("/admin/i18n/locales").then((res) => setList(res.data?.data ?? [])).catch(() => setList([])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: "", code: "", isDefault: list.length === 0 }); setOpen(true); };
  const openEdit = (row: Locale) => {
    setEditing(row);
    setForm({ name: row.name || "", code: row.code || "", isDefault: Boolean(row.isDefault ?? row.is_default) });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) { toast.error("Code is required"); return; }
    try {
      if (editing) await api.put(`/admin/i18n/locales/${editing.id}`, form);
      else await api.post("/admin/i18n/locales", form);
      toast.success(editing ? "Locale updated" : "Locale created");
      setOpen(false);
      load();
    } catch (e: any) { toast.error(e?.response?.data?.error?.message || "Failed to save"); }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this locale?")) return;
    try {
      await api.delete(`/admin/i18n/locales/${id}`);
      toast.success("Locale deleted");
      load();
    } catch (e: any) { toast.error(e?.response?.data?.error?.message || "Failed to delete"); }
  };

  return (
    <div className="p-8 max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Internationalization</h1>
          <p className="text-muted-foreground mt-1">Manage locales for content</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="gap-2" onClick={openCreate}><Plus className="w-4 h-4" />Add new locale</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit locale" : "Add locale"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="en" />
              </div>
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="English" />
              </div>
              <div className="flex items-center gap-2">
                <Toggle checked={form.isDefault} onCheckedChange={(v) => setForm((f) => ({ ...f, isDefault: v }))} />
                <Label>Default locale</Label>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? (
        <Card className="border-border/50"><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : list.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4"><Globe className="w-8 h-8 text-muted-foreground" /></div>
            <p className="text-lg font-medium mb-1">No locales yet</p>
            <Button className="gap-2 mt-4" onClick={openCreate}><Plus className="w-4 h-4" />Add new locale</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <TableRoot>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-semibold uppercase text-xs">Code</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Name</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Default</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id} className="border-border/50">
                  <TableCell className="font-medium">{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{(row.isDefault ?? row.is_default) ? <Star className="w-4 h-4 text-primary fill-primary" /> : "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(row.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Card>
      )}
    </div>
  );
}
