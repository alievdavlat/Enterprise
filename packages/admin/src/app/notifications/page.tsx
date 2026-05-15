"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@enterprise/design-system";
import { PageHeader } from "@/components/shared";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Webhook,
  Database,
  FileText,
} from "lucide-react";

/** Tiny "x minutes ago" formatter so we don't pull in date-fns just for this. */
function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

interface AuditLog {
  id: number;
  action: string;
  userId?: number | null;
  email?: string | null;
  ip?: string | null;
  payload?: string | null;
  createdAt: string;
}

/**
 * Notification center. There's no dedicated notifications table yet, so we
 * surface the most recent audit-log rows here — most users' first signal
 * about activity in the system. When a notifications subsystem ships
 * (Phase 16+), this page can switch its source.
 */
export default function NotificationsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/audit-logs?page=1&pageSize=50");
      const data = res.data?.data ?? [];
      setLogs(data);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
        ?? "Failed to load notifications";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <PageHeader
        icon={Bell}
        title="Notifications"
        description="Recent activity in your workspace."
        variant="primary"
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/30" />
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 text-sm text-destructive">
            {error}{" "}
            <Link href="/settings/audit-logs" className="underline">
              Open audit log
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && !error && logs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No activity yet.
          </CardContent>
        </Card>
      )}

      {!loading && logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0">
            {logs.map((log) => (
              <NotificationRow key={log.id} log={log} />
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Want richer filtering? Open the{" "}
        <Link href="/settings/audit-logs" className="underline">
          full audit log
        </Link>
        .
      </p>
    </div>
  );
}

function NotificationRow({ log }: { log: AuditLog }) {
  const { Icon, tone } = pickIcon(log.action);
  const when = log.createdAt ? formatRelativeTime(log.createdAt) : "";
  return (
    <div className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
      <div className={`mt-0.5 rounded-md p-1.5 ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{prettifyAction(log.action)}</span>
          <Badge variant="outline" className="text-[10px]">
            {log.action}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {[log.email, log.ip].filter(Boolean).join(" · ")}
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{when}</span>
    </div>
  );
}

function pickIcon(action: string): { Icon: typeof Bell; tone: string } {
  const a = action.toLowerCase();
  if (a.includes("fail") || a.includes("error") || a.includes("denied"))
    return { Icon: AlertTriangle, tone: "bg-amber-500/15 text-amber-500" };
  if (a.includes("login") || a.includes("logout") || a.includes("auth"))
    return { Icon: CheckCircle2, tone: "bg-emerald-500/15 text-emerald-500" };
  if (a.includes("webhook"))
    return { Icon: Webhook, tone: "bg-purple-500/15 text-purple-500" };
  if (a.includes("schema") || a.includes("migrate") || a.includes("table"))
    return { Icon: Database, tone: "bg-blue-500/15 text-blue-500" };
  if (a.includes("publish") || a.includes("draft") || a.includes("content"))
    return { Icon: FileText, tone: "bg-sky-500/15 text-sky-500" };
  return { Icon: Activity, tone: "bg-muted-foreground/15 text-muted-foreground" };
}

function prettifyAction(action: string): string {
  return action
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
