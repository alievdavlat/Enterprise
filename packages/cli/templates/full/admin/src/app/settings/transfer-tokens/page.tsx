"use client";

import { useState, useEffect } from "react";
import { Plus, Truck, Trash2, Copy, Check } from "lucide-react";
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
import { api } from "@/lib/api";
import { toast } from "sonner";

type TransferTokenRow = {
  id: number;
  name: string;
  description?: string;
  lifespan?: string | null;
  createdAt?: string;
};

export default function TransferTokensPage() {
  const [list, setList] = useState<TransferTokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [copied, setCopied] = useState(false);

  const load = () => {
    api
      .get("/admin/transfer-tokens")
      .then((res) => setList(res.data?.data ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm({ name: "", description: "" });
    setCreatedToken(null);
    setOpen(true);
  };

  const create = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      const res = await api.post("/admin/transfer-tokens", {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      const token = res.data?.data?.accessKey;
      setCreatedToken(token || null);
      toast.success("Transfer token created. Copy it now — it won't be shown again.");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to create");
    }
  };

  const copyToken = () => {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this transfer token?")) return;
    try {
      await api.delete(`/admin/transfer-tokens/${id}`);
      toast.success("Transfer token deleted");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to delete");
    }
  };

  return (
    <div className="p-8 max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transfer Tokens</h1>
          <p className="text-muted-foreground mt-1">Tokens for data transfer (pull/push)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Create new Transfer Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Transfer Token</DialogTitle>
              <DialogDescription>
                {createdToken
                  ? "Copy the token below. You won't be able to see it again."
                  : "Create a new transfer token for CLI or external tools."}
              </DialogDescription>
            </DialogHeader>
            {createdToken ? (
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Token (copy now)</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={createdToken} className="font-mono" />
                    <Button size="icon" variant="outline" onClick={copyToken}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => { setOpen(false); setCreatedToken(null); }}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="My transfer token"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description (optional)</Label>
                    <Input
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="For CLI sync"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={create}>Create</Button>
                </DialogFooter>
              </>
            )}
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
              <Truck className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">Add your first Transfer Token</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
              Create a transfer token to pull or push data via CLI or external tools.
            </p>
            <Button variant="outline" className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Add new Transfer Token
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-semibold uppercase text-xs">Name</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Description</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Created</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id} className="border-border/50">
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[240px] truncate">
                    {row.description || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => remove(row.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
