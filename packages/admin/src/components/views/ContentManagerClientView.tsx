"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@enterprise/design-system";
import {
  Pencil,
  Trash2,
  Database,
  CheckCircle2,
  Circle,
  ImageIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { ColumnDef } from "@enterprise/design-system/table";
import { Checkbox } from "@enterprise/design-system";
import { ArrowUpDown } from "lucide-react";
import {
  DataManagerHeader,
  ModelContent,
  DeleteEntryDialog,
  Loading,
} from "@/components/shared";
import { EXCLUDED_TYPES, DEFAULT_VISIBLE_COUNT } from "@/consts";
import { getImageUrl } from "@/utils/media";

type ContentRow = Record<string, unknown>;

export function ContentManagerClient() {
  const params = useParams();
  const router = useRouter();
  const { contentTypes, fetchContentTypes } = useAppStore();
  const [data, setData] = useState<ContentRow[]>([]);
  const [meta, setMeta] = useState<{
    pagination?: { page?: number; pageCount?: number; total?: number };
  }>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const rawModel = Array.isArray(params.model) ? params.model[0] : params.model;
  const model = rawModel ? decodeURIComponent(rawModel) : "";
  const contentType = contentTypes.find((c) => c.uid === model);

  useEffect(() => {
    setSchemaLoading(true);
    fetchContentTypes().finally(() => setSchemaLoading(false));
  }, [fetchContentTypes]);

  const fetchData = async () => {
    if (!contentType) return;
    setLoading(true);
    try {
      const endpoint =
        contentType.kind === "singleType"
          ? `/${contentType.singularName}`
          : `/${contentType.pluralName}`;
      const isCollection = contentType.kind !== "singleType";
      const res = isCollection
        ? await api.get(endpoint, { params: { page, pageSize } })
        : await api.get(endpoint);
      if (!isCollection) {
        setData(res.data.data ? [res.data.data] : []);
        setFormData(res.data.data || {});
      } else {
        setData(res.data.data || []);
        setMeta(res.data.meta || {});
      }
    } catch (e) {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contentType, page]);

  const handleSave = async () => {
    if (!contentType) return;
    try {
      const endpoint =
        contentType.kind === "singleType"
          ? `/${contentType.singularName}`
          : `/${contentType.pluralName}`;
      if (contentType.kind === "singleType") {
        await api.put(endpoint, { data: formData });
        toast.success("Entry saved successfully");
      } else {
        await api.post(endpoint, { data: formData });
        toast.success("Entry created successfully");
      }
      fetchData();
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.error(err?.response?.data?.error?.message ?? "Error saving entry");
    }
  };

  const requestDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!contentType || !deleteTargetId) return;
    try {
      await api.delete(`/${contentType.pluralName}/${deleteTargetId}`);
      toast.success("Entry deleted");
      fetchData();
    } catch (e) {
      toast.error("Error deleting entry");
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    }
  };

  const goToEdit = (item: ContentRow) => {
    router.push(`/data-manager/${model}/${item.id}`);
  };

  const mainColumnKeys = React.useMemo(() => {
    if (!contentType) return ["id"];
    const main = Object.entries(contentType.attributes)
      .filter(([, config]) => !EXCLUDED_TYPES.includes(config.type))
      .map(([k]) => k);
    return ["id", ...main, "createdAt", "updatedAt"];
  }, [contentType?.uid, contentType?.attributes]);

  const COLUMN_STORAGE_KEY = (m: string) => `data-manager-columns-${m}`;

  const initialColumnVisibility = React.useMemo(() => {
    if (!model) return {};
    try {
      const stored = localStorage.getItem(COLUMN_STORAGE_KEY(model));
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, boolean>;
        if (typeof parsed === "object" && parsed !== null) return parsed;
      }
    } catch {}
    const vis: Record<string, boolean> = {};
    mainColumnKeys.forEach((k, i) => {
      vis[k] = i < DEFAULT_VISIBLE_COUNT;
    });
    return vis;
  }, [model, mainColumnKeys.join(",")]);

  const handleColumnVisibilityChange = React.useCallback(
    (visibility: Record<string, boolean>) => {
      if (!model) return;
      try {
        localStorage.setItem(
          COLUMN_STORAGE_KEY(model),
          JSON.stringify(visibility),
        );
      } catch {}
    },
    [model],
  );

  const columns = React.useMemo<ColumnDef<ContentRow, unknown>[]>(() => {
    if (!contentType) return [];
    const cols: ColumnDef<ContentRow, unknown>[] = [];
    cols.push({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    });
    mainColumnKeys.forEach((key) => {
      cols.push({
        accessorKey: key,
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="px-0 font-semibold"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }>
            <span className="truncate max-w-[160px] text-left">{key}</span>
            <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
          </Button>
        ),
        cell: ({ row, getValue }) => {
          const value = getValue() as unknown;
          const attrConfig = contentType.attributes[key as string];
          const isMedia = attrConfig?.type === "media";

          if (key === "id") {
            return (
              <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {value != null ? String(value) : "—"}
              </span>
            );
          }
          if (typeof value === "boolean") {
            return value ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4 text-muted-foreground/30" />
            );
          }
          if (isMedia && value != null && value !== "") {
            const items = Array.isArray(value) ? value : [value];
            const withUrl = items.filter(
              (v): v is Record<string, unknown> =>
                typeof v === "object" &&
                v !== null &&
                "url" in v &&
                typeof (v as { url?: string }).url === "string",
            );
            if (withUrl.length > 0) {
              return (
                <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                  {withUrl.slice(0, 3).map((item, i) => (
                    <img
                      key={i}
                      src={getImageUrl((item as { url: string }).url)}
                      alt=""
                      className="w-8 h-8 rounded object-cover border border-border shrink-0"
                    />
                  ))}
                  {withUrl.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{withUrl.length - 3}
                    </span>
                  )}
                </div>
              );
            }
            return (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <ImageIcon className="w-4 h-4" />
                <span className="text-xs">
                  {Array.isArray(value) ? value.length : 1}
                </span>
              </span>
            );
          }
          let display = "—";
          if (value != null && value !== "") {
            if (typeof value === "object" && value !== null) {
              const obj = value as Record<string, unknown>;
              display = String(
                obj?.id ?? obj?.title ?? JSON.stringify(value).slice(0, 50),
              );
            } else {
              display = String(value);
            }
          }
          return (
            <span className="text-sm truncate max-w-[240px] block">
              {display}
            </span>
          );
        },
      });
    });
    cols.push({
      id: "actions",
      header: () => (
        <span className="inline-flex justify-end w-full font-semibold">
          Actions
        </span>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-end gap-1 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                goToEdit(item);
              }}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground cursor-pointer hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                requestDelete(String(item?.id ?? ""));
              }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    });
    return cols;
  }, [mainColumnKeys, contentType?.uid]);

  const defaultSearchColumnId =
    mainColumnKeys.find(
      (key) => key !== "id" && key !== "createdAt" && key !== "updatedAt",
    ) ??
    mainColumnKeys[1] ??
    "id";

  if (!contentType) {
    if (schemaLoading) {
      return <Loading />;
    }

    return (
      <div className="p-8 flex flex-col items-center justify-center gap-6 text-center h-full animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Database className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">Content schema not found</p>
          <p className="text-sm max-w-md text-muted-foreground">
            No schema matches{" "}
            <code className="font-mono bg-muted px-2 py-0.5 rounded text-xs">
              {model}
            </code>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col bg-gradient-to-b from-muted/10 to-transparent animate-in fade-in duration-500">
      <DeleteEntryDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={executeDelete}
      />
      <DataManagerHeader contentType={contentType} model={model} />
      <ModelContent
        contentType={contentType}
        model={model}
        columns={columns}
        data={data}
        loading={loading}
        defaultSearchColumnId={defaultSearchColumnId}
        formData={formData}
        meta={meta}
        initialColumnVisibility={initialColumnVisibility}
        handleColumnVisibilityChange={handleColumnVisibilityChange}
        setPage={setPage}
        setFormData={setFormData}
        handleSave={handleSave}
      />
    </div>
  );
}
