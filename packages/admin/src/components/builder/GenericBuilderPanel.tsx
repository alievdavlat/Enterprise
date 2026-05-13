"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Input, Label, Textarea, Switch,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@enterprise/design-system";
import { Plus, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { EmptyState, PanelLoadingSkeleton } from "./shared";

export interface BuilderColumn<T> {
  key: keyof T | "actions";
  label: string;
  /** Renders the cell. Default: plain text from row[key]. */
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface BuilderField {
  /** Form field name — must match the row property. */
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select";
  placeholder?: string;
  /** Only for `type: "select"`. */
  options?: { value: string; label: string }[];
  /** For textarea — number of rows. */
  rows?: number;
  /** Mark field as read-only when editing an existing row. */
  lockOnEdit?: boolean;
  /** Hide the field entirely in this mode. */
  hidden?: boolean;
  /** Tailwind class for grid-spanning. */
  span?: 1 | 2;
  /** Helper text below the input. */
  helper?: ReactNode;
  /** Default value when opening the "new" dialog. */
  defaultValue?: string | number;
  /** Whether the field is required (UI hint). */
  required?: boolean;
  /** Use monospaced font (for code / paths). */
  mono?: boolean;
}

export interface GenericBuilderPanelProps<T extends { id: number; enabled?: boolean | number }> {
  /** Display name for empty state / errors. e.g. "Service". */
  label: string;
  pluralLabel: string;
  icon: LucideIcon;
  description: string;
  /** Empty-state hint shown when there are no rows. */
  emptyHint: string;
  /** Resource path under /admin (e.g. "user-services"). */
  resourcePath: string;
  columns: BuilderColumn<T>[];
  fields: BuilderField[];
}

/**
 * Reusable builder panel — load list, render table, open create/edit dialog,
 * toggle enabled, delete. All five Phase-16 panels (services, lifecycles,
 * plugins, extensions, custom providers) share this skeleton so they stay
 * visually consistent without duplicating fetch / form / toggle logic.
 */
export function GenericBuilderPanel<T extends { id: number; enabled?: boolean | number; name?: string }>(
  props: GenericBuilderPanelProps<T>,
) {
  const { label, pluralLabel, icon, description, emptyHint, resourcePath, columns, fields } = props;
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/${resourcePath}`);
      setRows((res.data?.data ?? []) as T[]);
    } catch {
      toast.error(`Failed to load ${pluralLabel.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (row: T) => {
    try {
      await api.put(`/admin/${resourcePath}/${row.id}`, { enabled: !row.enabled });
      load();
    } catch (e) { toast.error(asMsg(e) ?? "Toggle failed"); }
  };

  const remove = async (row: T) => {
    if (!confirm(`Delete ${label.toLowerCase()} "${row.name ?? row.id}"?`)) return;
    try {
      await api.delete(`/admin/${resourcePath}/${row.id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error(asMsg(e) ?? "Delete failed"); }
  };

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-base">{pluralLabel}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline">{rows.length}</Badge>
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New {label.toLowerCase()}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <PanelLoadingSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={icon}
              title={`No ${pluralLabel.toLowerCase()} yet`}
              description={emptyHint}
              ctaLabel={`Create your first ${label.toLowerCase()}`}
              onCta={() => { setEditing(null); setDialogOpen(true); }}
            />
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  {columns.map((c) => (
                    <TableHead key={String(c.key)} className={`text-xs uppercase ${c.className ?? ""}`}>
                      {c.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-xs uppercase">Enabled</TableHead>
                  <TableHead className="text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="border-border/50">
                    {columns.map((c) => (
                      <TableCell key={String(c.key)}>
                        {c.render ? c.render(r) : String((r as unknown as Record<string, unknown>)[c.key as string] ?? "")}
                      </TableCell>
                    ))}
                    <TableCell><Switch checked={!!r.enabled} onCheckedChange={() => toggle(r)} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setDialogOpen(true); }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(r)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          )}
        </CardContent>
      </Card>

      <BuilderDialog<T>
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        fields={fields}
        label={label}
        resourcePath={resourcePath}
        onSaved={() => { setDialogOpen(false); load(); }}
      />
    </div>
  );
}

function BuilderDialog<T extends { id: number; name?: string }>({
  open, onOpenChange, editing, fields, label, resourcePath, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: T | null;
  fields: BuilderField[];
  label: string;
  resourcePath: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, unknown> = {};
    for (const f of fields) {
      if (editing) {
        initial[f.name] = (editing as unknown as Record<string, unknown>)[f.name] ?? f.defaultValue ?? "";
      } else {
        initial[f.name] = f.defaultValue ?? "";
      }
    }
    setForm(initial);
    setEnabled(editing ? !!(editing as unknown as { enabled?: boolean | number }).enabled : true);
  }, [editing, open, fields]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, enabled };
      if (editing) {
        await api.put(`/admin/${resourcePath}/${editing.id}`, payload);
        toast.success(`${label} updated`);
      } else {
        await api.post(`/admin/${resourcePath}`, payload);
        toast.success(`${label} created`);
      }
      onSaved();
    } catch (e) { toast.error(asMsg(e) ?? "Save failed"); }
    finally { setSaving(false); }
  };

  const setField = (name: string, value: unknown) => setForm((f) => ({ ...f, [name]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${label.toLowerCase()}` : `New ${label.toLowerCase()}`}</DialogTitle>
          <DialogDescription>Hot-reloaded — saved changes apply without restart.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.filter((f) => !f.hidden).map((f) => {
              const disabled = !!editing && !!f.lockOnEdit;
              const className = `${f.span === 2 ? "sm:col-span-2" : ""}`;
              const value = (form[f.name] ?? "") as string;
              return (
                <div key={f.name} className={`space-y-2 ${className}`}>
                  <Label htmlFor={`f-${f.name}`}>
                    {f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      id={`f-${f.name}`}
                      value={value}
                      onChange={(e) => setField(f.name, e.target.value)}
                      rows={f.rows ?? 8}
                      className={f.mono ? "font-mono text-xs" : ""}
                      placeholder={f.placeholder}
                    />
                  ) : f.type === "select" ? (
                    <select
                      id={`f-${f.name}`}
                      value={value}
                      onChange={(e) => setField(f.name, e.target.value)}
                      disabled={disabled}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">{f.placeholder ?? "Select…"}</option>
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={`f-${f.name}`}
                      value={value}
                      onChange={(e) => setField(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)}
                      placeholder={f.placeholder}
                      disabled={disabled}
                      type={f.type === "number" ? "number" : "text"}
                      className={f.mono ? "font-mono text-xs" : ""}
                    />
                  )}
                  {f.helper && <p className="text-xs text-muted-foreground">{f.helper}</p>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch id="builder-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="builder-enabled">Enabled</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : `Create ${label.toLowerCase()}`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function asMsg(e: unknown): string | undefined {
  return (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
}
