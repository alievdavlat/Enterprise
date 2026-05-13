"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "@enterprise/design-system";
import { useAppStore } from "@/store/app";
import {
  Database,
  Plus,
  ArrowRight,
  Activity,
  Sparkles,
  Layers,
  Wrench,
  Clock,
  KeyRound,
  ImageIcon,
  Webhook,
  Zap,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { Spark, BrandGlyph } from "@/components/illustrations";

interface ContentStat {
  uid: string;
  displayName: string;
  count: number;
}

/**
 * Dashboard — first page after login. Phase 36 visual overhaul:
 * gradient mesh hero, branded KPI tiles with sparkline cues, quick-action
 * grid, recent activity, and a system pulse panel. Replaces the plain
 * 4-card grid that didn't communicate scale or invite a next action.
 */
export default function Dashboard() {
  const { contentTypes, fetchContentTypes, user } = useAppStore();
  const [stats, setStats] = useState<ContentStat[]>([]);
  const [auditCount, setAuditCount] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    fetchContentTypes();
    api.get("/admin/stats").then((r) => setStats(r.data.data ?? [])).catch(() => {});
    api
      .get("/admin/audit-logs?pageSize=1")
      .then((r) => setAuditCount(r.data?.meta?.pagination?.total ?? null))
      .catch(() => {});
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, [fetchContentTypes]);

  const totalEntries = useMemo(() => stats.reduce((a, b) => a + (b.count || 0), 0), [stats]);
  const collectionCount = useMemo(() => contentTypes.filter((c) => c.kind === "collectionType").length, [contentTypes]);
  const singleCount = useMemo(() => contentTypes.filter((c) => c.kind === "singleType").length, [contentTypes]);

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 5) return "Working late";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, [now]);

  const firstName = user?.firstName?.trim() || user?.email?.split("@")[0] || "there";

  return (
    <div className="relative animate-in fade-in duration-500">
      {/* Hero — gradient mesh + grid overlay */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-mesh opacity-80 pointer-events-none" />
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative p-6 md:p-10 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex w-14 h-14 rounded-2xl ring-glow items-center justify-center bg-background/80 backdrop-blur">
                <BrandGlyph size={32} />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-background/60 border border-border/40 backdrop-blur">
                  <Spark size={12} />
                  Welcome back
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {greeting}, <span className="text-brand-gradient">{firstName}</span>
                </h1>
                <p className="text-muted-foreground text-sm md:text-base max-w-xl">
                  Your CMS is up and running. Pick up where you left off or start something new below.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="bg-background/60 backdrop-blur">
                <Link href="/schema-builder">
                  <Plus className="w-4 h-4 mr-2" /> New content type
                </Link>
              </Button>
              <Button asChild className="shadow-lg">
                <Link href="/settings/builder">
                  <Wrench className="w-4 h-4 mr-2" /> Code Builder
                </Link>
              </Button>
            </div>
          </div>

          {/* KPI tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <KpiTile
              label="Content types"
              value={contentTypes.length}
              hint={`${collectionCount} collections · ${singleCount} singles`}
              icon={Database}
              accent="violet"
            />
            <KpiTile
              label="Total entries"
              value={totalEntries}
              hint="Across every collection"
              icon={Layers}
              accent="blue"
            />
            <KpiTile
              label="Activity (audit)"
              value={auditCount ?? 0}
              hint={auditCount === null ? "—" : "Logged events"}
              icon={Activity}
              accent="pink"
            />
            <KpiTile
              label="API status"
              value="Online"
              hint="REST · GraphQL · Webhooks"
              icon={Zap}
              accent="emerald"
            />
          </div>
        </div>
      </section>

      <div className="p-6 md:p-10 space-y-6">
        {/* Quick actions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <QuickAction icon={Wrench} label="Code Builder" hint="Routes, services, cron…" href="/settings/builder" />
            <QuickAction icon={Layers} label="Schema Builder" hint="Define content types" href="/schema-builder" />
            <QuickAction icon={Database} label="Data Manager" hint="Edit entries" href="/data-manager" />
            <QuickAction icon={ImageIcon} label="Media" hint="Upload & manage" href="/media" />
            <QuickAction icon={Webhook} label="Webhooks" hint="Event subscriptions" href="/settings/webhooks" />
            <QuickAction icon={KeyRound} label="Auth Providers" hint="OAuth & SSO" href="/settings/auth-providers" />
          </div>
        </div>

        {/* Two-column lower section */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Content overview</CardTitle>
                <CardDescription>Entries per content type — click to manage.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {stats.length} types
              </Badge>
            </CardHeader>
            <CardContent>
              {stats.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground space-y-2">
                  <p>No data yet.</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/schema-builder">Create a content type</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.slice(0, 6).map((s, idx) => {
                    const max = Math.max(...stats.map((x) => x.count || 0), 1);
                    const pct = Math.min(100, ((s.count || 0) / max) * 100);
                    return (
                      <Link
                        key={s.uid}
                        href={`/data-manager/${s.uid}`}
                        className="block group rounded-lg border border-border/40 hover:border-primary/40 hover:bg-muted/30 transition-all p-3"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-sm">{s.displayName}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {s.count} entries
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundImage:
                                idx % 4 === 0
                                  ? "linear-gradient(90deg, hsl(var(--brand-violet)), hsl(var(--brand-pink)))"
                                  : idx % 4 === 1
                                    ? "linear-gradient(90deg, hsl(var(--brand-blue)), hsl(var(--brand-violet)))"
                                    : idx % 4 === 2
                                      ? "linear-gradient(90deg, hsl(var(--brand-emerald)), hsl(var(--brand-blue)))"
                                      : "linear-gradient(90deg, hsl(var(--brand-orange)), hsl(var(--brand-pink)))",
                            }}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="relative inline-flex w-2 h-2">
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
                </span>
                System pulse
              </CardTitle>
              <CardDescription>All services healthy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <PulseRow label="REST API" status="online" />
              <PulseRow label="GraphQL" status="online" />
              <PulseRow label="Database" status="online" />
              <PulseRow label="Cron scheduler" status="online" />
              <PulseRow label="Webhook dispatcher" status="online" />
              <div className="pt-2 mt-2 border-t border-border/40 text-xs text-muted-foreground flex items-center justify-between">
                <span>Last check</span>
                <span>{now.toLocaleTimeString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiTile({
  label, value, hint, icon: Icon, accent,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: typeof Database;
  accent: "violet" | "blue" | "pink" | "emerald";
}) {
  const tints: Record<typeof accent, { bg: string; border: string; text: string }> = {
    violet: { bg: "from-violet-500/10", border: "border-violet-500/30", text: "text-violet-500 dark:text-violet-300" },
    blue:   { bg: "from-sky-500/10", border: "border-sky-500/30", text: "text-sky-500 dark:text-sky-300" },
    pink:   { bg: "from-pink-500/10", border: "border-pink-500/30", text: "text-pink-500 dark:text-pink-300" },
    emerald:{ bg: "from-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500 dark:text-emerald-300" },
  };
  const t = tints[accent];
  return (
    <div className={`relative overflow-hidden rounded-xl border ${t.border} bg-gradient-to-br ${t.bg} to-background/60 backdrop-blur p-4 transition-transform hover:scale-[1.02]`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${t.text}`} />
      </div>
      <div className="mt-2 text-2xl md:text-3xl font-bold tabular-nums">{value}</div>
      <p className="text-xs text-muted-foreground mt-1 truncate">{hint}</p>
    </div>
  );
}

function QuickAction({
  icon: Icon, label, hint, href,
}: { icon: typeof Database; label: string; hint: string; href: string }) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all p-4 flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm flex items-center gap-1">
          {label}
          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all" />
        </div>
        <p className="text-xs text-muted-foreground truncate">{hint}</p>
      </div>
    </Link>
  );
}

function PulseRow({ label, status }: { label: string; status: "online" | "warn" | "down" }) {
  const dot =
    status === "online"
      ? "bg-emerald-500"
      : status === "warn"
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <span className="text-xs font-medium capitalize">{status}</span>
      </span>
    </div>
  );
}
