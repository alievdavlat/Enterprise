"use client";

import { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";
import {
  Card,
  CardContent,
  Button,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@enterprise/design-system";
import { api } from "@/lib/api";
import { ListSkeleton, PageHeader, EmptyCard } from "@/components/shared";
import { IllustrationNoData } from "@/components/illustrations";

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
    <div className="p-8 space-y-6">
      <PageHeader
        icon={ClipboardList}
        eyebrow="Settings"
        title="Audit logs"
        description="History of admin actions (login, content changes, etc.)"
        variant="amber"
      />

      {loading ? (
        <ListSkeleton rows={5} />
      ) : list.length === 0 ? (
        <EmptyCard
          illustration={<IllustrationNoData size={140} />}
          title="No audit logs yet"
          description="Logs will appear here after login and other admin actions."
        />
      ) : (
        <Card className="border-border/50">
          <TableRoot>
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
                    {formatAuditPayload(row.payload)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
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

/**
 * Audit `payload` arrives from the API as a JSON string on most rows,
 * but some adapters auto-parse it and hand us an object. Rendering an
 * object straight into JSX crashes the page — see
 * memory/feedback_no_object_as_react_child.md. Always go through here.
 */
function formatAuditPayload(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
