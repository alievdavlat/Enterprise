"use client";

import { Activity } from "lucide-react";
import { Badge } from "@enterprise/design-system";
import { GenericBuilderPanel, type BuilderColumn, type BuilderField } from "./GenericBuilderPanel";

type UserLifecycle = {
  id: number;
  name: string;
  model: string;
  event: string;
  description?: string | null;
  enabled: boolean | number;
};

const EVENTS = [
  "beforeCreate", "afterCreate",
  "beforeFindOne", "afterFindOne",
  "beforeFindMany", "afterFindMany",
  "beforeUpdate", "afterUpdate",
  "beforeDelete", "afterDelete",
  "beforeCount", "afterCount",
];

const COLUMNS: BuilderColumn<UserLifecycle>[] = [
  {
    key: "name",
    label: "Name",
    render: (r) => (
      <div>
        <div className="font-medium">{r.name}</div>
        {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
      </div>
    ),
  },
  {
    key: "model",
    label: "Model",
    render: (r) => <code className="text-xs bg-muted px-2 py-0.5 rounded">{r.model}</code>,
  },
  {
    key: "event",
    label: "Event",
    render: (r) => <Badge variant="outline" className="text-xs">{r.event}</Badge>,
  },
];

const FIELDS: BuilderField[] = [
  { name: "name", label: "Name", placeholder: "slugifyOnCreate", required: true, lockOnEdit: true, span: 1 },
  {
    name: "model", label: "Content type (UID)", placeholder: "api::article.article",
    helper: "The model uid the hook fires on.", required: true, span: 1, mono: true,
  },
  {
    name: "event", label: "Event", type: "select", required: true, span: 1,
    options: EVENTS.map((e) => ({ value: e, label: e })),
  },
  { name: "description", label: "Description (optional)", span: 1 },
  {
    name: "code", label: "Handler code", type: "textarea", rows: 12, span: 2, mono: true, required: true,
    defaultValue:
`// ctx in scope. ctx.params has the data being created/updated.
// Example: auto-slug a title field on create.
const data = ctx.params?.data;
if (data && !data.slug && typeof data.title === "string") {
  data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}`,
    helper: "Runs inside an async function. Mutate ctx.params.data to influence the write.",
  },
];

export function LifecyclesPanel() {
  return (
    <GenericBuilderPanel<UserLifecycle>
      label="Lifecycle"
      pluralLabel="Lifecycle hooks"
      icon={Activity}
      description="Run code when a content-type entry is created, updated, deleted or read. Strapi-style — auto-scoped per model."
      emptyHint="Wire automation directly into the data layer — auto-slug, audit logging, denormalisation, validation, notifications."
      resourcePath="user-lifecycles"
      kind="lifecycles"
      columns={COLUMNS}
      fields={FIELDS}
    />
  );
}
