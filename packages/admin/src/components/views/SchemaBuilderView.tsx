"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app";
import { useSchemaBuilderStore } from "@/store/schemaBuilderStore";
import {
  useContentTypesQuery,
  useUpdateContentType,
} from "@/hooks/useContentTypes";
import { useSchemaBuilderActions } from "@/hooks/useSchemaBuilderActions";
import { ConfirmDialog } from "@/components/shared";
import { SCHEMA_BUILDER_SECTIONS } from "@/consts";
import type { SchemaWithCategory } from "@/types/schema-builder";
import {
  SchemaBuilderSidebar,
  SchemaBuilderEmptyState,
  SchemaBuilderHeader,
  SchemaBuilderNewCtDialogWithTrigger,
  SchemaBuilderConfigDialog,
  SchemaBuilderNewFieldDialog,
  SchemaBuilderEditFieldDialog,
  SchemaBuilderFieldsTable,
} from "@/components/shared";

const ALL_SECTIONS = [...SCHEMA_BUILDER_SECTIONS];

export function SchemaBuilderView() {
  const { data: contentTypes = [], refetch: refetchContentTypes } =
    useContentTypesQuery();
  const updateContentType = useUpdateContentType();
  const { fetchContentTypes } = useAppStore();
  const actions = useSchemaBuilderActions();
  const {
    selectedCt,
    fieldTargetSchema,
    isNewCtOpen,
    isNewFieldOpen,
    isEditFieldOpen,
    isConfigOpen,
    confirm,
    openSections,
    expandedCompCategories,
    expandedFields,
    fieldForm,
    editingFieldName,
    ctForm,
    configForm,
    setSelectedCt,
    setNewCtOpen,
    setNewFieldOpen,
    setEditFieldOpen,
    setConfigOpen,
    setConfirm,
    setOpenSections,
    setExpandedCompCategories,
    toggleFieldExpand,
    setExpandedFieldsFromSchema,
    setFieldForm,
    setFieldTargetSchema,
    resetFieldForm,
    openEditField,
    setCtForm,
    setConfigForm,
  } = useSchemaBuilderStore();

  useEffect(() => {
    fetchContentTypes();
  }, [fetchContentTypes]);

  useEffect(() => {
    if (selectedCt?.attributes) {
      setExpandedFieldsFromSchema(selectedCt.attributes);
    }
  }, [selectedCt?.uid, setExpandedFieldsFromSchema]);

  const collectionSchemas = contentTypes.filter(
    (c) => c.kind === "collectionType",
  );
  const singleSchemas = contentTypes.filter((c) => c.kind === "singleType");
  const componentSchemas = contentTypes.filter((c) => c.kind === "component");
  const dynamiczoneSchemas = contentTypes.filter(
    (c) => c.kind === "dynamiczone",
  );

  useEffect(() => {
    const categories = new Map<string, typeof componentSchemas>();
    componentSchemas.forEach((ct) => {
      const cat = (ct as SchemaWithCategory).category || "default";
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(ct);
    });
    const cats = Array.from(categories.keys()).map((c) => `comp-cat-${c}`);
    if (cats.length > 0) {
      const prev = useSchemaBuilderStore.getState().expandedCompCategories;
      const next = new Set(prev);
      cats.forEach((c) => next.add(c));
      setExpandedCompCategories(Array.from(next));
    }
  }, [
    componentSchemas.length,
    componentSchemas.map((c) => c.uid).join(","),
    setExpandedCompCategories,
  ]);

  const existingCategories = Array.from(
    new Set(
      contentTypes
        .filter(
          (c): c is SchemaWithCategory =>
            c.kind === "component" && !!(c as SchemaWithCategory).category,
        )
        .map((c) => c.category as string),
    ),
  );

  const allFieldOptions = selectedCt
    ? [
        "id",
        ...Object.keys(selectedCt.attributes || {}),
        "createdAt",
        "updatedAt",
      ]
    : [];

  return (
    <div className="flex h-full w-full">
      <SchemaBuilderSidebar
        collectionSchemas={collectionSchemas}
        singleSchemas={singleSchemas}
        componentSchemas={componentSchemas as SchemaWithCategory[]}
        dynamiczoneSchemas={dynamiczoneSchemas}
        selectedCt={selectedCt}
        onSelectCt={setSelectedCt}
        openSections={openSections}
        onOpenSectionsChange={setOpenSections}
        expandedCompCategories={expandedCompCategories}
        onExpandedCompCategoriesChange={setExpandedCompCategories}
        allSections={ALL_SECTIONS}
        onCreateComponentClick={() => {
          setCtForm({ ctKind: "component", ctName: "" });
          setNewCtOpen(true);
        }}
        createSchemaButton={
          <SchemaBuilderNewCtDialogWithTrigger
            open={isNewCtOpen}
            onOpenChange={setNewCtOpen}
            ctForm={ctForm}
            setCtForm={setCtForm}
            existingCategories={existingCategories}
            onCreate={actions.handleCreateContentType}
          />
        }
      />

      <div className="flex-1 overflow-y-auto bg-muted/10">
        {selectedCt ? (
          <div className="animate-in fade-in duration-300">
            <SchemaBuilderHeader
              selectedCt={selectedCt}
              onBack={() => setSelectedCt(null)}
              onAddField={() => {
                resetFieldForm();
                setNewFieldOpen(true);
              }}
              onDelete={actions.confirmDeleteContentType}
              onCustomizeLayout={actions.openConfigure}
            />
            <SchemaBuilderConfigDialog
              open={isConfigOpen}
              onOpenChange={setConfigOpen}
              selectedCt={selectedCt}
              configForm={configForm}
              setConfigForm={setConfigForm}
              allFieldOptions={allFieldOptions}
              onSave={actions.handleSaveConfig}
            />
            <SchemaBuilderNewFieldDialog
              open={isNewFieldOpen}
              onOpenChange={(open) => {
                setNewFieldOpen(open);
                if (!open) {
                  resetFieldForm();
                  setFieldTargetSchema(null);
                }
              }}
              fieldForm={fieldForm}
              setFieldForm={setFieldForm}
              contentTypes={contentTypes}
              existingCategories={existingCategories}
              selectedCt={selectedCt}
              fieldTargetSchema={fieldTargetSchema}
              onAddField={actions.handleAddField}
              onAddFirstFieldToComponent={
                actions.handleAddFirstFieldToComponent
              }
            />
            <SchemaBuilderEditFieldDialog
              open={isEditFieldOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setEditFieldOpen(false);
                  resetFieldForm();
                }
              }}
              fieldForm={fieldForm}
              setFieldForm={setFieldForm}
              contentTypes={contentTypes}
              selectedCt={selectedCt}
              editingFieldName={editingFieldName}
              onSave={actions.handleSaveField}
              onClose={() => {
                setEditFieldOpen(false);
                resetFieldForm();
              }}
            />
            <SchemaBuilderFieldsTable
              selectedCt={selectedCt}
              contentTypes={contentTypes}
              expandedFields={expandedFields}
              toggleFieldExpand={toggleFieldExpand}
              openEditField={openEditField}
              confirmDeleteField={actions.confirmDeleteField}
              setFieldTargetSchema={setFieldTargetSchema}
              resetFieldForm={resetFieldForm}
              setFieldForm={setFieldForm}
              setNewFieldOpen={setNewFieldOpen}
              updateContentTypeAsync={updateContentType.mutateAsync}
              refetchContentTypes={refetchContentTypes}
              fetchContentTypes={fetchContentTypes}
              setSelectedCt={setSelectedCt}
            />
          </div>
        ) : (
          <SchemaBuilderEmptyState onOpenNewSchema={() => setNewCtOpen(true)} />
        )}
      </div>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(open) => setConfirm({ open })}
        title={confirm.title}
        description={confirm.description}
        onConfirm={() => {
          confirm.action?.();
          setConfirm({ open: false });
        }}
      />
    </div>
  );
}
