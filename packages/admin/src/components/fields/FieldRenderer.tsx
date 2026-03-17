"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Input,
  Label,
  Switch,
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Modal,
  Badge,
} from "@enterprise/design-system";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api";
import { getImageUrl } from "@/utils/media";
import { isImageMime } from "@/utils/media";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  Puzzle,
  ImageIcon,
  FileIcon,
  FileArchive,
  FileVideo,
  FileAudio,
  FileText,
  Link2,
  Search,
  GripVertical,
} from "lucide-react";
import { TiptapEditor } from "./TiptapEditor";

const JsonCodeEditor = dynamic(
  () => import("@uiw/react-codemirror").then((m) => m.default),
  { ssr: false },
);
import { json as jsonLang } from "@codemirror/lang-json";

interface FieldRendererProps {
  field: string;
  config: Record<string, any>;
  value: any;
  onChange: (value: any) => void;
  showRequired?: boolean;
  gridSpan?: "full" | "default";
}

function ComponentFieldRenderer({
  field,
  config,
  value,
  onChange,
}: FieldRendererProps) {
  const contentTypes = useAppStore((state) => state.contentTypes);
  const componentUid = config.component;
  const repeatable = config.repeatable === true;
  const componentSchema = contentTypes.find(
    (ct) => ct.uid === componentUid && ct.kind === "component",
  );

  if (!componentSchema) {
    return (
      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4">
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Component{" "}
          <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs">
            {componentUid || "not set"}
          </code>{" "}
          not found. Create it in the Schema Builder first.
        </p>
      </div>
    );
  }

  if (repeatable) {
    const items = Array.isArray(value) ? value : [];
    const addItem = () => onChange([...items, {}]);
    const removeItem = (idx: number) =>
      onChange(items.filter((_: any, i: number) => i !== idx));
    const updateItem = (idx: number, data: any) =>
      onChange(items.map((item: any, i: number) => (i === idx ? data : item)));

    return (
      <div className="space-y-3">
        {items.map((item: any, idx: number) => (
          <ComponentInstanceCard
            key={idx}
            schema={componentSchema}
            data={item}
            onChange={(d) => updateItem(idx, d)}
            onRemove={() => removeItem(idx)}
            label={`${componentSchema.displayName} #${idx + 1}`}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          className="gap-2 border-dashed">
          <Plus className="w-3.5 h-3.5" /> Add {componentSchema.displayName}
        </Button>
      </div>
    );
  }

  const data =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return (
    <ComponentInstanceCard
      schema={componentSchema}
      data={data}
      onChange={onChange}
      label={componentSchema.displayName}
    />
  );
}

function ComponentInstanceCard({
  schema,
  data,
  onChange,
  onRemove,
  label,
}: {
  schema: any;
  data: Record<string, any>;
  onChange: (d: Record<string, any>) => void;
  onRemove?: () => void;
  label: string;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card/40 overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="w-4 h-4" />
          </span>
          <span className="truncate max-w-[220px]">{label}</span>
          <span
            className={cn(
              "ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform",
              collapsed ? "rotate-180" : "rotate-0",
            )}>
            <ChevronUp className="w-3 h-3" />
          </span>
        </button>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      {!collapsed && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-background/40">
          {Object.entries(schema.attributes || {}).map(
            ([subField, subConfig]: [string, any]) => {
              const type = subConfig.type;
              const isFullWidth = [
                "richtext",
                "component",
                "dynamiczone",
                "text",
                "json",
              ].includes(type);
              return (
                <FieldRenderer
                  key={subField}
                  field={subField}
                  config={subConfig}
                  value={data[subField]}
                  onChange={(v) => onChange({ ...data, [subField]: v })}
                  gridSpan={isFullWidth ? "full" : "default"}
                />
              );
            },
          )}
        </div>
      )}
    </div>
  );
}

function DynamicZoneFieldRenderer({
  field,
  config,
  value,
  onChange,
}: FieldRendererProps) {
  const contentTypes = useAppStore((state) => state.contentTypes);
  const allowedComponents: string[] = config.components || [];
  const [showPicker, setShowPicker] = useState(false);

  const items = Array.isArray(value) ? value : [];

  const availableComponents = contentTypes.filter(
    (ct) =>
      ct.kind === "component" &&
      (allowedComponents.length === 0 || allowedComponents.includes(ct.uid)),
  );

  const addComponent = (componentUid: string) => {
    onChange([...items, { __component: componentUid }]);
    setShowPicker(false);
  };

  const removeItem = (idx: number) =>
    onChange(items.filter((_: any, i: number) => i !== idx));

  const updateItem = (idx: number, data: any) =>
    onChange(
      items.map((item: any, i: number) =>
        i === idx ? { ...data, __component: item.__component } : item,
      ),
    );

  const moveItem = (idx: number, direction: "up" | "down") => {
    const newItems = [...items];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;
    [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      {items.map((item: any, idx: number) => {
        const compSchema = contentTypes.find(
          (ct) => ct.uid === item.__component,
        );
        if (!compSchema) {
          return (
            <div
              key={idx}
              className="rounded-lg border border-dashed border-red-300 bg-red-50 dark:bg-red-950/20 p-3 flex items-center justify-between">
              <span className="text-sm text-red-500">
                Unknown component: {item.__component}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeItem(idx)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        }

        const { __component, ...rest } = item;
        return (
          <div
            key={idx}
            className="rounded-2xl border border-border bg-card/40 overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
            <DynamicZoneItemHeader
              label={compSchema.displayName}
              index={idx}
              total={items.length}
              onRemove={() => removeItem(idx)}
              onMoveUp={() => moveItem(idx, "up")}
              onMoveDown={() => moveItem(idx, "down")}
            />
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-background/40">
              {Object.entries(compSchema.attributes || {}).map(
                ([subField, subConfig]: [string, any]) => {
                  const type = subConfig.type;
                  const isFullWidth = [
                    "richtext",
                    "component",
                    "dynamiczone",
                    "text",
                    "json",
                  ].includes(type);
                  return (
                    <FieldRenderer
                      key={subField}
                      field={subField}
                      config={subConfig}
                      value={rest[subField]}
                      onChange={(v) =>
                        updateItem(idx, { ...rest, [subField]: v })
                      }
                      gridSpan={isFullWidth ? "full" : "default"}
                    />
                  );
                },
              )}
            </div>
          </div>
        );
      })}

      {showPicker ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-medium">Pick a component</p>
          <div className="grid grid-cols-2 gap-2">
            {availableComponents.map((comp) => (
              <button
                key={comp.uid}
                type="button"
                onClick={() => addComponent(comp.uid)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/30 transition-colors text-sm font-medium text-left">
                <Layers className="w-4 h-4 text-yellow-600 shrink-0" />
                {comp.displayName}
              </button>
            ))}
          </div>
          {availableComponents.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No components available. Create components in the Schema Builder
              first.
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPicker(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowPicker(true)}
          className="gap-2 border-dashed">
          <Puzzle className="w-3.5 h-3.5" /> Add a component to {field}
        </Button>
      )}
    </div>
  );
}

function RelationFieldRenderer({
  field,
  config,
  value,
  onChange,
}: FieldRendererProps) {
  const contentTypes = useAppStore((s) => s.contentTypes);
  const targetUid = (config.target as string) || "";
  const targetSchema = contentTypes.find((c) => c.uid === targetUid);
  const relationType = (config.relation as string) || "oneToOne";
  const isMulti = relationType === "oneToMany" || relationType === "manyToMany";
  const [options, setOptions] = useState<{ id: number; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const getId = (v: unknown): number | null => {
    if (v == null) return null;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    }
    if (typeof v === "object" && "id" in (v as Record<string, unknown>)) {
      return getId((v as { id?: unknown }).id);
    }
    return null;
  };

  const singleVal = !isMulti ? getId(value) ?? undefined : undefined;
  const multiVal = isMulti
    ? (Array.isArray(value) ? value : value != null ? [value] : [])
        .map((v) => getId(v))
        .filter((n): n is number => n != null)
    : [];

  useEffect(() => {
    if (!targetSchema || targetSchema.kind === "singleType") return;
    setLoading(true);
    api
      .get<{ data: Record<string, unknown>[] }>(`/${targetSchema.pluralName}`, {
        params: { pageSize: 200 },
      })
      .then((res) => {
        const list = res.data?.data ?? [];
        setOptions(
          list.map((row) => {
            const id = row.id as number;
            const label =
              String(
                row.title ?? row.name ?? row.displayName ?? row.id ?? id,
              ) || `#${id}`;
            return { id, label };
          }),
        );
      })
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [targetSchema?.uid]);

  if (!targetSchema) {
    return (
      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-600 dark:text-amber-400">
        Relation target{" "}
        <code className="px-1 rounded bg-amber-100 dark:bg-amber-900/50">
          {targetUid || "—"}
        </code>{" "}
        not found.
      </div>
    );
  }

  const relationLabel =
    relationType === "oneToOne"
      ? "One to one"
      : relationType === "oneToMany"
        ? "One to many"
        : relationType === "manyToOne"
          ? "Many to one"
          : "Many to many";

  if (isMulti) {
    const addId = (id: number) => {
      if (multiVal.includes(id)) return;
      onChange([...multiVal, id]);
    };
    const removeId = (id: number) => onChange(multiVal.filter((x) => x !== id));
    return (
      <div className="space-y-4 w-full rounded-2xl border border-border bg-card/40 p-4 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5">
            <Link2 className="w-3 h-3 text-primary" />
            <span className="uppercase tracking-wide">
              {targetSchema.displayName}
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
            <span>
              {relationLabel} • {multiVal.length} selected
            </span>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {multiVal.length ? (
            multiVal.map((id) => {
              const opt = options.find((o) => o.id === id);
              if (!opt) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => removeId(id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-all duration-150 hover:bg-primary/20 hover:-translate-y-0.5 active:scale-[0.97]">
                  <span className="truncate max-w-[140px]">{opt.label}</span>
                  <Trash2 className="w-3 h-3" />
                </button>
              );
            })
          ) : (
            <span className="text-xs text-muted-foreground">
              No related entries selected yet.
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto rounded-xl border border-border/60 bg-muted/10 p-2.5">
          {loading ? (
            <p className="col-span-full text-xs text-muted-foreground py-4 text-center">
              Loading related entries...
            </p>
          ) : options.length === 0 ? (
            <p className="col-span-full text-xs text-muted-foreground py-4 text-center">
              No entries found in{" "}
              <span className="font-medium">{targetSchema.displayName}</span>.
            </p>
          ) : (
            options.map((opt) => {
              const selected = multiVal.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => (selected ? removeId(opt.id) : addId(opt.id))}
                  className={cn(
                    "group flex flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-left text-xs transition-all duration-150",
                    "hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "active:scale-[0.98]",
                    selected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background/40",
                  )}>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Link2 className="w-3 h-3" />
                    <span className="uppercase tracking-wide">
                      {targetSchema.displayName}
                    </span>
                  </span>
                  <span className="text-[13px] font-medium truncate w-full">
                    {opt.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full rounded-2xl border border-border bg-card/40 p-4 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5">
          <Link2 className="w-3 h-3 text-primary" />
          <span className="uppercase tracking-wide">
            {targetSchema.displayName}
          </span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
          <span>{relationLabel}</span>
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto rounded-xl border border-border/60 bg-muted/10 p-2.5">
        {loading ? (
          <p className="col-span-full text-xs text-muted-foreground py-4 text-center">
            Loading related entries...
          </p>
        ) : options.length === 0 ? (
          <p className="col-span-full text-xs text-muted-foreground py-4 text-center">
            No entries found in{" "}
            <span className="font-medium">{targetSchema.displayName}</span>.
          </p>
        ) : (
          options.map((opt) => {
            const selected = singleVal === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(selected ? undefined : opt.id)}
                className={cn(
                  "group flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left text-xs transition-all duration-150",
                  "hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "active:scale-[0.98]",
                  selected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-background/40",
                )}>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Link2 className="w-3 h-3" />
                  <span className="uppercase tracking-wide">
                    {targetSchema.displayName}
                  </span>
                </span>
                <span className="text-[13px] font-medium truncate w-full">
                  {opt.label}
                </span>
              </button>
            );
          })
        )}
      </div>
      {singleVal != null && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onChange(undefined)}>
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-xs">Clear relation</span>
        </Button>
      )}
    </div>
  );
}

function MediaDetailsEditDialog({
  open,
  onOpenChange,
  asset,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Record<string, unknown> | null;
  onSave: (payload: {
    name?: string;
    caption?: string;
    alternativeText?: string;
  }) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [alternativeText, setAlt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (asset) {
      setName(String(asset.name ?? ""));
      setCaption(String(asset.caption ?? ""));
      setAlt(String(asset.alternativeText ?? ""));
    }
  }, [asset]);

  const handleSave = async () => {
    if (!asset?.id) return;
    setSaving(true);
    try {
      await api.patch(`/upload/files/${asset.id}`, {
        name,
        caption,
        alternativeText,
      });
      onSave({ name, caption, alternativeText });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Edit asset details"
      className="max-w-[48rem]"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </>
      }>
      <div className="grid gap-6 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
        <div className="space-y-4">
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-border/60 bg-muted/40 flex items-center justify-center">
            {asset?.url && isImageMime(String(asset.mime ?? "")) ? (
              <img
                src={getImageUrl(String(asset.url))}
                alt={name || String(asset.name ?? "")}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageIcon className="w-8 h-8" />
                <span className="text-xs">
                  {name || (asset?.name as string) || "No preview available"}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <div className="space-y-0.5">
              <p className="font-medium text-[11px] uppercase tracking-wide text-foreground/70">
                File name
              </p>
              <p className="truncate text-[13px]">
                {asset?.name ? String(asset.name) : "–"}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="font-medium text-[11px] uppercase tracking-wide text-foreground/70">
                Type
              </p>
              <p className="truncate text-[13px]">
                {asset?.mime ? String(asset.mime) : "Unknown"}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="font-medium text-[11px] uppercase tracking-wide text-foreground/70">
                Size
              </p>
              <p className="truncate text-[13px]">
                {asset?.size
                  ? `${Math.round(Number(asset.size) / 1024)} KB`
                  : "–"}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="font-medium text-[11px] uppercase tracking-wide text-foreground/70">
                Dimensions
              </p>
              <p className="truncate text-[13px]">
                {asset?.width && asset?.height
                  ? `${asset.width} × ${asset.height}`
                  : "–"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="File name"
            />
          </div>
          <div className="space-y-2">
            <Label>Caption</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional short description"
            />
          </div>
          <div className="space-y-2">
            <Label>Alternative text</Label>
            <Input
              value={alternativeText}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image content for accessibility"
            />
            <p className="text-xs text-muted-foreground">
              Used by screen readers and when the image cannot be loaded.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function MediaFieldRenderer({
  field,
  config,
  value,
  onChange,
}: FieldRendererProps) {
  const multiple = Boolean(config.multiple);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<Record<string, unknown>[]>([]);
  const [editAsset, setEditAsset] = useState<Record<string, unknown> | null>(
    null,
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "images" | "files">("all");

  const current = multiple
    ? Array.isArray(value)
      ? value
      : value != null
        ? [value]
        : []
    : value != null && (typeof value === "object" || typeof value === "number")
      ? [typeof value === "object" ? value : { id: value }]
      : [];

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get<{ data: Record<string, unknown>[] }>("/upload/files", {
        params: { pageSize: 80 },
      })
      .then((res) => setFiles(res.data?.data ?? []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [open]);

  const openGallery = () => {
    setPending(current);
    setOpen(true);
  };

  const confirmSelection = () => {
    if (multiple) onChange(pending.length ? pending : undefined);
    else onChange(pending[0] ?? undefined);
    setOpen(false);
  };

  const togglePending = (file: Record<string, unknown>) => {
    const id = file.id;
    const idx = pending.findIndex((p) => (p as { id?: unknown }).id === id);
    let next: Record<string, unknown>[];
    if (idx >= 0) {
      next = pending.filter((_, i) => i !== idx);
    } else {
      next = multiple ? [...pending, file] : [file];
    }
    setPending(next);
  };

  const isSelected = (file: Record<string, unknown>) =>
    pending.some((p) => (p as { id?: unknown }).id === file.id);

  const openDetails = (item: Record<string, unknown>) => {
    setEditAsset(item);
    setDetailsOpen(true);
  };

  const handleDetailsSave = (payload: {
    name?: string;
    caption?: string;
    alternativeText?: string;
  }) => {
    if (!editAsset) return;
    const updated = { ...editAsset, ...payload };
    if (multiple) {
      onChange(
        current.map((c) =>
          (c as Record<string, unknown>).id === editAsset.id ? updated : c,
        ),
      );
    } else {
      onChange(updated);
    }
    setEditAsset(updated);
  };

  const getFileKind = (mimeOrName: string | undefined) => {
    const v = (mimeOrName || "").toLowerCase();
    if (!v) return "file";
    if (isImageMime(v) || v.startsWith("image/")) return "image";
    if (v.startsWith("video/") || v.endsWith(".mp4") || v.endsWith(".webm"))
      return "video";
    if (v.startsWith("audio/") || v.endsWith(".mp3") || v.endsWith(".wav"))
      return "audio";
    if (v.includes("pdf") || v.endsWith(".pdf")) return "pdf";
    if (v.includes("zip") || v.includes("rar") || v.includes("7z"))
      return "archive";
    if (v.includes("json") || v.endsWith(".json") || v.includes("text"))
      return "text";
    return "file";
  };

  const filteredFiles = files.filter((file) => {
    const name = String(file.name ?? "");
    const mime = String(file.mime ?? "");
    const matchesSearch = search
      ? name.toLowerCase().includes(search.toLowerCase())
      : true;
    const isImg = isImageMime(mime);
    const matchesFilter =
      filter === "all" ? true : filter === "images" ? isImg : !isImg;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-3xl space-y-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">Selected media</span>
          {multiple && current.length > 1 && (
            <span className="text-[11px]">
              Drag handles to reorder (top items appear first)
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-stretch gap-3">
        {current.length > 0 ? (
          current.map((item, i) => {
            const obj = item as Record<string, unknown>;
            const url = obj?.url as string | undefined;
            const name = (obj?.name as string) || `Asset ${i + 1}`;
            const mime = (obj?.mime as string) || "";
            const kind = getFileKind(mime || url);
            const isImg = url && kind === "image";
            return (
              <div
                key={(obj?.id ?? i) as string}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 group min-w-[260px]">
                <div className="flex flex-col items-center gap-1">
                  {isImg && url ? (
                  <img
                    src={getImageUrl(url)}
                    alt={name}
                    className="h-12 w-12 rounded-md object-cover shrink-0"
                  />
                ) : (
                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center shrink-0">
                      {kind === "video" ? (
                        <FileVideo className="w-5 h-5 text-primary" />
                      ) : kind === "audio" ? (
                        <FileAudio className="w-5 h-5 text-primary" />
                      ) : kind === "pdf" || kind === "text" ? (
                        <FileText className="w-5 h-5 text-primary" />
                      ) : kind === "archive" ? (
                        <FileArchive className="w-5 h-5 text-primary" />
                      ) : (
                        <FileIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                )}
                  <Badge
                    variant="outline"
                    className="mt-0.5 px-1.5 py-0.5 text-[9px] font-normal uppercase tracking-wide">
                    {kind}
                  </Badge>
                </div>
                <div className="flex flex-1 flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {name}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {obj?.mime ? String(obj.mime) : "Unknown type"}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {multiple && current.length > 1 && (
                    <div className="flex items-center gap-1 mr-1 cursor-grab">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={() => {
                          if (i === 0) return;
                          const next = [...current];
                          const [moved] = next.splice(i, 1);
                          next.splice(i - 1, 0, moved);
                          onChange(next);
                        }}>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="h-7 w-7"
                        onClick={() => {
                          if (i === current.length - 1) return;
                          const next = [...current];
                          const [moved] = next.splice(i, 1);
                          next.splice(i + 1, 0, moved);
                          onChange(next);
                        }}>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7"
                    onClick={() => openDetails(obj)}>
                    <Search className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      // remove this asset from the current selection
                      if (multiple) {
                        onChange(
                          current.filter(
                            (c) =>
                              (c as { id?: unknown }).id !==
                              (obj as { id?: unknown }).id,
                          ),
                        );
                      } else {
                        onChange(undefined);
                      }
                    }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <span className="text-sm text-muted-foreground">
            No media selected
          </span>
        )}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openGallery}
        className="gap-2">
        <ImageIcon className="w-3.5 h-3.5" />
        {current.length ? "Change" : "Select from gallery"}
      </Button>

      <MediaDetailsEditDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        asset={editAsset}
        onSave={handleDetailsSave}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Select ${multiple ? "media" : "an asset"}`}
        className="max-w-4xl"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={confirmSelection}
              className="cursor-pointer"
              disabled={!pending.length && multiple}>
              {multiple
                ? pending.length
                  ? `Select ${pending.length} item(s)`
                  : "Select items"
                : "Select"}
            </Button>
          </>
        }>
        <div className="sm:max-w-[960px] max-h-[80vh] flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>
                  {pending.length} selected
                  {multiple ? "" : " (single selection)"}
                </span>
              </span>
              <span className="hidden md:inline">
                {files.length ? `${files.length} items in library` : "No files"}
              </span>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
              <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-colors",
                    filter === "all"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}>
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("images")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-colors",
                    filter === "images"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}>
                  Images
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("files")}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-colors",
                    filter === "files"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}>
                  Files
                </button>
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="h-8 pl-7 pr-2 text-xs w-full md:w-56"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto min-h-[260px]">
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Loading...
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredFiles.map((file) => {
                  const url = file.url as string | undefined;
                  const name = (file.name as string) || "File";
                  const mime = (file.mime as string) || "";
                  const kind = getFileKind(mime || url);
                  const isImg = url && kind === "image";
                  const selected = isSelected(file);
                  return (
                    <button
                      key={String(file.id)}
                      type="button"
                      onClick={() => togglePending(file)}
                      className={cn(
                        "rounded-lg border-2 p-2 flex flex-col items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-muted/30",
                      )}>
                      {isImg && url ? (
                        <img
                          src={getImageUrl(url)}
                          alt={name}
                          className="h-14 w-14 rounded object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded bg-muted flex items-center justify-center">
                          {kind === "video" ? (
                            <FileVideo className="w-6 h-6 text-primary" />
                          ) : kind === "audio" ? (
                            <FileAudio className="w-6 h-6 text-primary" />
                          ) : kind === "pdf" || kind === "text" ? (
                            <FileText className="w-6 h-6 text-primary" />
                          ) : kind === "archive" ? (
                            <FileArchive className="w-6 h-6 text-primary" />
                          ) : (
                            <FileIcon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <span className="text-xs truncate w-full text-center">
                        {name}
                      </span>
                      <Badge
                        variant="outline"
                        className="mt-0.5 px-1.5 py-0.5 text-[9px] font-normal uppercase tracking-wide">
                        {kind}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DynamicZoneItemHeader({
  label,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  label: string;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Puzzle className="w-4 h-4" />
        </span>
        <span className="truncate max-w-[220px]">{label}</span>
        <span className="text-[11px] text-muted-foreground">
          #{index + 1} of {total}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={index === 0}
          onClick={onMoveUp}>
          <ChevronUp className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={index === total - 1}
          onClick={onMoveDown}>
          <ChevronDown className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function FieldRenderer({
  field,
  config,
  value,
  onChange,
  showRequired = false,
  gridSpan = "default",
}: FieldRendererProps) {
  const val = value;
  const set = onChange;

  return (
    <div
      className={cn(
        "space-y-2",
        (gridSpan === "full" || config.type === "relation") && "col-span-full",
      )}>
      <Label className="font-semibold flex items-center gap-1">
        <span className="capitalize">{field}</span>
        {showRequired && config.required && (
          <span className="text-destructive" aria-label="Required">
            *
          </span>
        )}
      </Label>

      {config.type === "boolean" ? (
        <Switch checked={!!val} onCheckedChange={set} />
      ) : config.type === "richtext" ? (
        <TiptapEditor
          value={typeof val === "string" ? val : ""}
          onChange={set}
          placeholder={`Enter ${field}...`}
        />
      ) : config.type === "text" ? (
        <textarea
          className="w-full min-h-[120px] p-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-y"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={`Enter ${field}...`}
        />
      ) : config.type === "component" ? (
        <ComponentFieldRenderer
          field={field}
          config={config}
          value={val}
          onChange={set}
        />
      ) : config.type === "dynamiczone" ? (
        <DynamicZoneFieldRenderer
          field={field}
          config={config}
          value={val}
          onChange={set}
        />
      ) : config.type === "json" ? (
        <div className="rounded-lg border border-input bg-background/60 text-xs font-mono overflow-hidden">
          <JsonCodeEditor
            value={
              typeof val === "object"
                ? JSON.stringify(val, null, 2)
                : String(val ?? "")
            }
            height="180px"
            theme="dark"
            extensions={[jsonLang()]}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
            }}
            onChange={(code) => {
              try {
                set(JSON.parse(code));
              } catch {
                set(code);
              }
            }}
            className="cm-theme-json"
          />
        </div>
      ) : config.type === "enumeration" && Array.isArray(config.enum) ? (
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={`Select value...`} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {config.enum.map((v: string) => (
                <SelectItem value={v}>{v}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : config.type === "password" ? (
        <Input
          type="password"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={`Enter ${field}...`}
          className="max-w-md h-11"
        />
      ) : config.type === "email" ? (
        <Input
          type="email"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder="name@example.com"
          className="max-w-md h-11"
        />
      ) : config.type === "date" ? (
        <Input
          type="date"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          className="max-w-md h-11"
        />
      ) : config.type === "datetime" ? (
        <Input
          type="datetime-local"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          className="max-w-md h-11"
        />
      ) : config.type === "time" ? (
        <Input
          type="time"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          className="max-w-md h-11"
        />
      ) : config.type === "integer" || config.type === "biginteger" ? (
        <Input
          type="number"
          step="1"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={`Enter ${field}...`}
          className="max-w-md h-11"
        />
      ) : config.type === "float" || config.type === "decimal" ? (
        <Input
          type="number"
          step="any"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={`Enter ${field}...`}
          className="max-w-md h-11"
        />
      ) : config.type === "relation" ? (
        <RelationFieldRenderer
          field={field}
          config={config}
          value={val}
          onChange={set}
        />
      ) : config.type === "media" ? (
        <MediaFieldRenderer
          field={field}
          config={config}
          value={val}
          onChange={set}
        />
      ) : (
        <Input
          type="text"
          value={String(val ?? "")}
          onChange={(e) => set(e.target.value)}
          placeholder={`Enter ${field}...`}
          className="max-w-md h-11"
        />
      )}
    </div>
  );
}
