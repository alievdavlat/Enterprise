import { create } from "zustand";
import type { ContentTypeSchema, ContentTypeAttributeConfig } from "@/types";
import type { SchemaWithCategory, FieldFormState } from "@/types/schema-builder";
import { DEFAULT_FIELD_FORM } from "@/types/schema-builder";
import { SCHEMA_BUILDER_SECTIONS } from "@/consts";

type SchemaBuilderCt = ContentTypeSchema | SchemaWithCategory | null;

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  action: (() => void) | null;
}

interface SchemaBuilderState {
  selectedCt: SchemaBuilderCt;
  fieldTargetSchema: SchemaBuilderCt;
  isNewCtOpen: boolean;
  isNewFieldOpen: boolean;
  isEditFieldOpen: boolean;
  isConfigOpen: boolean;
  confirm: ConfirmState;
  openSections: string[];
  expandedCompCategories: string[];
  expandedFields: Set<string>;
  fieldForm: FieldFormState;
  editingFieldName: string | null;
  ctForm: {
    ctName: string;
    ctKind: string;
    ctDraft: boolean;
    compNewCategory: string;
  };
  configForm: {
    cfgDisplayName: string;
    cfgSingularName: string;
    cfgPluralName: string;
    cfgDraft: boolean;
    cfgEntryTitle: string;
    cfgDisplayedFields: string[];
  };
  setSelectedCt: (ct: SchemaBuilderCt) => void;
  setFieldTargetSchema: (ct: SchemaBuilderCt) => void;
  setNewCtOpen: (open: boolean) => void;
  setNewFieldOpen: (open: boolean) => void;
  setEditFieldOpen: (open: boolean) => void;
  setConfigOpen: (open: boolean) => void;
  setConfirm: (c: Partial<ConfirmState>) => void;
  setOpenSections: (v: string[]) => void;
  setExpandedCompCategories: (v: string[]) => void;
  toggleFieldExpand: (name: string) => void;
  setExpandedFieldsFromSchema: (attrs: Record<string, ContentTypeAttributeConfig> | undefined) => void;
  setFieldForm: (u: Partial<FieldFormState> | ((prev: FieldFormState) => FieldFormState)) => void;
  setEditingFieldName: (name: string | null) => void;
  setCtForm: (u: Partial<SchemaBuilderState["ctForm"]>) => void;
  setConfigForm: (u: Partial<SchemaBuilderState["configForm"]>) => void;
  resetFieldForm: () => void;
  openEditField: (name: string, config: ContentTypeAttributeConfig) => void;
}

const ALL_SECTIONS = [...SCHEMA_BUILDER_SECTIONS];

export const useSchemaBuilderStore = create<SchemaBuilderState>((set) => ({
  selectedCt: null,
  fieldTargetSchema: null,
  isNewCtOpen: false,
  isNewFieldOpen: false,
  isEditFieldOpen: false,
  isConfigOpen: false,
  confirm: { open: false, title: "", description: "", action: null },
  openSections: ALL_SECTIONS,
  expandedCompCategories: [],
  expandedFields: new Set(),
  fieldForm: DEFAULT_FIELD_FORM,
  editingFieldName: null,
  ctForm: {
    ctName: "",
    ctKind: "collectionType",
    ctDraft: true,
    compNewCategory: "",
  },
  configForm: {
    cfgDisplayName: "",
    cfgSingularName: "",
    cfgPluralName: "",
    cfgDraft: true,
    cfgEntryTitle: "",
    cfgDisplayedFields: [],
  },
  setSelectedCt: (selectedCt) => set({ selectedCt }),
  setFieldTargetSchema: (fieldTargetSchema) => set({ fieldTargetSchema }),
  setNewCtOpen: (isNewCtOpen) => set({ isNewCtOpen }),
  setNewFieldOpen: (isNewFieldOpen) => set({ isNewFieldOpen }),
  setEditFieldOpen: (isEditFieldOpen) => set({ isEditFieldOpen }),
  setConfigOpen: (isConfigOpen) => set({ isConfigOpen }),
  setConfirm: (c) =>
    set((s) => ({
      confirm: { ...s.confirm, ...c },
    })),
  setOpenSections: (openSections) => set({ openSections }),
  setExpandedCompCategories: (expandedCompCategories) =>
    set({ expandedCompCategories }),
  toggleFieldExpand: (name) =>
    set((s) => {
      const next = new Set(s.expandedFields);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { expandedFields: next };
    }),
  setExpandedFieldsFromSchema: (attrs) => {
    if (!attrs) return;
    const expandable = Object.entries(attrs)
      .filter(
        ([, config]) =>
          config.type === "component" || config.type === "dynamiczone",
      )
      .map(([name]) => name);
    set({ expandedFields: new Set(expandable) });
  },
  setFieldForm: (u) =>
    set((s) => ({
      fieldForm:
        typeof u === "function" ? u(s.fieldForm) : { ...s.fieldForm, ...u },
    })),
  setEditingFieldName: (editingFieldName) => set({ editingFieldName }),
  setCtForm: (u) =>
    set((s) => ({ ctForm: { ...s.ctForm, ...u } })),
  setConfigForm: (u) =>
    set((s) => ({ configForm: { ...s.configForm, ...u } })),
  resetFieldForm: () =>
    set({
      fieldForm: DEFAULT_FIELD_FORM,
      editingFieldName: null,
      fieldTargetSchema: null,
    }),
  openEditField: (name, config) => {
    const baseType = ["text", "richtext"].includes(config.type)
      ? config.type
      : ["float", "decimal", "biginteger"].includes(config.type)
        ? "integer"
        : ["datetime", "time"].includes(config.type)
          ? "date"
          : config.type;
    set({
      editingFieldName: name,
      isEditFieldOpen: true,
      fieldForm: {
        ...DEFAULT_FIELD_FORM,
        fieldName: name,
        fieldType: baseType,
        fieldTextType: config.type === "text" ? "long" : "short",
        fieldNumberFormat: ["float", "decimal", "biginteger", "integer"].includes(config.type)
          ? config.type
          : "integer",
        fieldDateType: ["date", "datetime", "time"].includes(config.type)
          ? config.type
          : "date",
        fieldRequired: (config.required as boolean) ?? false,
        fieldUnique: (config.unique as boolean) ?? false,
        fieldPrivate: (config.private as boolean) ?? false,
        fieldDefaultValue: String(config.default ?? ""),
        fieldRegex: String(config.regex ?? ""),
        fieldMaxLength: config.maxLength != null ? String(config.maxLength) : "",
        fieldMinLength: config.minLength != null ? String(config.minLength) : "",
        enumValues: Array.isArray(config.enum) ? config.enum.join("\n") : "",
        fieldTarget: String(config.target ?? ""),
        fieldRelationType: (config.relation as "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany") ?? "oneToMany",
        fieldMediaMultiple: (config.multiple as boolean) ?? false,
        fieldMediaAllowedTypes: Array.isArray(config.allowedTypes) ? config.allowedTypes : [],
        fieldComponent: String(config.component ?? ""),
        fieldRepeatable: (config.repeatable as boolean) ?? false,
        fieldComponents: Array.isArray(config.components) ? config.components : [],
      },
    });
  },
}));
