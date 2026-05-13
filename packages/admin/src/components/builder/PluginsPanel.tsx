"use client";

import { Boxes } from "lucide-react";
import { GenericBuilderPanel, type BuilderColumn, type BuilderField } from "./GenericBuilderPanel";

type UserPlugin = {
  id: number;
  name: string;
  version?: string | null;
  description?: string | null;
  manifest?: string | null;
  enabled: boolean | number;
};

const COLUMNS: BuilderColumn<UserPlugin>[] = [
  {
    key: "name",
    label: "Name",
    render: (r) => (
      <div>
        <div className="font-medium">{r.name}{r.version && <span className="text-xs text-muted-foreground ml-2">v{r.version}</span>}</div>
        {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
      </div>
    ),
  },
  {
    key: "manifest",
    label: "Bundles",
    render: (r) => {
      let manifest: Record<string, string[]> = {};
      try { manifest = r.manifest ? JSON.parse(r.manifest) : {}; } catch { /* keep empty */ }
      const counts = (["services", "routes", "middlewares", "lifecycles"] as const)
        .map((k) => ({ k, n: (manifest[k] ?? []).length }))
        .filter((x) => x.n > 0);
      if (counts.length === 0) return <span className="text-xs text-muted-foreground">empty</span>;
      return (
        <div className="flex flex-wrap gap-1 text-xs">
          {counts.map(({ k, n }) => (
            <span key={k} className="bg-muted px-2 py-0.5 rounded">{n} {k}</span>
          ))}
        </div>
      );
    },
  },
];

const FIELDS: BuilderField[] = [
  { name: "name", label: "Name", placeholder: "blog-pipeline", required: true, lockOnEdit: true, span: 1 },
  { name: "version", label: "Version", placeholder: "1.0.0", span: 1 },
  { name: "description", label: "Description (optional)", span: 2 },
  {
    name: "manifest", label: "Manifest (JSON)", type: "textarea", rows: 12, span: 2, mono: true,
    defaultValue:
`{
  "services": ["blog.recommendations"],
  "routes": ["latestPosts"],
  "middlewares": [],
  "lifecycles": ["slugifyOnCreate"]
}`,
    helper: "Lists existing service / route / middleware / lifecycle NAMES. Toggling the plugin disables all bundled items.",
  },
];

export function PluginsPanel() {
  return (
    <GenericBuilderPanel<UserPlugin>
      label="Plugin"
      pluralLabel="Plugin bundles"
      icon={Boxes}
      description="Group existing routes / services / middlewares / lifecycles into a shippable plugin. Toggle the whole bundle on or off in one click."
      emptyHint="Bundle related no-code items together — e.g. ship a 'blog' plugin that includes the article service, the latest-posts route, the slug-on-create lifecycle, and the auth-check middleware."
      resourcePath="user-plugins"
      columns={COLUMNS}
      fields={FIELDS}
    />
  );
}
