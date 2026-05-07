"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Switch,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  Textarea,
} from "@enterprise/design-system";
import {
  Blocks,
  Settings,
  Layers,
  Clock,
  Repeat2,
  Search,
  ExternalLink,
  Filter,
  Plus,
  Check,
  Trash2,
  PlayCircle,
  PauseCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { PLUGINS, MIDDLEWARES } from "@/consts/plugin-middleware.const";
import { cn } from "@/lib/utils";

type Plugin = typeof PLUGINS[number];
type Middleware = typeof MIDDLEWARES[number];

type CronJob = {
  id: number | string;
  name: string;
  cron: string;
  task: string;
  enabled: boolean;
  lastRun?: string | null;
  nextRun?: string | null;
};

type Lifecycle = {
  id: string;
  model: string;
  hook: string;
  description?: string;
  enabled: boolean;
};

type Extension = {
  id: string;
  name: string;
  source: string;
  description?: string;
  installed: boolean;
};

const TABS = [
  { value: "plugins", label: "Plugins", icon: Blocks },
  { value: "middlewares", label: "Middlewares", icon: Settings },
  { value: "extensions", label: "Extensions", icon: Layers },
  { value: "cron", label: "Cron Jobs", icon: Clock },
  { value: "lifecycles", label: "Lifecycles", icon: Repeat2 },
] as const;

type TabValue = (typeof TABS)[number]["value"];

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as TabValue) || "plugins";
  const [tab, setTab] = useState<TabValue>(initialTab);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");

  const onTabChange = (next: string) => {
    setTab(next as TabValue);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground p-3 rounded-2xl shadow-lg">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Plugins &amp; Tools</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Manage plugins, middlewares, extensions, scheduled jobs and lifecycle hooks — all in one place
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9 w-full sm:w-72"
            />
          </div>
          <div className="flex gap-1 bg-muted/40 p-1 rounded-md">
            {(["all", "enabled", "disabled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded transition-colors capitalize font-medium",
                  filter === f
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={onTabChange} className="w-full">
        <TabsList className="bg-muted/40 p-1 rounded-xl mb-2 w-full sm:w-fit overflow-x-auto flex">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap"
            >
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="plugins" className="mt-4">
          <PluginsPanel search={search} filter={filter} />
        </TabsContent>
        <TabsContent value="middlewares" className="mt-4">
          <MiddlewaresPanel search={search} filter={filter} />
        </TabsContent>
        <TabsContent value="extensions" className="mt-4">
          <ExtensionsPanel search={search} />
        </TabsContent>
        <TabsContent value="cron" className="mt-4">
          <CronPanel search={search} filter={filter} />
        </TabsContent>
        <TabsContent value="lifecycles" className="mt-4">
          <LifecyclesPanel search={search} filter={filter} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ================== PLUGINS PANEL ==================
function PluginsPanel({ search, filter }: { search: string; filter: string }) {
  const [plugins, setPlugins] = useState<Plugin[]>(PLUGINS);

  useEffect(() => {
    api
      .get("/admin/plugins")
      .then((res) => {
        const state = (res.data?.data ?? {}) as Record<string, boolean>;
        if (Object.keys(state).length === 0) return;
        setPlugins((prev) =>
          prev.map((p) => (p.id in state ? { ...p, enabled: state[p.id] } : p))
        );
      })
      .catch(() => {});
  }, []);

  const toggle = async (id: string, current: boolean) => {
    const next = !current;
    setPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: next } : p))
    );
    try {
      await api.post("/admin/plugins/toggle", { plugin: id, enabled: next });
      toast.success(`${next ? "Enabled" : "Disabled"} ${id}`);
    } catch {
      setPlugins((prev) =>
        prev.map((p) => (p.id === id ? { ...p, enabled: current } : p))
      );
      toast.error(`Failed to toggle ${id}`);
    }
  };

  const visible = useMemo(() => {
    return plugins.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "enabled" && p.enabled) ||
        (filter === "disabled" && !p.enabled);
      return matchesSearch && matchesFilter;
    });
  }, [plugins, search, filter]);

  if (visible.length === 0) {
    return <EmptyState icon={Blocks} title="No plugins match your filter" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {visible.map((plugin) => {
        const Icon = plugin.icon;
        return (
          <Card
            key={plugin.id}
            className={cn(
              "group border-border/60 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden",
              plugin.enabled && "ring-1 ring-primary/20"
            )}
          >
            <div className="h-1 bg-gradient-to-r from-primary to-primary/40" />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="bg-primary/10 p-2.5 rounded-lg border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                {plugin.enabled ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border">
                    <Check className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base leading-snug">
                    {plugin.name}
                  </h3>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    v{plugin.version}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {plugin.description}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-3">
                <Label
                  htmlFor={`plugin-${plugin.id}`}
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  {plugin.enabled ? "Disable" : "Enable"}
                </Label>
                <Switch
                  id={`plugin-${plugin.id}`}
                  checked={plugin.enabled}
                  onCheckedChange={() => toggle(plugin.id, plugin.enabled)}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ================== MIDDLEWARES PANEL ==================
function MiddlewaresPanel({
  search,
  filter,
}: {
  search: string;
  filter: string;
}) {
  const [items, setItems] = useState<Middleware[]>(MIDDLEWARES);

  useEffect(() => {
    api
      .get("/admin/middlewares")
      .then((res) => {
        const state = (res.data?.data ?? {}) as Record<string, boolean>;
        if (Object.keys(state).length === 0) return;
        setItems((prev) =>
          prev.map((m) => (m.id in state ? { ...m, enabled: state[m.id] } : m))
        );
      })
      .catch(() => {});
  }, []);

  const toggle = async (id: string, current: boolean) => {
    const next = !current;
    setItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: next } : m))
    );
    try {
      await api.post("/admin/middlewares/toggle", {
        middleware: id,
        enabled: next,
      });
      toast.success(`${next ? "Enabled" : "Disabled"} ${id}`);
    } catch {
      setItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, enabled: current } : m))
      );
      toast.error(`Failed to toggle ${id}`);
    }
  };

  const visible = useMemo(() => {
    return items.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "enabled" && p.enabled) ||
        (filter === "disabled" && !p.enabled);
      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  if (visible.length === 0) {
    return <EmptyState icon={Settings} title="No middlewares match your filter" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((mw) => {
        const Icon = mw.icon;
        return (
          <Card
            key={mw.id}
            className={cn(
              "border-border/60 hover:shadow-md transition-all",
              mw.enabled && "ring-1 ring-primary/20"
            )}
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold leading-tight">{mw.name}</h3>
                    <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                      enterprise::{mw.id}
                    </code>
                  </div>
                </div>
                <Switch
                  checked={mw.enabled}
                  onCheckedChange={() => toggle(mw.id, mw.enabled)}
                />
              </div>
              <p className="text-sm text-muted-foreground">{mw.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ================== EXTENSIONS PANEL ==================
function ExtensionsPanel({ search }: { search: string }) {
  const [exts, setExts] = useState<Extension[]>([]);

  useEffect(() => {
    api
      .get("/admin/extensions")
      .then((res) => {
        const data = res.data?.data ?? [];
        setExts(Array.isArray(data) ? data : []);
      })
      .catch(() => setExts([]));
  }, []);

  const visible = useMemo(
    () =>
      exts.filter(
        (e) =>
          !search ||
          e.name.toLowerCase().includes(search.toLowerCase()) ||
          (e.description ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [exts, search]
  );

  return (
    <div className="space-y-4">
      <Card className="border-dashed border-2 border-border/60">
        <CardContent className="p-6 text-center space-y-3">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold">Extensions</h3>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-1">
              Drop a folder into <code className="bg-muted px-1.5 py-0.5 rounded text-xs">src/extensions/&lt;name&gt;</code> to extend a core plugin (e.g. add custom controllers / routes / services). Reloads on next server start.
            </p>
          </div>
        </CardContent>
      </Card>

      {visible.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((ext) => (
            <Card key={ext.id} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-purple-500/10 p-2 rounded-lg border border-purple-500/20">
                    <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  {ext.installed ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border">
                      Installed
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not loaded</Badge>
                  )}
                </div>
                <h3 className="font-semibold">{ext.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {ext.source}
                </p>
                {ext.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {ext.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Layers}
          title="No extensions detected"
          subtitle="Generate one with `npx create-enterprise-app generate extension <name>`"
        />
      )}
    </div>
  );
}

// ================== CRON PANEL ==================
function CronPanel({
  search,
  filter,
}: {
  search: string;
  filter: string;
}) {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    cron: string;
    task: string;
  }>({ name: "", cron: "", task: "" });

  const load = () =>
    api
      .get("/admin/cron")
      .then((res) => {
        const data = res.data?.data ?? [];
        setJobs(Array.isArray(data) ? data : []);
      })
      .catch(() => setJobs([]));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      await api.post("/admin/cron", form);
      toast.success("Cron job created");
      setOpen(false);
      setForm({ name: "", cron: "", task: "" });
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to create job");
    }
  };

  const toggle = async (id: string | number, current: boolean) => {
    const next = !current;
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, enabled: next } : j)));
    try {
      await api.post(`/admin/cron/${id}/toggle`, { enabled: next });
      toast.success(`${next ? "Enabled" : "Disabled"} job`);
    } catch {
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, enabled: current } : j))
      );
      toast.error("Failed to toggle job");
    }
  };

  const remove = async (id: string | number) => {
    if (!confirm("Delete this cron job?")) return;
    try {
      await api.delete(`/admin/cron/${id}`);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success("Job deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const visible = jobs.filter((j) => {
    const matchesSearch =
      !search || j.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "enabled" && j.enabled) ||
      (filter === "disabled" && !j.enabled);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Scheduled tasks running on the server
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New cron job
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New cron job</DialogTitle>
              <DialogDescription>
                Schedule a recurring server task. Use standard cron syntax.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Daily cleanup"
                />
              </div>
              <div className="space-y-2">
                <Label>Cron expression</Label>
                <Input
                  value={form.cron}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cron: e.target.value }))
                  }
                  placeholder="0 2 * * *"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Format: <code>min hour day month weekday</code>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Task handler</Label>
                <Input
                  value={form.task}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, task: e.target.value }))
                  }
                  placeholder="api::cleanup.cleanup"
                  className="font-mono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={create}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No cron jobs scheduled"
          subtitle="Click 'New cron job' to schedule one."
        />
      ) : (
        <div className="grid gap-3">
          {visible.map((j) => (
            <Card key={j.id} className="border-border/60">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "p-2 rounded-lg border",
                      j.enabled
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : "bg-muted/50 border-border"
                    )}
                  >
                    {j.enabled ? (
                      <PlayCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <PauseCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{j.name}</h4>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                        {j.cron}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {j.task}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={j.enabled}
                    onCheckedChange={() => toggle(j.id, j.enabled)}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(j.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
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

// ================== LIFECYCLES PANEL ==================
function LifecyclesPanel({
  search,
  filter,
}: {
  search: string;
  filter: string;
}) {
  const [items, setItems] = useState<Lifecycle[]>([]);

  useEffect(() => {
    api
      .get("/admin/lifecycles")
      .then((res) => setItems(res.data?.data ?? []))
      .catch(() => setItems([]));
  }, []);

  const visible = items.filter((l) => {
    const matchesSearch =
      !search ||
      l.model.toLowerCase().includes(search.toLowerCase()) ||
      l.hook.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "enabled" && l.enabled) ||
      (filter === "disabled" && !l.enabled);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <Card className="border-dashed border-2 border-border/60">
        <CardContent className="p-6 text-center space-y-3">
          <Repeat2 className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <h3 className="font-semibold">Lifecycle hooks</h3>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-1">
              Hook into <code>beforeCreate</code>, <code>afterUpdate</code>, etc. for any model. Drop a file into{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                src/api/&lt;model&gt;/content-types/&lt;model&gt;/lifecycles.ts
              </code>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      {visible.length === 0 ? (
        <EmptyState
          icon={Repeat2}
          title="No lifecycle hooks registered"
          subtitle="Generate one with `npx create-enterprise-app generate lifecycle <model>`"
        />
      ) : (
        <div className="grid gap-3">
          {visible.map((l) => (
            <Card key={l.id} className="border-border/60">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <Repeat2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{l.model}</span>
                      <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                        {l.hook}
                      </code>
                    </div>
                    {l.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {l.description}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  className={cn(
                    "border",
                    l.enabled
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {l.enabled ? "Active" : "Inactive"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ================== HELPERS ==================
function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <Card className="border-dashed border-2 border-border/60">
      <CardContent className="p-12 text-center space-y-3">
        <Icon className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
        <h3 className="font-semibold text-lg">{title}</h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
