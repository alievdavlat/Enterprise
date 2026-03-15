"use client";

import { useState, useEffect } from "react";
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
  Link2,
} from "lucide-react";
import { TiptapEditor } from "./TiptapEditor";

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
    <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
          <Layers className="w-4 h-4 text-yellow-600" />
          {label}
          {collapsed ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
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
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            className="rounded-lg border border-border bg-muted/20 overflow-hidden">
            <DynamicZoneItemHeader
              label={compSchema.displayName}
              index={idx}
              total={items.length}
              onRemove={() => removeItem(idx)}
              onMoveUp={() => moveItem(idx, "up")}
              onMoveDown={() => moveItem(idx, "down")}
            />
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

/** Relation field: dropdown (single) or multi-select (oneToMany/manyToMany). Value = id (number) or id[] (number[]). */
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

  const singleVal =
    !isMulti && value != null && value !== "" ? Number(value) : undefined;
  const multiVal = isMulti
    ? (Array.isArray(value) ? value : value != null ? [value] : [])
        .map((v) => Number(v))
        .filter((n) => !Number.isNaN(n))
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

  if (isMulti) {
    const addId = (id: number) => {
      if (multiVal.includes(id)) return;
      onChange([...multiVal, id]);
    };
    const removeId = (id: number) => onChange(multiVal.filter((x) => x !== id));
    return (
      <div className="max-w-md space-y-2">
        <Select
          value=""
          onValueChange={(v: any) => {
            const n = Number(v);
            if (!Number.isNaN(n)) addId(n);
          }}
          disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {options
                .filter((opt) => !multiVal.includes(opt.id))
                .map((opt) => (
                  <SelectItem key={opt.id} value={String(opt.id)}>
                    {opt.label}
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Select
      value={singleVal != null ? String(singleVal) : ""}
      onValueChange={(v: any) => onChange(v === "" ? undefined : Number(v))}
      disabled={loading}>
      <SelectTrigger>
        <SelectValue
          placeholder={
            loading ? "Loading..." : `Select ${targetSchema.displayName}...`
          }
        />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="">
            <SelectValue placeholder="Select..." />
          </SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={String(opt.id)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Image details edit modal: name, caption, alternativeText + PATCH /upload/files/:id */
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
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </>
      }>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Caption</Label>
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="grid gap-2">
          <Label>Alternative text</Label>
          <Input
            value={alternativeText}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="For accessibility"
          />
        </div>
      </div>
    </Modal>
  );
}

/** Media field: asset gallery picker. Value = single object or array of objects { id, url, name, ... }. */
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

  return (
    <div className="max-w-md space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {current.length > 0 ? (
          current.map((item, i) => {
            const obj = item as Record<string, unknown>;
            const url = obj?.url as string | undefined;
            const name = (obj?.name as string) || `Asset ${i + 1}`;
            const isImg = url && isImageMime((obj?.mime as string) || "");
            return (
              <div
                key={(obj?.id ?? i) as string}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-2 group">
                {isImg && url ? (
                  <img
                    src={getImageUrl(url)}
                    alt={name}
                    className="h-10 w-10 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <span className="text-sm truncate max-w-[120px]">{name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => openDetails(obj)}>
                  Edit
                </Button>
              </div>
            );
          })
        ) : (
          <span className="text-sm text-muted-foreground">
            No media selected
          </span>
        )}
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
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSelection}>
              {multiple ? `Select ${pending.length} item(s)` : "Select"}
            </Button>
          </>
        }>
        <div className="sm:max-w-[640px] max-h-[80vh] flex flex-col">
          <div className="flex-1 overflow-auto min-h-[240px]">
            {loading ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Loading...
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {files.map((file) => {
                  const url = file.url as string | undefined;
                  const name = (file.name as string) || "File";
                  const isImg = url && isImageMime((file.mime as string) || "");
                  const selected = isSelected(file);
                  return (
                    <button
                      key={String(file.id)}
                      type="button"
                      onClick={() => togglePending(file)}
                      className={cn(
                        "rounded-lg border-2 p-2 flex flex-col items-center gap-1 transition-colors",
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
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-xs truncate w-full text-center">
                        {name}
                      </span>
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
        <Puzzle className="w-4 h-4 text-purple-600" />
        {label}
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
    <div className={cn("space-y-2", gridSpan === "full" && "col-span-full")}>
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
        <textarea
          className="w-full min-h-[120px] p-3 rounded-lg border border-input bg-background font-mono text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-y"
          value={
            typeof val === "object"
              ? JSON.stringify(val, null, 2)
              : String(val ?? "")
          }
          onChange={(e) => {
            try {
              set(JSON.parse(e.target.value));
            } catch {
              set(e.target.value);
            }
          }}
          placeholder="{}"
        />
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
