"use client";

import { Wand2 } from "lucide-react";
import { GenericBuilderPanel, type BuilderColumn, type BuilderField } from "./GenericBuilderPanel";

type UserService = {
  id: number;
  name: string;
  description?: string | null;
  enabled: boolean | number;
};

const COLUMNS: BuilderColumn<UserService>[] = [
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
];

const FIELDS: BuilderField[] = [
  {
    name: "name", label: "Name", placeholder: "blog.recommendations",
    helper: "Used as the key — call via app.userService(name).",
    required: true, lockOnEdit: true, span: 1,
  },
  { name: "description", label: "Description (optional)", span: 1 },
  {
    name: "code", label: "Service body", type: "textarea", rows: 12, span: 2, mono: true, required: true,
    defaultValue:
`// app is in scope. \`args\` is whatever the caller passed.
// Example: fetch latest 3 published articles.
const result = await app.getDb.findMany("articles", {
  filters: { publishedAt: { $notNull: true } },
  pagination: { page: 1, pageSize: 3 },
});
return result.data;`,
    helper: "Async function body. Return any value — the caller receives the resolved promise.",
  },
];

export function ServicesPanel() {
  return (
    <GenericBuilderPanel<UserService>
      label="Service"
      pluralLabel="Services"
      icon={Wand2}
      description="Reusable business-logic functions. Call from any route, lifecycle or cron via app.userService(name)."
      emptyHint="Bundle reusable logic (data fetches, transforms, notification senders) so multiple endpoints share the same code path without copy-paste."
      resourcePath="user-services"
      kind="services"
      columns={COLUMNS}
      fields={FIELDS}
    />
  );
}
