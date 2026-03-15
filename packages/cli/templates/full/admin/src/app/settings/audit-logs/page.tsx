"use client";

import { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type AuditLogRow = {
  id: number;
  action: string;
  userId?: number | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  payload?: string | null;
  createdAt?: string;
  created_at?: string;
};

export default function AuditLogsPage() {
  const [list, setList] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{ pagination?: { page?: number; pageCount?: number; total?: number } }>({});

  const load = () => {
    setLoading(true);
    api
      .get("/admin/audit-logs", { params: { page, pageSize: 25 } })
      .then((res) => {
        setList(res.data?.data ?? []);
        setMeta(res.data?.meta ?? {});
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  const pagination = meta?.pagination;
  const total = pagination?.total ?? 0;
  const pageCount = pagination?.pageCount ?? 1;

  return (
    <div className="p-8 max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          History of admin actions (login, content changes, etc.)
        </p>
      </div>

      {loading ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">No audit logs yet</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Logs will appear here after login and other admin actions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-semibold uppercase text-xs">Time</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Action</TableHead>
                <TableHead className="font-semibold uppercase text-xs">User</TableHead>
                <TableHead className="font-semibold uppercase text-xs">IP</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id} className="border-border/50">
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {(row.createdAt || row.created_at) ? new Date(row.createdAt || row.created_at!).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="font-medium">{row.action}</TableCell>
                  <TableCell className="text-muted-foreground">{row.email || row.userId || "—"}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">{row.ip || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {row.payload || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pageCount > 1 && (
            <CardContent className="flex items-center justify-between border-t border-border/50 py-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {pageCount} ({total} total)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
