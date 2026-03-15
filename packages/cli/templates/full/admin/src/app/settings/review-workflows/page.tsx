"use client";

import { useState, useEffect } from "react";
import { Plus, Zap, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { api } from "@/lib/api";
import { toast } from "sonner";

type Stage = { id?: number; name: string; order: number };
type Workflow = {
  id: number;
  name: string;
  description?: string;
  stages: Stage[];
  createdAt?: string;
};

const defaultStages: Stage[] = [
  { name: "To Do", order: 0 },
  { name: "In Review", order: 1 },
  { name: "Done", order: 2 },
];

export default function ReviewWorkflowsPage() {
  const [list, setList] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [form, setForm] = useState({ name: "", description: "", stages: defaultStages });

  const load = () => {
    api
      .get("/admin/review-workflows")
      .then((res) => setList(res.data?.data ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", stages: [...defaultStages] });
    setOpen(true);
  };

  const openEdit = (w: Workflow) => {
    setEditing(w);
    const stages = (w.stages || []).length
      ? w.stages.map((s, i) => ({ ...s, order: s.order ?? i }))
      : [...defaultStages];
    setForm({
      name: w.name || "",
      description: w.description || "",
      stages,
    });
    setOpen(true);
  };

  const addStage = () => {
    setForm((f) => ({
      ...f,
      stages: [...f.stages, { name: `Stage ${f.stages.length + 1}`, order: f.stages.length }],
    }));
  };

  const updateStage = (index: number, name: string) => {
    setForm((f) => ({
      ...f,
      stages: f.stages.map((s, i) => (i === index ? { ...s, name } : s)),
    }));
  };

  const removeStage = (index: number) => {
    setForm((f) => ({
      ...f,
      stages: f.stages.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i })),
    }));
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const stages = form.stages.map((s, i) => ({ name: s.name, order: i }));
      if (editing) {
        await api.put(`/admin/review-workflows/${editing.id}`, {
          name: form.name.trim(),
          description: form.description.trim(),
          stages,
        });
        toast.success("Workflow updated");
      } else {
        await api.post("/admin/review-workflows", {
          name: form.name.trim(),
          description: form.description.trim(),
          stages,
        });
        toast.success("Workflow created");
      }
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to save");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this workflow?")) return;
    try {
      await api.delete(`/admin/review-workflows/${id}`);
      toast.success("Workflow deleted");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to delete");
    }
  };

  return (
    <div className="p-8 max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Workflows</h1>
          <p className="text-muted-foreground mt-1">Define stages for content review</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Create workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit workflow" : "Create workflow"}</DialogTitle>
              <DialogDescription>Name and stages for the review workflow.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Default workflow"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description (optional)</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Content review"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Stages</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addStage}>
                    + Add
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {form.stages.map((s, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        value={s.name}
                        onChange={(e) => updateStage(i, e.target.value)}
                        placeholder={`Stage ${i + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive"
                        onClick={() => removeStage(i)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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
      </div>

      {loading ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">No review workflows yet</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
              Create a workflow with stages (e.g. To Do, In Review, Done) for content review.
            </p>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Create workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {list.map((w) => (
            <Card key={w.id} className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{w.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {w.description || "—"} · Stages: {(w.stages || []).map((s: Stage) => s.name).join(" → ")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(w)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => remove(w.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
