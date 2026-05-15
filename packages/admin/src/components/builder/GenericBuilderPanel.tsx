"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  TableRoot, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Badge, Button, Switch,
} from "@enterprise/design-system";
import { Plus, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { EmptyState, PanelLoadingSkeleton } from "./shared";
import type { BuilderKind } from "./kindConfig";

export interface BuilderColumn<T> {
  key: keyof T | "actions";
  label: string;
  /** Renders the cell. Default: plain text from row[key]. */
  render?: (row: T) => ReactNode;
  className?: string;
}

/**
 * Kept around so existing panel configs (Services / Lifecycles / Plugins /
 * Extensions) compile without touching their static field declarations.
 * The fields are no longer consumed inside the panel — the full-page
 * editor reads them from `BUILDER_KINDS` instead. This shape is just a
 * pass-through type for backwards compat.
 */
export interface BuilderField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  lockOnEdit?: boolean;
  hidden?: boolean;
  span?: 1 | 2;
  helper?: ReactNode;
  defaultValue?: string | number;
  required?: boolean;
  mono?: boolean;
}

export interface GenericBuilderPanelProps<
  T extends { id: number; enabled?: boolean | number },
> {
  label: string;
  pluralLabel: string;
  icon: LucideIcon;
  description: string;
  emptyHint: string;
  resourcePath: string;
  /** BuilderKind for navigation to the full-page editor. */
  kind: BuilderKind;
  columns: BuilderColumn<T>[];
  /** Retained for type-compat with existing panel configs; unused at runtime. */
  fields?: BuilderField[];
}

/**
 * Reusable builder panel — load list, render table, toggle enabled, delete.
 *
 * Create / Edit no longer open a modal — they navigate to the full-page
 * editor at `/settings/builder/[kind]/[id]` (or `.../new`). The editor
 * gives users a VS Code-style code surface with a file tree of sibling
 * items, a metadata bar, the CodeMirror editor, and a status bar.
 */
export function GenericBuilderPanel<
  T extends { id: number; enabled?: boolean | number; name?: string },
>(props: GenericBuilderPanelProps<T>) {
  const {
    label,
    pluralLabel,
    icon,
    description,
    emptyHint,
    resourcePath,
    kind,
    columns,
  } = props;
  const router = useRouter();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (row: T) => {
    try {
      await api.put(`/admin/${resourcePath}/${row.id}`, { enabled: !row.enabled });
      load();
    } catch (e) {
      toast.error(asMsg(e) ?? "Toggle failed");
    }
  };

  const remove = async (row: T) => {
    if (!confirm(`Delete ${label.toLowerCase()} "${row.name ?? row.id}"?`)) return;
    try {
      await api.delete(`/admin/${resourcePath}/${row.id}`);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(asMsg(e) ?? "Delete failed");
    }
  };

  const goToNew = () => router.push(`/settings/builder/${kind}/new`);
  const goToEdit = (row: T) =>
    router.push(`/settings/builder/${kind}/${row.id}`);

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{pluralLabel}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline">{rows.length}</Badge>
          <Button onClick={goToNew}>
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
            onCta={goToNew}
          />
        ) : (
          <TableRoot>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                {columns.map((c) => (
                  <TableHead
                    key={String(c.key)}
                    className={`text-xs uppercase ${c.className ?? ""}`}>
                    {c.label}
                  </TableHead>
                ))}
                <TableHead className="text-xs uppercase">Enabled</TableHead>
                <TableHead className="text-xs uppercase text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r.id}
                  className="border-border/50 cursor-pointer hover:bg-muted/30"
                  onClick={() => goToEdit(r)}>
                  {columns.map((c) => (
                    <TableCell key={String(c.key)}>
                      {c.render
                        ? c.render(r)
                        : String(
                            (r as unknown as Record<string, unknown>)[
                              c.key as string
                            ] ?? "",
                          )}
                    </TableCell>
                  ))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={!!r.enabled}
                      onCheckedChange={() => toggle(r)}
                    />
                  </TableCell>
                  <TableCell
                    className="text-right space-x-1"
                    onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => goToEdit(r)}
                      title={`Edit ${label.toLowerCase()}`}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => remove(r)}>
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
  );
}

function asMsg(e: unknown): string | undefined {
  return (e as { response?: { data?: { error?: { message?: string } } } })
    ?.response?.data?.error?.message;
}
