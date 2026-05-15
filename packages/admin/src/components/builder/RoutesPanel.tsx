"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Switch,
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

export function RoutesPanel() {
  const router = useRouter();
  const [rows, setRows] = useState<UserRoute[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    load();
  }, []);

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
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(asMsg(e) ?? "Delete failed");
    }
  };

  const goToNew = () => router.push("/settings/builder/routes/new");
  const goToEdit = (row: UserRoute) =>
    router.push(`/settings/builder/routes/${row.id}`);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">Custom routes</CardTitle>
          <CardDescription>
            HTTP endpoints under /api/u/*. Hot-reloaded on save.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline">{rows.length}</Badge>
          <Button onClick={goToNew}>
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
            description="Add HTTP routes mounted under /api/u/* — perfect for webhooks, feature flags, or one-off integrations."
            ctaLabel="Create your first route"
            onCta={goToNew}
          />
        ) : (
          <TableRoot>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs uppercase">Name</TableHead>
                <TableHead className="text-xs uppercase">Method</TableHead>
                <TableHead className="text-xs uppercase">Path</TableHead>
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
                    <div>
                      <div className="font-medium">{r.name}</div>
                      {r.description && (
                        <div className="text-xs text-muted-foreground">
                          {r.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {r.method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="font-mono text-xs">{r.path}</code>
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
                      title="Edit route">
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
