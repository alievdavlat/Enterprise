"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Database } from "lucide-react";
import {
  DeleteEntryDialog,
  EditEntryHeader,
  Loading,
} from "@/components/shared";


export function EditEntryClient() {
  const params = useParams();
  const router = useRouter();
  const { contentTypes, fetchContentTypes } = useAppStore();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(true);

  const rawModel = Array.isArray(params.model) ? params.model[0] : params.model;
  const model = rawModel ? decodeURIComponent(rawModel) : "";
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = rawId ?? "";

  const contentType = contentTypes.find((c) => c.uid === model);
  const isNew = id === "new";

  useEffect(() => {
    setSchemaLoading(true);
    fetchContentTypes().finally(() => setSchemaLoading(false));
  }, [fetchContentTypes]);

  useEffect(() => {
    if (!contentType) return;
    if (isNew) {
      setFormData({});
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
        setFormData(res.data.data || {});
      })
      .catch(() => {
        toast.error("Failed to load entry");
        router.push(`/data-manager/${model}`);
      })
      .finally(() => setLoading(false));
  }, [contentType, id, isNew, model, router]);

  const handleSave = async () => {
    if (!contentType) return;
    setSaving(true);
    try {
      const endpoint =
        contentType.kind === "singleType"
          ? `/${contentType.singularName}`
          : `/${contentType.pluralName}`;

      const isCollection = contentType.kind !== "singleType";
      if (isNew && isCollection) {
        await api.post(endpoint, { data: formData });
        toast.success("Entry created");
      } else if (contentType.kind === "singleType") {
        await api.put(endpoint, { data: formData });
        toast.success("Saved");
      } else {
        await api.put(`${endpoint}/${id}`, { data: formData });
        toast.success("Entry updated");
      }
      if (isCollection) {
        router.push(`/data-manager/${model}`);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err?.response?.data?.error?.message ?? "Error saving");
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = () => {
    if (!contentType || isNew) return;
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!contentType) return;
    try {
      await api.delete(`/${contentType.pluralName}/${id}`);
      toast.success("Entry deleted");
      router.push(`/data-manager/${model}`);
    } catch (e) {
      toast.error("Error deleting entry");
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

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

  return (
    <div className="p-8 w-full max-w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      <EditEntryHeader
        model={model}
        contentType={contentType}
        formData={formData}
        setFormData={setFormData}
        requestDelete={requestDelete}
        handleSave={handleSave}
        isNew={isNew}
        saving={saving}
      />

      <DeleteEntryDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={executeDelete}
      />
    </div>
  );
}
