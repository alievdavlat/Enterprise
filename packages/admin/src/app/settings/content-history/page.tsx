"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@enterprise/design-system";
import { History, RotateCcw, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAppStore } from "@/store/app";
import { ListSkeleton } from "@/components/shared";

type Version = {
  id: number;
  uid: string;
  documentId?: string | null;
  entryId?: number | null;
  data: string;
  status?: string | null;
  userEmail?: string | null;
  created_at?: string;
  createdAt?: string;
};

export default function ContentHistoryPage() {
  const contentTypes = useAppStore((s) => s.contentTypes);
  const fetchContentTypes = useAppStore((s) => s.fetchContentTypes);
  const [filterUid, setFilterUid] = useState<string>("");
  const [list, setList] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState<Version | null>(null);
  const [restoring, setRestoring] = useState<number | null>(null);

  useEffect(() => {
    fetchContentTypes();
  }, [fetchContentTypes]);

  const load = async () => {
    setLoading(true);
    try {
      const params = filterUid ? `?uid=${encodeURIComponent(filterUid)}` : "";
      const r = await api.get(`/admin/content-history${params}`);
      setList((r.data?.data ?? []) as Version[]);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUid]);

  const formatTime = (v: Version) => {
    const t = v.created_at ?? v.createdAt;
    if (!t) return "—";
    try {
      return new Date(t).toLocaleString();
    } catch {
      return t;
    }
  };

  const restore = async (v: Version) => {
    if (!confirm("Restore this version? It will overwrite the current entry.")) return;
    setRestoring(v.id);
    try {
      await api.post(`/admin/content-history/${v.id}/restore`);
      toast.success("Version restored");
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to restore");
    } finally {
      setRestoring(null);
    }
  };

  const remove = async (v: Version) => {
    if (!confirm("Delete this version from history?")) return;
    try {
      await api.delete(`/admin/content-history/${v.id}`);
      toast.success("Version deleted");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to delete");
    }
  };

  const prettyJson = useMemo(() => {
    if (!previewing) return "";
    try {
      const parsed =
        typeof previewing.data === "string"
          ? JSON.parse(previewing.data)
          : previewing.data;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return String(previewing.data);
    }
  }, [previewing]);

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <History className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Content history</h1>
            <p className="text-muted-foreground mt-1">
              Browse past versions of your entries and restore previous states.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Versions</CardTitle>
          <CardDescription>
            Filter by content type. Most recent versions are shown first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground">Type:</label>
            <select
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={filterUid}
              onChange={(e) => setFilterUid(e.target.value)}
            >
              <option value="">All</option>
              {contentTypes.map((c: any) => (
                <option key={c.uid} value={c.uid}>
                  {c.displayName || c.uid}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <ListSkeleton rows={4} card={false} className="p-4" />
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-3">
                <History className="w-7 h-7 text-muted-foreground/70" />
              </div>
              <p className="font-medium mb-1">No versions yet</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                History entries are written each time content is updated or
                published once the lifecycle hook is enabled.
              </p>
            </div>
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold uppercase text-xs">Type</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Entry</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Status</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Author</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">When</TableHead>
                  <TableHead className="text-right font-semibold uppercase text-xs">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((v) => (
                  <TableRow key={v.id} className="border-border/50">
                    <TableCell className="font-medium">{v.uid}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.documentId
                        ? v.documentId.slice(0, 8) + "…"
                        : v.entryId ?? "—"}
                    </TableCell>
                    <TableCell>{v.status ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {v.userEmail ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatTime(v)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewing(v)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => restore(v)}
                          disabled={restoring === v.id}
                          className="gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {restoring === v.id ? "Restoring…" : "Restore"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(v)}
                          className="gap-1 text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewing} onOpenChange={(o) => { if (!o) setPreviewing(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Version snapshot</DialogTitle>
            <DialogDescription>
              {previewing?.uid} • {formatTime(previewing ?? ({} as Version))}
            </DialogDescription>
          </DialogHeader>
          <pre className="bg-muted rounded-md p-4 text-xs overflow-auto max-h-[60vh] font-mono">
            {prettyJson}
          </pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewing(null)}>
              Close
            </Button>
            {previewing && (
              <Button onClick={() => restore(previewing)} className="gap-2">
                <RotateCcw className="w-4 h-4" /> Restore this version
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
