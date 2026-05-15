"use client";

import { Puzzle } from "lucide-react";
import { Badge } from "@enterprise/design-system";
import { GenericBuilderPanel, type BuilderColumn, type BuilderField } from "./GenericBuilderPanel";

type UserExtension = {
  id: number;
  name: string;
  target: string;
  phase: string;
  description?: string | null;
  enabled: boolean | number;
};

const PHASES = [
  { value: "before", label: "Before (intercept input)" },
  { value: "after", label: "After (inspect output)" },
];

const COLUMNS: BuilderColumn<UserExtension>[] = [
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
    key: "target",
    label: "Target",
    render: (r) => <code className="text-xs bg-muted px-2 py-0.5 rounded">{r.target}</code>,
  },
  {
    key: "phase",
    label: "Phase",
    render: (r) => <Badge variant="outline" className="text-xs">{r.phase}</Badge>,
  },
];

const FIELDS: BuilderField[] = [
  { name: "name", label: "Name", placeholder: "watermarkUploads", required: true, lockOnEdit: true, span: 1 },
  {
    name: "target", label: "Target", placeholder: "upload.afterUpload",
    helper: "Built-in plugin action — e.g. upload.beforeUpload, email.beforeSend, auth.afterLogin.",
    required: true, span: 1, mono: true,
  },
  {
    name: "phase", label: "Phase", type: "select", required: true, span: 1,
    options: PHASES,
  },
  { name: "description", label: "Description (optional)", span: 1 },
  {
    name: "code", label: "Handler code", type: "textarea", rows: 12, span: 2, mono: true, required: true,
    defaultValue:
`// ctx in scope. Carries whatever the host plugin passed —
// for upload.afterUpload that's { file, record }, for example.
// Example: log uploaded filename.
console.log("[ext] uploaded:", ctx?.record?.name);`,
    helper: "Runs inside an async function. Throw to short-circuit the host action.",
  },
];

export function ExtensionsPanel() {
  return (
    <GenericBuilderPanel<UserExtension>
      label="Extension"
      pluralLabel="Extensions"
      icon={Puzzle}
      description="Pre / post hooks that wrap built-in plugin actions. Inspect inputs, mutate outputs, or short-circuit by throwing."
      emptyHint="Hook into the built-in plugins (upload, email, auth, users-permissions) without forking them. Add a watermark on every upload, attach a footer to every email, log every login attempt — all from here."
      resourcePath="user-extensions"
      kind="extensions"
      columns={COLUMNS}
      fields={FIELDS}
    />
  );
}
