"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Input,
} from "@enterprise/design-system";
import { Code, ExternalLink, FileJson, Search } from "lucide-react";

type OpenApiSpec = {
  openapi?: string;
  info?: { title?: string; version?: string };
  paths?: Record<string, Record<string, { summary?: string; description?: string; tags?: string[] }>>;
};

const METHOD_COLORS: Record<string, string> = {
  get: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  post: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  put: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  patch: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  delete: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api";
    fetch(`${apiBase}/openapi.json`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((s: OpenApiSpec) => setSpec(s))
      .catch((e) => setError(e.message || "Failed to load spec"))
      .finally(() => setLoading(false));
  }, []);

  const operations = useMemo(() => {
    if (!spec?.paths) return [];
    const out: Array<{
      path: string;
      method: string;
      summary?: string;
      tags?: string[];
    }> = [];
    for (const [p, methods] of Object.entries(spec.paths)) {
      for (const [m, op] of Object.entries(methods)) {
        out.push({ path: p, method: m.toLowerCase(), summary: op.summary, tags: op.tags });
      }
    }
    return out;
  }, [spec]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return operations;
    return operations.filter(
      (op) =>
        op.path.toLowerCase().includes(q) ||
        op.method.toLowerCase().includes(q) ||
        op.summary?.toLowerCase().includes(q) ||
        op.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [operations, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const op of filtered) {
      const tag = op.tags?.[0] || "default";
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag)!.push(op);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <FileJson className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">API Documentation</h1>
            <p className="text-muted-foreground mt-1">
              Auto-generated OpenAPI 3.0 specification for the REST API.
            </p>
          </div>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api"}/openapi.json`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" /> Raw spec
        </a>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading spec…
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/30">
          <CardContent className="p-8 text-center text-destructive">{error}</CardContent>
        </Card>
      ) : spec ? (
        <>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="w-4 h-4" /> {spec.info?.title || "API"}
              </CardTitle>
              <CardDescription>
                Version {spec.info?.version || "1.0.0"} • OpenAPI {spec.openapi || "3.0"} •{" "}
                {operations.length} operation{operations.length === 1 ? "" : "s"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by path, method or tag…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {grouped.map(([tag, ops]) => (
            <Card key={tag} className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {tag}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/40">
                {ops.map((op, i) => (
                  <div
                    key={`${op.path}-${op.method}-${i}`}
                    className="px-6 py-3 flex items-center gap-3 hover:bg-muted/30"
                  >
                    <Badge
                      className={`uppercase text-[10px] tracking-wide font-bold border ${
                        METHOD_COLORS[op.method] ?? "bg-muted"
                      }`}
                      variant="outline"
                    >
                      {op.method}
                    </Badge>
                    <code className="text-sm font-mono">{op.path}</code>
                    {op.summary && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {op.summary}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </>
      ) : null}
    </div>
  );
}
