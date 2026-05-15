"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Database } from "lucide-react";
import {
  DeleteEntryDialog,
  EditEntryHeader,
  EntryBreadcrumbs,
  EntryStickyBar,
  Loading,
  UnsavedChangesDialog,
} from "@/components/shared";

const ENTRY_LABEL_KEYS = ["title", "name", "label", "slug", "subject"];

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.keys(v as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = (v as Record<string, unknown>)[k];
          return acc;
        }, {});
    }
    return v;
  });
}

function pickEntryLabel(data: Record<string, unknown>): string | undefined {
  for (const key of ENTRY_LABEL_KEYS) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function EditEntryClient() {
  const params = useParams();
  const router = useRouter();
  const { contentTypes, fetchContentTypes } = useAppStore();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [baselineKey, setBaselineKey] = useState<string>("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const pendingNavRef = useRef<string | null>(null);

  const rawModel = Array.isArray(params.model) ? params.model[0] : params.model;
  const model = rawModel ? decodeURIComponent(rawModel) : "";
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = rawId ?? "";

  const contentType = contentTypes.find((c) => c.uid === model);
  const isNew = id === "new";

  const currentKey = useMemo(() => stableStringify(formData), [formData]);
  const isDirty = currentKey !== baselineKey;

  const shortcutLabel = useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl";
    return /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl";
  }, []);

  useEffect(() => {
    setSchemaLoading(true);
    fetchContentTypes().finally(() => setSchemaLoading(false));
  }, [fetchContentTypes]);

  useEffect(() => {
    if (!contentType) return;
    if (isNew) {
      setFormData({});
      setBaselineKey(stableStringify({}));
      setLoading(false);
      return;
    }
    setLoading(true);
    const endpoint =
      contentType.kind === "singleType"
        ? `/${contentType.singularName}`
        : `/${contentType.pluralName}`;
    api
      .get(`${endpoint}/${id}`)
      .then((res) => {
        const data = res.data.data || {};
        setFormData(data);
        setBaselineKey(stableStringify(data));
      })
      .catch(() => {
        toast.error("Failed to load entry");
        router.push(`/data-manager/${model}`);
      })
      .finally(() => setLoading(false));
  }, [contentType, id, isNew, model, router]);

  const handleSave = useCallback(async () => {
    if (!contentType || saving) return;
    setSaving(true);
    try {
      const endpoint =
        contentType.kind === "singleType"
          ? `/${contentType.singularName}`
          : `/${contentType.pluralName}`;

      const isCollection = contentType.kind !== "singleType";
      let nextData: Record<string, unknown> = formData;
      if (isNew && isCollection) {
        const res = await api.post(endpoint, { data: formData });
        nextData = res.data?.data ?? formData;
        toast.success("Entry created");
      } else if (contentType.kind === "singleType") {
        const res = await api.put(endpoint, { data: formData });
        nextData = res.data?.data ?? formData;
        toast.success("Saved");
      } else {
        const res = await api.put(`${endpoint}/${id}`, { data: formData });
        nextData = res.data?.data ?? formData;
        toast.success("Entry updated");
      }
      setBaselineKey(stableStringify(nextData));
      if (isCollection) {
        router.push(`/data-manager/${model}`);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err?.response?.data?.error?.message ?? "Error saving");
    } finally {
      setSaving(false);
    }
  }, [contentType, formData, id, isNew, model, router, saving]);

  const attemptNavigate = useCallback(
    (href: string) => {
      if (isDirty && !saving) {
        pendingNavRef.current = href;
        setUnsavedOpen(true);
        return;
      }
      router.push(href);
    },
    [isDirty, router, saving],
  );

  const handleDiscard = useCallback(() => {
    if (isDirty) {
      pendingNavRef.current = `/data-manager/${model}`;
      setUnsavedOpen(true);
      return;
    }
    router.push(`/data-manager/${model}`);
  }, [isDirty, model, router]);

  const confirmDiscard = useCallback(() => {
    setUnsavedOpen(false);
    const target = pendingNavRef.current;
    pendingNavRef.current = null;
    if (target) router.push(target);
  }, [router]);

  const requestDelete = useCallback(() => {
    if (!contentType || isNew) return;
    setDeleteConfirmOpen(true);
  }, [contentType, isNew]);

  const executeDelete = async () => {
    if (!contentType) return;
    setDeleting(true);
    try {
      await api.delete(`/${contentType.pluralName}/${id}`);
      setBaselineKey(currentKey); // suppress dirty guard on the resulting navigation
      toast.success("Entry deleted");
      router.push(`/data-manager/${model}`);
    } catch {
      toast.error("Error deleting entry");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isSave = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s";
      if (!isSave) return;
      e.preventDefault();
      if (contentType && (isDirty || isNew) && !saving) {
        void handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [contentType, handleSave, isDirty, isNew, saving]);

  if (!contentType) {
    if (schemaLoading) return <Loading />;

    return (
      <div className="p-8 flex flex-col items-center justify-center gap-6 text-center h-full animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Database className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-semibold">Content schema not found</p>
          <p className="text-sm text-muted-foreground">
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

  if (contentType.kind === "singleType") {
    router.replace(`/data-manager/${model}`);
    return null;
  }

  if (loading) return <Loading />;

  const entryLabel = pickEntryLabel(formData);

  return (
    <div className="p-8 w-full max-w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      <EntryBreadcrumbs
        contentType={contentType}
        isNew={isNew}
        entryLabel={entryLabel}
        onNavigate={attemptNavigate}
      />

      <EditEntryHeader
        model={model}
        contentType={contentType}
        formData={formData}
        setFormData={setFormData}
        requestDelete={requestDelete}
        isNew={isNew}
      />

      <EntryStickyBar
        isNew={isNew}
        isDirty={isDirty}
        saving={saving}
        shortcutLabel={shortcutLabel}
        onSave={handleSave}
        onDiscard={handleDiscard}
        onDelete={!isNew ? requestDelete : undefined}
      />

      <DeleteEntryDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => !deleting && setDeleteConfirmOpen(open)}
        onConfirm={executeDelete}
        loading={deleting}
      />

      <UnsavedChangesDialog
        open={unsavedOpen}
        onOpenChange={(open) => {
          setUnsavedOpen(open);
          if (!open) pendingNavRef.current = null;
        }}
        onDiscard={confirmDiscard}
      />
    </div>
  );
}
