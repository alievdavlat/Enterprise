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
  Switch,
} from "@enterprise/design-system";
import { api } from "@/lib/api";
import { toast } from "@enterprise/design-system";
import { PageHeader, ListSkeleton, EmptyCard } from "@/components/shared";
import { IllustrationNoData } from "@/components/illustrations";

type Locale = {
  id: number;
  name: string;
  code: string;
  isDefault?: boolean;
  is_default?: boolean;
};

export default function InternationalizationPage() {
  const [list, setList] = useState<Locale[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Locale | null>(null);
  const [form, setForm] = useState({ name: "", code: "", isDefault: false });

  const load = () => {
    api
      .get("/admin/i18n/locales")
      .then((res) => setList(res.data?.data ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", isDefault: list.length === 0 });
    setOpen(true);
  };
  const openEdit = (row: Locale) => {
    setEditing(row);
    setForm({
      name: row.name || "",
      code: row.code || "",
      isDefault: Boolean(row.isDefault ?? row.is_default),
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) {
      toast.error("Code is required");
      return;
    }
    try {
      if (editing) await api.put(`/admin/i18n/locales/${editing.id}`, form);
      else await api.post("/admin/i18n/locales", form);
      toast.success(editing ? "Locale updated" : "Locale created");
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to save");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this locale?")) return;
    try {
      await api.delete(`/admin/i18n/locales/${id}`);
      toast.success("Locale deleted");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to delete");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Globe}
        eyebrow="Settings"
        title="Internationalization"
        description="Manage locales for translated content."
        variant="emerald"
        actions={
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add new locale
          </Button>
        }
      />
      <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit locale" : "Add locale"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                  placeholder="en"
                />
              </div>
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="English"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, isDefault: v }))
                  }
                />
                <Label>Default locale</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      {loading ? (
        <ListSkeleton rows={4} />
      ) : list.length === 0 ? (
        <EmptyCard
          illustration={<IllustrationNoData size={140} />}
          title="No locales yet"
          description="Add locales to translate your content into multiple languages."
          action={
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Add new locale
            </Button>
          }
        />
      ) : (
        <Card className="border-border/50">
          <TableRoot>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-semibold uppercase text-xs">
                  Code
                </TableHead>
                <TableHead className="font-semibold uppercase text-xs">
                  Name
                </TableHead>
                <TableHead className="font-semibold uppercase text-xs">
                  Default
                </TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id} className="border-border/50">
                  <TableCell className="font-medium">{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    {(row.isDefault ?? row.is_default) ? (
                      <Star className="w-4 h-4 text-primary fill-primary" />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(row)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => remove(row.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
