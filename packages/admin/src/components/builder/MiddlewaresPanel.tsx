"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Switch,
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

export function MiddlewaresPanel() {
  const router = useRouter();
  const [rows, setRows] = useState<UserMiddleware[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    load();
  }, []);

  const toggle = async (row: UserMiddleware) => {
    try {
      await api.put(`/admin/middlewares-list/${row.id}`, {
        enabled: !row.enabled,
      });
      load();
    } catch (e) {
      toast.error(asMsg(e) ?? "Toggle failed");
    }
  };

  const remove = async (row: UserMiddleware) => {
    if (!confirm(`Delete middleware "${row.name}"?`)) return;
    try {
      await api.delete(`/admin/middlewares-list/${row.id}`);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(asMsg(e) ?? "Delete failed");
    }
  };

  const goToNew = () => router.push("/settings/builder/middlewares/new");
  const goToEdit = (row: UserMiddleware) =>
    router.push(`/settings/builder/middlewares/${row.id}`);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">Middlewares</CardTitle>
          <CardDescription>
            Run on every request before the API routers. Lower priority runs
            first.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline">{rows.length}</Badge>
          <Button onClick={goToNew}>
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
            onCta={goToNew}
          />
        ) : (
          <TableRoot>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs uppercase">Priority</TableHead>
                <TableHead className="text-xs uppercase">Name</TableHead>
                <TableHead className="text-xs uppercase">Enabled</TableHead>
                <TableHead className="text-xs uppercase text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.id}
                  className="border-border/50 cursor-pointer hover:bg-muted/30"
                  onClick={() => goToEdit(r)}>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-0.5 rounded">
                      {r.priority}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{r.name}</div>
                    {r.description && (
                      <div className="text-xs text-muted-foreground">
                        {r.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={!!r.enabled}
                      onCheckedChange={() => toggle(r)}
                    />
                  </TableCell>
                  <TableCell
                    className="text-right space-x-1"
                    onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => goToEdit(r)}
                      title="Edit middleware">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(r)}>
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
  );
}

function asMsg(e: unknown): string | undefined {
  return (e as { response?: { data?: { error?: { message?: string } } } })
    ?.response?.data?.error?.message;
}
