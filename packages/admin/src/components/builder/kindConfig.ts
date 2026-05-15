/**
 * Single source of truth for every Builder kind. Used by both the table
 * panels (list view) and the full-page editor at /settings/builder/[kind]/[id].
 *
 * Keeping this here avoids re-defining fields per consumer — the panels
 * just declare which kind they render, the editor reads the same map.
 */

import {
  Clock,
  Filter,
  Network,
  Wand2,
  Sparkles,
  Puzzle,
  Plug,
  type LucideIcon,
} from "lucide-react";

export type BuilderKind =
  | "cron"
  | "middlewares"
  | "routes"
  | "services"
  | "lifecycles"
  | "extensions"
  | "plugins";

export interface BuilderKindField {
  name: string;
  label: string;
  type: "text" | "textarea" | "code" | "select" | "switch" | "number";
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Code field language hint for the editor. */
  language?: "javascript" | "typescript" | "json";
  /** Default code/value when creating new. */
  defaultValue?: string | number | boolean;
  /** Helper text shown under the input. */
  helper?: string;
  /** Required for create. */
  required?: boolean;
  /** Can't be edited once saved (eg. name). */
  lockOnEdit?: boolean;
  /** Grid span in the metadata card (1 or 2). */
  span?: 1 | 2;
}

export interface BuilderKindConfig {
  kind: BuilderKind;
  /** Singular label, capitalized. e.g. "Route". */
  label: string;
  pluralLabel: string;
  icon: LucideIcon;
  /** Tailwind class to tint the icon's tile. */
  tint: string;
  description: string;
  /** Backend resource path under /admin. */
  resourcePath: string;
  /** Display name for the "filename" line in the editor. */
  filenameOf: (row: Record<string, unknown>) => string;
  /** Fields shown in the metadata card above the code editor. */
  metadataFields: BuilderKindField[];
  /** The single code-field name (extracted from form values on save). */
  codeField: string;
  /** Code language for the CodeMirror editor. */
  codeLanguage: "javascript" | "typescript" | "json";
  /** Default code shown when creating new. */
  defaultCode: string;
}

const TS_HINT: BuilderKindField["language"] = "typescript";

const COMMON_NAME: BuilderKindField = {
  name: "name",
  label: "Name",
  type: "text",
  placeholder: "myItem",
  required: true,
  lockOnEdit: true,
  span: 1,
};

const COMMON_DESCRIPTION: BuilderKindField = {
  name: "description",
  label: "Description",
  type: "text",
  placeholder: "Optional helper text",
  span: 1,
};

export const BUILDER_KINDS: Record<BuilderKind, BuilderKindConfig> = {
  cron: {
    kind: "cron",
    label: "Cron job",
    pluralLabel: "Cron jobs",
    icon: Clock,
    tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    description: "Schedule recurring tasks. Runs the body on the cron schedule with `app` + `ctx` in scope.",
    resourcePath: "cron-jobs",
    filenameOf: (r) => `${(r.name as string) || "cron"}.ts`,
    codeField: "code",
    codeLanguage: "typescript",
    metadataFields: [
      COMMON_NAME,
      {
        name: "schedule",
        label: "Schedule (cron expression)",
        type: "text",
        placeholder: "0 * * * *",
        required: true,
        helper: "Standard 5-field cron. Use https://crontab.guru to validate.",
        span: 1,
      },
      { ...COMMON_DESCRIPTION, span: 2 },
    ],
    defaultCode: `// app, ctx are in scope. Use app.* APIs to read/write data.
// Example: log a heartbeat every run.
console.log("cron tick", new Date().toISOString());
`,
  },

  middlewares: {
    kind: "middlewares",
    label: "Middleware",
    pluralLabel: "Middlewares",
    icon: Filter,
    tint: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    description: "Functions that wrap every request. Inspect, mutate, or short-circuit before route handlers fire.",
    resourcePath: "middlewares-list",
    filenameOf: (r) => `${(r.name as string) || "middleware"}.ts`,
    codeField: "code",
    codeLanguage: "typescript",
    metadataFields: [
      COMMON_NAME,
      {
        name: "priority",
        label: "Priority",
        type: "number",
        placeholder: "10",
        defaultValue: 10,
        helper: "Lower numbers run first (1 → 100).",
        span: 1,
      },
      { ...COMMON_DESCRIPTION, span: 2 },
    ],
    defaultCode: `// (req, res, next) => ...
// Example: attach a request id, then continue.
req.id = Math.random().toString(36).slice(2, 10);
next();
`,
  },

  routes: {
    kind: "routes",
    label: "Route",
    pluralLabel: "Routes",
    icon: Network,
    tint: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    description: "Custom HTTP routes mounted under /api/u/*. Hot-reloaded per save.",
    resourcePath: "user-routes",
    filenameOf: (r) => `${(r.method as string)?.toUpperCase() ?? "GET"} ${(r.path as string) || "/path"}`,
    codeField: "code",
    codeLanguage: "typescript",
    metadataFields: [
      COMMON_NAME,
      {
        name: "method",
        label: "HTTP method",
        type: "select",
        options: [
          { value: "GET", label: "GET" },
          { value: "POST", label: "POST" },
          { value: "PUT", label: "PUT" },
          { value: "PATCH", label: "PATCH" },
          { value: "DELETE", label: "DELETE" },
          { value: "ALL", label: "ALL methods" },
        ],
        required: true,
        defaultValue: "GET",
        span: 1,
      },
      {
        name: "path",
        label: "Path",
        type: "text",
        placeholder: "/hooks/example",
        required: true,
        helper: "Mounted under /api/u prefix. Supports :param placeholders.",
        span: 2,
      },
      { ...COMMON_DESCRIPTION, span: 2 },
    ],
    defaultCode: `// req, res, ctx in scope. ctx.params has the URL placeholders.
res.json({ data: { message: \`Hello \${ctx.params.name || "world"}\` } });
`,
  },

  services: {
    kind: "services",
    label: "Service",
    pluralLabel: "Services",
    icon: Wand2,
    tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    description: "Reusable business-logic functions. Call via app.userService(name).",
    resourcePath: "user-services",
    filenameOf: (r) => `${(r.name as string) || "service"}.ts`,
    codeField: "code",
    codeLanguage: "typescript",
    metadataFields: [COMMON_NAME, { ...COMMON_DESCRIPTION, span: 2 }],
    defaultCode: `// app is in scope. \`args\` is whatever the caller passed.
const result = await app.getDb.findMany("articles", {
  filters: { publishedAt: { $notNull: true } },
  pagination: { page: 1, pageSize: 3 },
});
return result.data;
`,
  },

  lifecycles: {
    kind: "lifecycles",
    label: "Lifecycle hook",
    pluralLabel: "Lifecycles",
    icon: Sparkles,
    tint: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
    description: "Run code before / after content lifecycle events (create, update, delete, publish).",
    resourcePath: "user-lifecycles",
    filenameOf: (r) =>
      `${(r.model as string) || "model"}.${(r.event as string) || "event"}.ts`,
    codeField: "code",
    codeLanguage: "typescript",
    metadataFields: [
      COMMON_NAME,
      {
        name: "model",
        label: "Model UID",
        type: "text",
        placeholder: "api::article.article",
        required: true,
        helper: "Content type UID this hook listens to.",
        span: 1,
      },
      {
        name: "event",
        label: "Event",
        type: "select",
        required: true,
        options: [
          { value: "beforeCreate", label: "beforeCreate" },
          { value: "afterCreate", label: "afterCreate" },
          { value: "beforeUpdate", label: "beforeUpdate" },
          { value: "afterUpdate", label: "afterUpdate" },
          { value: "beforeDelete", label: "beforeDelete" },
          { value: "afterDelete", label: "afterDelete" },
          { value: "beforePublish", label: "beforePublish" },
          { value: "afterPublish", label: "afterPublish" },
        ],
        defaultValue: "beforeCreate",
        span: 1,
      },
    ],
    defaultCode: `// ctx contains the event payload. Example: auto-slug a title.
if (ctx.data?.title && !ctx.data.slug) {
  ctx.data.slug = ctx.data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
`,
  },

  extensions: {
    kind: "extensions",
    label: "Extension",
    pluralLabel: "Extensions",
    icon: Puzzle,
    tint: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    description: "Patch built-in plugins via named hook points (eg. upload.afterUpload, email.beforeSend).",
    resourcePath: "user-extensions",
    filenameOf: (r) =>
      `${(r.target as string) || "target"}.${(r.phase as string) || "phase"}.ts`,
    codeField: "code",
    codeLanguage: "typescript",
    metadataFields: [
      COMMON_NAME,
      {
        name: "target",
        label: "Target",
        type: "text",
        placeholder: "upload.afterUpload",
        required: true,
        helper: "Plugin extension point. Built-in plugins call app.userExtensions(target).",
        span: 1,
      },
      {
        name: "phase",
        label: "Phase",
        type: "select",
        options: [
          { value: "before", label: "before" },
          { value: "after", label: "after" },
        ],
        defaultValue: "after",
        span: 1,
      },
    ],
    defaultCode: `// ctx is the call site's context. Inspect or mutate, then return.
return ctx;
`,
  },

  plugins: {
    kind: "plugins",
    label: "Plugin bundle",
    pluralLabel: "Plugins",
    icon: Plug,
    tint: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    description: "Bundle services / routes / middlewares / lifecycles into a single togglable unit.",
    resourcePath: "user-plugins",
    filenameOf: (r) => `${(r.name as string) || "plugin"}.json`,
    codeField: "manifest",
    codeLanguage: "json",
    metadataFields: [
      COMMON_NAME,
      {
        name: "version",
        label: "Version",
        type: "text",
        placeholder: "1.0.0",
        defaultValue: "1.0.0",
        span: 1,
      },
      { ...COMMON_DESCRIPTION, span: 2 },
    ],
    defaultCode: `{
  "services": [],
  "routes": [],
  "middlewares": [],
  "lifecycles": []
}
`,
  },
};

export const BUILDER_KIND_LIST = Object.values(BUILDER_KINDS);

export function isBuilderKind(v: string): v is BuilderKind {
  return v in BUILDER_KINDS;
}
