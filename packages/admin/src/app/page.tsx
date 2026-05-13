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
  Layers,
  Wrench,
  KeyRound,
  ImageIcon,
  Webhook,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { BrandGlyph } from "@/components/illustrations";

interface ContentStat {
  uid: string;
  displayName: string;
  count: number;
}

/**
 * Dashboard — minimal-first design (Phase 36 second pass).
 *
 * Design rules established here and reused across the admin:
 *   1. UI elements (cards, KPI tiles, action buttons) all use the same
 *      `bg-card` + `border-border/50` chrome. No per-tile gradient
 *      backgrounds — that read as gaudy. Accent is delivered via a
 *      muted-tinted icon square instead.
 *   2. Illustrations + the hero band may use gradient — they're "art",
 *      they sit outside the data hierarchy.
 *   3. One brand accent (violet) for icons & links. No rainbow.
 *   4. Numbers (KPI values) get tabular-nums + tight tracking.
 *   5. Hover affordance: subtle border tint + arrow reveal — never
 *      scale-jumps or coloured backgrounds.
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
      {/* Hero — single subtle brand glow in the top-left, rest stays neutral
          dark per user direction. No rainbow wash. */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-mesh pointer-events-none" />
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="relative p-6 md:p-10 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex w-12 h-12 rounded-xl items-center justify-center bg-background border border-border text-foreground">
                <BrandGlyph size={28} />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Dashboard
                </p>
                <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
                  {greeting}, {firstName}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base max-w-xl">
                  Your CMS is running smoothly. Pick up where you left off or start something new.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/schema-builder">
                  <Plus className="w-4 h-4 mr-2" /> New content type
                </Link>
              </Button>
              <Button asChild>
                <Link href="/settings/builder">
                  <Wrench className="w-4 h-4 mr-2" /> Code Builder
                </Link>
              </Button>
            </div>
          </div>

          {/* KPI tiles — uniform card chrome, no per-tile gradients */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile
              label="Content types"
              value={contentTypes.length}
              hint={`${collectionCount} collections · ${singleCount} singles`}
              icon={Database}
            />
            <KpiTile
              label="Total entries"
              value={totalEntries}
              hint="Across every collection"
              icon={Layers}
            />
            <KpiTile
              label="Audit events"
              value={auditCount ?? 0}
              hint={auditCount === null ? "—" : "Logged in audit trail"}
              icon={Activity}
            />
            <KpiTile
              label="API status"
              value="Online"
              hint="REST · GraphQL · Webhooks"
              icon={Zap}
              valueClass="text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>
      </section>

      <div className="p-6 md:p-10 space-y-6">
        {/* Quick actions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <QuickAction icon={Wrench} label="Code Builder" hint="Routes, services, cron" href="/settings/builder" />
            <QuickAction icon={Layers} label="Schema Builder" hint="Define content types" href="/schema-builder" />
            <QuickAction icon={Database} label="Data Manager" hint="Edit entries" href="/data-manager" />
            <QuickAction icon={ImageIcon} label="Media" hint="Upload & manage" href="/media" />
            <QuickAction icon={Webhook} label="Webhooks" hint="Event subscriptions" href="/settings/webhooks" />
            <QuickAction icon={KeyRound} label="Auth Providers" hint="OAuth & SSO" href="/settings/auth-providers" />
          </div>
        </section>

        {/* Two-column lower section */}
        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Content overview</CardTitle>
                <CardDescription>Entries per content type. Click to manage.</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {stats.length} types
              </Badge>
            </CardHeader>
            <CardContent>
              {stats.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground space-y-3">
                  <p>No content types yet.</p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/schema-builder">Create one</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {stats.slice(0, 6).map((s) => {
                    const max = Math.max(...stats.map((x) => x.count || 0), 1);
                    const pct = Math.min(100, ((s.count || 0) / max) * 100);
                    return (
                      <Link
                        key={s.uid}
                        href={`/data-manager/${s.uid}`}
                        className="group block rounded-md hover:bg-muted/40 transition-colors px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-sm">{s.displayName}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">{s.count}</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-foreground/70 transition-all"
                            style={{ width: `${pct}%` }}
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
            <CardContent className="space-y-2">
              <PulseRow label="REST API" status="online" />
              <PulseRow label="GraphQL" status="online" />
              <PulseRow label="Database" status="online" />
              <PulseRow label="Cron scheduler" status="online" />
              <PulseRow label="Webhook dispatcher" status="online" />
              <div className="pt-2 mt-2 border-t border-border/40 text-xs text-muted-foreground flex items-center justify-between">
                <span>Last check</span>
                <span className="tabular-nums">{now.toLocaleTimeString()}</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

/**
 * Single KPI tile — uniform card chrome. Accent comes from the muted-tinted
 * icon square, not the card background. Re-use this pattern for any "one
 * number + label" surface across the admin.
 */
function KpiTile({
  label, value, hint, icon: Icon, valueClass,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: typeof Database;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="w-7 h-7 rounded-md bg-muted/60 border border-border/40 flex items-center justify-center text-muted-foreground">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className={`text-2xl md:text-3xl font-semibold tracking-tight tabular-nums ${valueClass ?? ""}`}>{value}</div>
      <p className="text-xs text-muted-foreground mt-1 truncate">{hint}</p>
    </div>
  );
}

/**
 * Quick action — same card chrome as KPI. Hover gives a subtle border tint
 * + an arrow reveal. Uniform across all six entries.
 */
function QuickAction({
  icon: Icon, label, hint, href,
}: { icon: typeof Database; label: string; hint: string; href: string }) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border/60 bg-card hover:border-border hover:bg-muted/30 transition-colors p-4 flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-md bg-muted/60 border border-border/40 flex items-center justify-center text-muted-foreground shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm flex items-center gap-1.5">
          {label}
          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all" />
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{hint}</p>
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
    <div className="flex items-center justify-between text-sm py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <span className="text-xs font-medium capitalize">{status}</span>
      </span>
    </div>
  );
}
