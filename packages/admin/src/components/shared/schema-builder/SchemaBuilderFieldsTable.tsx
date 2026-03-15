"use client";

import { ChevronDown, Layers, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { FIELD_TYPES } from "@/consts";
import type { ContentTypeSchema, ContentTypeAttributeConfig } from "@/types";
import type { FieldFormState } from "@/types/schema-builder";

export interface SchemaBuilderFieldsTableProps {
  selectedCt: ContentTypeSchema | null;
  contentTypes: ContentTypeSchema[];
  expandedFields: Set<string>;
  toggleFieldExpand: (name: string) => void;
  openEditField: (name: string, config: ContentTypeAttributeConfig) => void;
  confirmDeleteField: (name: string) => void;
  setFieldTargetSchema: (ct: ContentTypeSchema | null) => void;
  resetFieldForm: () => void;
  setFieldForm: (u: Partial<FieldFormState> | ((prev: FieldFormState) => FieldFormState)) => void;
  setNewFieldOpen: (open: boolean) => void;
  updateContentTypeAsync: (args: {
    uid: string;
    data: Partial<ContentTypeSchema> & Record<string, unknown>;
  }) => Promise<unknown>;
  refetchContentTypes: () => void;
  fetchContentTypes: () => void;
  setSelectedCt: (ct: ContentTypeSchema | null) => void;
}

export function SchemaBuilderFieldsTable({
  selectedCt,
  contentTypes,
  expandedFields,
  toggleFieldExpand,
  openEditField,
  confirmDeleteField,
  setFieldTargetSchema,
  resetFieldForm,
  setFieldForm,
  setNewFieldOpen,
  updateContentTypeAsync,
  refetchContentTypes,
  fetchContentTypes,
  setSelectedCt,
}: SchemaBuilderFieldsTableProps) {
  if (!selectedCt?.attributes) return null;

  return (
    <div className="px-8 py-6">
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="grid grid-cols-[1fr_200px_100px] border-b border-border bg-muted/40 px-5 py-3.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span>Name</span>
          <span>Type</span>
          <span className="text-right">Actions</span>
        </div>

        {Object.entries(selectedCt.attributes).map(
          ([name, config]: [string, ContentTypeAttributeConfig]) => {
            const fieldDef =
              FIELD_TYPES.find((f) => f.id === config.type) || FIELD_TYPES[0];
            const Icon = fieldDef.icon;
            const isComponent = config.type === "component";
            const isDynamicZone = config.type === "dynamiczone";
            const isExpandable = isComponent || isDynamicZone;
            const isExpanded = expandedFields.has(name);
            const compSchema =
              isComponent && config.component
                ? contentTypes.find((c) => c.uid === config.component)
                : null;
            const dzComponents =
              isDynamicZone && config.components
                ? (config.components as string[])
                    .map((uid) => contentTypes.find((c) => c.uid === uid))
                    .filter(Boolean) as ContentTypeSchema[]
                : [];

            return (
              <div key={name}>
                <div
                  className={`grid grid-cols-[1fr_200px_100px] items-center px-5 py-3.5 border-b border-border/50 hover:bg-muted/20 transition-colors group ${isExpandable ? "cursor-pointer" : ""}`}
                  onClick={() =>
                    isExpandable && toggleFieldExpand(name)
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isExpandable && (
                      <button
                        className="p-0.5 -ml-1 rounded transition-transform duration-200"
                        style={{
                          transform: isExpanded
                            ? "rotate(0deg)"
                            : "rotate(-90deg)",
                        }}
                      >
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${fieldDef.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm truncate">{name}</span>
                    {Boolean(config.required) && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive px-1.5 py-0.5 rounded shrink-0">
                        Required
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground capitalize">
                    {fieldDef.name}
                    {isComponent && config.component ? (
                      <span className="text-xs ml-1 opacity-70">
                        → {compSchema?.displayName || String(config.component)}
                        {config.repeatable ? " (repeatable)" : ""}
                      </span>
                    ) : null}
                    {isDynamicZone && dzComponents.length > 0 ? (
                      <span className="text-xs ml-1 opacity-70">
                        ({dzComponents.length} component
                        {dzComponents.length > 1 ? "s" : ""})
                      </span>
                    ) : null}
                  </span>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditField(name, config);
                      }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit field"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteField(name);
                      }}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isComponent && isExpanded && compSchema && (
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in"
                    style={{
                      borderBottom:
                        "1px solid hsl(var(--border) / 0.5)",
                    }}
                  >
                    <div className="ml-8 relative">
                      <div className="absolute left-5 top-0 bottom-4 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
                      {Object.entries(
                        compSchema.attributes || {}
                      ).length > 0 ? (
                        Object.entries(
                          compSchema.attributes as Record<
                            string,
                            ContentTypeAttributeConfig
                          >
                        ).map(
                          (
                            [childName, childConfig],
                            idx: number
                          ) => {
                            const childFieldDef =
                              FIELD_TYPES.find(
                                (f) => f.id === childConfig.type
                              ) || FIELD_TYPES[0];
                            const ChildIcon =
                              childFieldDef.icon;
                            return (
                              <div
                                key={childName}
                                className="relative flex items-center gap-3 pl-10 pr-5 py-3 hover:bg-muted/10 transition-all duration-200 group/child animate-in fade-in slide-in-from-left-3"
                                style={{
                                  animationDelay: `${idx * 50}ms`,
                                  animationFillMode: "both",
                                }}
                              >
                                <div className="absolute left-5 top-1/2 w-4 h-px bg-primary/20" />
                                <div className="absolute left-[18px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/40 ring-2 ring-background" />
                                <div
                                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${childFieldDef.color} transition-transform duration-200 group-hover/child:scale-110`}
                                >
                                  <ChildIcon className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-medium text-sm text-foreground/80">
                                  {childName}
                                </span>
                                <span className="text-xs text-muted-foreground ml-auto mr-20 capitalize">
                                  {childFieldDef.name}
                                </span>
                              </div>
                            );
                          }
                        )
                      ) : (
                        <div className="pl-10 pr-5 py-3 text-xs text-muted-foreground italic animate-in fade-in">
                          No fields yet. Add fields to this
                          component in the Schema Builder.
                        </div>
                      )}
                      <div className="relative pl-10 pr-5 py-2 pb-3">
                        <div className="absolute left-5 top-0 h-1/2 w-px bg-primary/20" />
                        <div className="absolute left-5 top-1/2 w-4 h-px bg-primary/20" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFieldTargetSchema(compSchema);
                            resetFieldForm();
                            setFieldForm({ fieldStep: 1 });
                            setNewFieldOpen(true);
                          }}
                          className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 py-1 px-2 rounded-md hover:bg-primary/5 transition-all duration-200"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                          another field to this component
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isDynamicZone && isExpanded && (
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in"
                    style={{
                      borderBottom:
                        "1px solid hsl(var(--border) / 0.5)",
                    }}
                  >
                    <div className="ml-8 relative py-3">
                      <div className="absolute left-5 top-0 bottom-4 w-px bg-gradient-to-b from-purple-500/40 via-purple-500/20 to-transparent" />
                      <div className="pl-10 pr-5 flex flex-wrap items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFieldForm({
                              fieldName: name,
                              fieldType: "dynamiczone",
                              fieldComponents:
                                (config.components as string[]) || [],
                              compCreateMode: "existing",
                            });
                            setNewFieldOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-purple-500/30 text-purple-400 text-xs font-medium hover:border-purple-500/60 hover:bg-purple-500/5 transition-all duration-200 animate-in fade-in"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add a component
                        </button>
                        {dzComponents.map((comp, idx: number) => (
                          <div
                            key={comp.uid}
                            className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border/80 text-sm font-medium hover:bg-muted transition-all duration-200 group/chip animate-in fade-in zoom-in-95"
                            style={{
                              animationDelay: `${idx * 60}ms`,
                              animationFillMode: "both",
                            }}
                          >
                            <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center">
                              <Layers className="w-3.5 h-3.5 text-purple-400" />
                            </div>
                            <span className="text-xs">
                              {comp.displayName}
                            </span>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const updatedComps = (
                                  (config.components as string[]) || []
                                ).filter((u) => u !== comp.uid);
                                const updatedCt = {
                                  ...selectedCt,
                                  attributes: {
                                    ...selectedCt.attributes,
                                    [name]: {
                                      ...config,
                                      components: updatedComps,
                                    },
                                  },
                                };
                                try {
                                  await updateContentTypeAsync({
                                    uid: selectedCt.uid,
                                    data: updatedCt,
                                  });
                                  refetchContentTypes();
                                  fetchContentTypes();
                                  setSelectedCt(updatedCt);
                                } catch {
                                  toast.error(
                                    "Failed to remove component"
                                  );
                                }
                              }}
                              className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover/chip:opacity-100"
                              title="Remove component"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {dzComponents.length === 0 && (
                          <span className="text-xs text-muted-foreground italic animate-in fade-in">
                            No components added yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
