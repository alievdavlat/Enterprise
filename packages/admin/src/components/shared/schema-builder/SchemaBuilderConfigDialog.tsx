"use client";

import {
  Button,
  Input,
  Label,
  Modal,
  ScrollArea,
  SelectWithOptions,
  Toggle,
} from "@enterprise/design-system";
import { GripVertical, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { ContentTypeSchema } from "@/types";

export interface SchemaBuilderConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCt: ContentTypeSchema | null;
  configForm: {
    cfgDisplayName: string;
    cfgSingularName: string;
    cfgPluralName: string;
    cfgDraft: boolean;
    cfgEntryTitle: string;
    cfgDisplayedFields: string[];
  };
  setConfigForm: (u: Partial<SchemaBuilderConfigDialogProps["configForm"]>) => void;
  allFieldOptions: string[];
  onSave: () => void;
}

export function SchemaBuilderConfigDialog({
  open,
  onOpenChange,
  selectedCt,
  configForm,
  setConfigForm,
  allFieldOptions,
  onSave,
}: SchemaBuilderConfigDialogProps) {
  if (!selectedCt) return null;

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title={`Customize layout — ${selectedCt.displayName}`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </>
      }>
      <div className="sm:max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col gap-4">
        <p className="text-sm text-muted-foreground -mt-2 mb-2">
          Customize how the edit view will look like.
        </p>
        <ScrollArea className="shrink-0 h-[calc(90vh-14rem)] min-h-[240px] w-full rounded-md border border-border/50">
          <div className="grid gap-6 py-4 pr-4">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Settings</h4>
              <div className="space-y-2">
                <Label>Entry title</Label>
                <SelectWithOptions
                  options={allFieldOptions.map((f) => ({ value: f, label: f }))}
                  value={configForm.cfgEntryTitle}
                  onChange={(v) => setConfigForm({ cfgEntryTitle: v ?? "" })}
                  placeholder="Select field..."
                />
                <p className="text-xs text-muted-foreground">
                  Set the displayed field of your entry
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">View</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="gap-1 text-primary"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit the content type
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Drag & drop the fields to build the layout.
              </p>
              <div className="rounded-lg border border-border divide-y divide-border">
                {configForm.cfgDisplayedFields.map((f, idx) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 group"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 text-sm font-medium">{f}</span>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx > 0) {
                            const arr = [...configForm.cfgDisplayedFields];
                            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                            setConfigForm({ cfgDisplayedFields: arr });
                          }
                        }}
                        className="p-1 rounded hover:bg-muted"
                        disabled={idx === 0}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx < configForm.cfgDisplayedFields.length - 1) {
                            const arr = [...configForm.cfgDisplayedFields];
                            [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                            setConfigForm({ cfgDisplayedFields: arr });
                          }
                        }}
                        className="p-1 rounded hover:bg-muted"
                        disabled={idx === configForm.cfgDisplayedFields.length - 1}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfigForm({
                            cfgDisplayedFields: configForm.cfgDisplayedFields.filter(
                              (x) => x !== f
                            ),
                          })
                        }
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <SelectWithOptions
                options={[
                  ...allFieldOptions
                    .filter((f) => !configForm.cfgDisplayedFields.includes(f))
                    .map((f) => ({ value: f, label: f })),
                  ...(allFieldOptions.filter(
                    (f) => !configForm.cfgDisplayedFields.includes(f)
                  ).length === 0
                    ? [{ value: "_", label: "All fields added", disabled: true }]
                    : []),
                ]}
                value=""
                onChange={(v) => {
                  if (
                    v &&
                    v !== "_" &&
                    !configForm.cfgDisplayedFields.includes(v)
                  ) {
                    setConfigForm({
                      cfgDisplayedFields: [
                        ...configForm.cfgDisplayedFields,
                        v,
                      ],
                    });
                  }
                }}
                placeholder="Insert another field"
              />
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold">Schema</h4>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input
                    value={configForm.cfgDisplayName}
                    onChange={(e) =>
                      setConfigForm({ cfgDisplayName: e.target.value })
                    }
                    placeholder="e.g. Article"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Singular Name (API)</Label>
                    <Input
                      value={configForm.cfgSingularName}
                      onChange={(e) =>
                        setConfigForm({
                          cfgSingularName: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-"),
                        })
                      }
                      placeholder="e.g. article"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plural Name (API)</Label>
                    <Input
                      value={configForm.cfgPluralName}
                      onChange={(e) =>
                        setConfigForm({
                          cfgPluralName: e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-"),
                        })
                      }
                      placeholder="e.g. articles"
                    />
                  </div>
                </div>
                {(selectedCt.kind === "collectionType" ||
                  selectedCt.kind === "singleType") && (
                  <div className="flex items-center justify-between border p-3 rounded-lg">
                    <div>
                      <Label>Draft & Publish</Label>
                      <p className="text-xs text-muted-foreground">
                        Allows reviewing content before publishing
                      </p>
                    </div>
                    <Toggle
                      checked={configForm.cfgDraft}
                      onCheckedChange={(c: boolean) =>
                        setConfigForm({ cfgDraft: c })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </Modal>
  );
}
