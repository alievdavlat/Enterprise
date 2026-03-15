"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app";
import { useSchemaBuilderStore } from "@/store/schemaBuilderStore";
import {
  useContentTypesQuery,
  useCreateContentType,
  useUpdateContentType,
  useDeleteContentType,
} from "@/hooks/useContentTypes";
import { buildCreateSchemaPayload, buildComponentSchemaPayload } from "@/helpers/schema-builder";
import { buildFieldDefFromForm } from "@/helpers/schema-builder/fieldDef";
import type { ContentTypeSchema, ContentTypeAttributeConfig } from "@/types";
import type { SchemaWithViewConfig } from "@/types/schema-builder";

export function useSchemaBuilderActions() {
  const { refetch: refetchContentTypes } = useContentTypesQuery();
  const { fetchContentTypes } = useAppStore();
  const createContentType = useCreateContentType();
  const updateContentType = useUpdateContentType();
  const deleteContentType = useDeleteContentType();

  const {
    selectedCt,
    fieldTargetSchema,
    fieldForm,
    ctForm,
    configForm,
    setSelectedCt,
    setFieldTargetSchema,
    setNewCtOpen,
    setNewFieldOpen,
    setEditFieldOpen,
    setConfigOpen,
    setConfirm,
    resetFieldForm,
  } = useSchemaBuilderStore();

  const handleCreateContentType = useCallback(async () => {
    if (!ctForm.ctName) return;
    try {
      const payload = buildCreateSchemaPayload({
        ctName: ctForm.ctName,
        ctKind: ctForm.ctKind,
        compNewCategory: ctForm.compNewCategory,
        ctDraft: ctForm.ctDraft,
      });
      await createContentType.mutateAsync(payload);
      toast.success("Content Schema created");
      setNewCtOpen(false);
      useSchemaBuilderStore.setState({ ctForm: { ...ctForm, compNewCategory: "" } });
      refetchContentTypes();
      fetchContentTypes();
      setSelectedCt(payload as unknown as ContentTypeSchema);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message ?? "Error creating content schema");
    }
  }, [ctForm, createContentType, refetchContentTypes, fetchContentTypes, setSelectedCt, setNewCtOpen]);

  const handleSaveField = useCallback(async () => {
    const editingFieldName = useSchemaBuilderStore.getState().editingFieldName;
    if (!selectedCt || !editingFieldName) return;
    try {
      const updatedCt = { ...selectedCt };
      const fieldDef = buildFieldDefFromForm(fieldForm);
      const newAttrs = { ...updatedCt.attributes };
      if (fieldForm.fieldName !== editingFieldName) {
        delete newAttrs[editingFieldName];
      }
      newAttrs[fieldForm.fieldName] = fieldDef;
      updatedCt.attributes = newAttrs as Record<string, ContentTypeAttributeConfig>;
      await updateContentType.mutateAsync({ uid: selectedCt.uid, data: updatedCt });
      toast.success(`Field "${fieldForm.fieldName}" saved`);
      refetchContentTypes();
      fetchContentTypes();
      setSelectedCt(updatedCt);
      setEditFieldOpen(false);
      resetFieldForm();
    } catch (e) {
      toast.error("Error saving field");
    }
  }, [selectedCt, fieldForm, updateContentType, refetchContentTypes, fetchContentTypes, setSelectedCt, setEditFieldOpen, resetFieldForm]);

  const handleAddFirstFieldToComponent = useCallback(async () => {
    if (!selectedCt || !fieldForm.fieldName || !fieldForm.compNewDisplayName) return;
    try {
      const compPayload = buildComponentSchemaPayload({
        displayName: fieldForm.compNewDisplayName,
        category: fieldForm.compNewCategory || "default",
      });
      await createContentType.mutateAsync(compPayload);
      const updatedCt = { ...selectedCt };
      const fieldDef: ContentTypeAttributeConfig =
        fieldForm.fieldType === "dynamiczone"
          ? { type: "dynamiczone", components: [compPayload.uid] }
          : { type: "component", component: compPayload.uid, repeatable: fieldForm.fieldRepeatable };
      updatedCt.attributes = { ...updatedCt.attributes, [fieldForm.fieldName]: fieldDef };
      await updateContentType.mutateAsync({ uid: selectedCt.uid, data: updatedCt });
      refetchContentTypes();
      fetchContentTypes();
      const list = useAppStore.getState().contentTypes;
      const comp = list.find((ct) => ct.uid === compPayload.uid);
      if (comp) {
        setSelectedCt(comp);
        resetFieldForm();
        setNewFieldOpen(true);
      } else {
        setNewFieldOpen(false);
        setSelectedCt(updatedCt);
        resetFieldForm();
      }
      toast.success(`Component "${fieldForm.compNewDisplayName}" created. Add its first field below.`);
    } catch (e) {
      toast.error("Error creating component");
    }
  }, [selectedCt, fieldForm, createContentType, updateContentType, refetchContentTypes, fetchContentTypes, setSelectedCt, resetFieldForm, setNewFieldOpen]);

  const handleAddField = useCallback(
    async (andAddAnother: boolean) => {
      const target = fieldTargetSchema || selectedCt;
      if (!target || !fieldForm.fieldName) return;
      try {
        const updatedCt = { ...target };
        let fieldDef = buildFieldDefFromForm(fieldForm);
        if (fieldForm.fieldType === "component" && fieldForm.compCreateMode === "create" && fieldForm.compNewDisplayName) {
          const compPayload = buildComponentSchemaPayload({
            displayName: fieldForm.compNewDisplayName,
            category: fieldForm.compNewCategory || "default",
          });
          await createContentType.mutateAsync(compPayload);
          fieldDef = { ...fieldDef, component: compPayload.uid };
        }
        if (fieldForm.fieldType === "dynamiczone" && fieldForm.compCreateMode === "create" && fieldForm.compNewDisplayName) {
          const compPayload = buildComponentSchemaPayload({
            displayName: fieldForm.compNewDisplayName,
            category: fieldForm.compNewCategory || "default",
          });
          await createContentType.mutateAsync(compPayload);
          fieldDef = { ...fieldDef, components: [compPayload.uid] };
        }
        updatedCt.attributes = {
          ...updatedCt.attributes,
          [fieldForm.fieldName]: fieldDef,
        } as Record<string, ContentTypeAttributeConfig>;
        await updateContentType.mutateAsync({ uid: target.uid, data: updatedCt });
        toast.success(`Field "${fieldForm.fieldName}" added`);
        refetchContentTypes();
        fetchContentTypes();
        if (fieldTargetSchema) setFieldTargetSchema(updatedCt);
        if (!fieldTargetSchema || selectedCt?.uid === target.uid) setSelectedCt(updatedCt);
        if (andAddAnother) resetFieldForm();
        else {
          setNewFieldOpen(false);
          resetFieldForm();
        }
      } catch (e) {
        toast.error("Error adding field");
      }
    },
    [
      fieldTargetSchema,
      selectedCt,
      fieldForm,
      createContentType,
      updateContentType,
      refetchContentTypes,
      fetchContentTypes,
      setFieldTargetSchema,
      setSelectedCt,
      setNewFieldOpen,
      resetFieldForm,
    ],
  );

  const openConfigure = useCallback((ct: SchemaWithViewConfig) => {
    useSchemaBuilderStore.setState({
      configForm: {
        cfgDisplayName: ct.displayName || "",
        cfgSingularName: ct.singularName || "",
        cfgPluralName: ct.pluralName || "",
        cfgDraft: ct.draftAndPublish ?? true,
        cfgEntryTitle: ct.viewConfig?.entryTitle || Object.keys(ct.attributes || {})[0] || "id",
        cfgDisplayedFields: ct.viewConfig?.displayedFields || Object.keys(ct.attributes || {}),
      },
      isConfigOpen: true,
    });
  }, []);

  const handleSaveConfig = useCallback(async () => {
    if (!selectedCt) return;
    try {
      const updated = {
        ...selectedCt,
        displayName: configForm.cfgDisplayName,
        singularName: configForm.cfgSingularName,
        pluralName: configForm.cfgPluralName,
        draftAndPublish: configForm.cfgDraft,
        viewConfig: {
          entryTitle: configForm.cfgEntryTitle,
          displayedFields: configForm.cfgDisplayedFields,
        },
      };
      await updateContentType.mutateAsync({ uid: selectedCt.uid, data: updated });
      toast.success("Layout saved");
      setConfigOpen(false);
      refetchContentTypes();
      fetchContentTypes();
      setSelectedCt(updated);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message ?? "Error saving configuration");
    }
  }, [selectedCt, configForm, updateContentType, refetchContentTypes, fetchContentTypes, setSelectedCt, setConfigOpen]);

  const executeDeleteField = useCallback(
    async (fieldNameToDelete: string) => {
      if (!selectedCt) return;
      try {
        const updatedCt = { ...selectedCt };
        const newAttrs = { ...updatedCt.attributes };
        delete newAttrs[fieldNameToDelete];
        updatedCt.attributes = newAttrs as Record<string, ContentTypeAttributeConfig>;
        await updateContentType.mutateAsync({ uid: selectedCt.uid, data: updatedCt });
        toast.success(`Field "${fieldNameToDelete}" deleted`);
        refetchContentTypes();
        fetchContentTypes();
        setSelectedCt(updatedCt);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: { message?: string } } } };
        toast.error(err.response?.data?.error?.message ?? "Error deleting field");
      }
    },
    [selectedCt, updateContentType, refetchContentTypes, fetchContentTypes, setSelectedCt],
  );

  const confirmDeleteField = useCallback(
    (fieldNameToDelete: string) => {
      setConfirm({
        open: true,
        title: "Delete field",
        description: `Are you sure you want to delete the field "${fieldNameToDelete}"? This action cannot be undone.`,
        action: () => executeDeleteField(fieldNameToDelete),
      });
    },
    [setConfirm, executeDeleteField],
  );

  const executeDeleteContentType = useCallback(
    async (ct: ContentTypeSchema) => {
      try {
        await deleteContentType.mutateAsync(ct.uid);
        toast.success(`"${ct.displayName}" deleted`);
        if (selectedCt?.uid === ct.uid) setSelectedCt(null);
        refetchContentTypes();
        fetchContentTypes();
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: { message?: string } } } };
        toast.error(err.response?.data?.error?.message ?? "Error deleting content schema");
      }
    },
    [selectedCt, deleteContentType, refetchContentTypes, fetchContentTypes, setSelectedCt],
  );

  const confirmDeleteContentType = useCallback(
    (ct: ContentTypeSchema) => {
      setConfirm({
        open: true,
        title: `Delete "${ct.displayName}"`,
        description:
          "This will permanently remove the content schema AND all its data. This action cannot be undone.",
        action: () => executeDeleteContentType(ct),
      });
    },
    [setConfirm, executeDeleteContentType],
  );

  return {
    handleCreateContentType,
    handleSaveField,
    handleAddFirstFieldToComponent,
    handleAddField,
    openConfigure,
    handleSaveConfig,
    confirmDeleteField,
    executeDeleteField,
    confirmDeleteContentType,
    executeDeleteContentType,
  };
}
