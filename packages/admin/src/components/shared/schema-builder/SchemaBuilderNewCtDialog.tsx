"use client";

import {
  Button,
  Input,
  Label,
  Switch,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@enterprise/design-system";
import { CategoryCombobox } from "./CategoryCombobox";
import { Plus, Layers, LayoutPanelLeft, Component, Shuffle } from "lucide-react";

export interface SchemaBuilderNewCtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctForm: {
    ctName: string;
    ctKind: string;
    ctDraft: boolean;
    compNewCategory: string;
  };
  setCtForm: (u: Partial<SchemaBuilderNewCtDialogProps["ctForm"]>) => void;
  existingCategories: string[];
  onCreate: () => void;
  trigger?: React.ReactNode;
}

export function SchemaBuilderNewCtDialog({
  open,
  onOpenChange,
  ctForm,
  setCtForm,
  existingCategories,
  onCreate,
  trigger,
}: SchemaBuilderNewCtDialogProps) {
  const typeCards: {
    id: SchemaBuilderNewCtDialogProps["ctForm"]["ctKind"];
    label: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }[] = [
    {
      id: "collectionType",
      label: "Collection schema",
      description: "Multiple entries (e.g. Articles, Products, Users).",
      icon: Layers,
    },
    {
      id: "singleType",
      label: "Single schema",
      description: "Single entry (e.g. Homepage, Settings, About page).",
      icon: LayoutPanelLeft,
    },
    {
      id: "component",
      label: "Component",
      description: "Reusable building block shared across schemas.",
      icon: Component,
    },
    {
      id: "dynamiczone",
      label: "Dynamic zone",
      description: "Flexible area where editors choose components.",
      icon: Shuffle,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger>{trigger as never}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Create Content Schema</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Define the type of content you want to manage and its behavior in
            the admin panel.
          </p>
        </DialogHeader>
        <div className="grid gap-6 py-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]">
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Schema type
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {typeCards.map(({ id, label, description, icon: Icon }) => {
                const active = ctForm.ctKind === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCtForm({ ctKind: id })}
                    className={
                      "flex flex-col items-start gap-2 rounded-lg border text-left p-3 transition-all duration-150 hover:border-primary/60 hover:bg-primary/5 " +
                      (active
                        ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm"
                        : "border-border")
                    }>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-semibold">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display name</Label>
              <Input
                value={ctForm.ctName}
                onChange={(e) => setCtForm({ ctName: e.target.value })}
                placeholder="e.g. Article, Product, Homepage"
              />
              <p className="text-xs text-muted-foreground">
                This is what editors will see in the sidebar and content
                manager.
              </p>
            </div>

            {ctForm.ctKind === "component" && (
              <div className="space-y-2">
                <Label>Category</Label>
                <CategoryCombobox
                  value={ctForm.compNewCategory}
                  onChange={(v) => setCtForm({ compNewCategory: v })}
                  categories={existingCategories}
                />
                <p className="text-xs text-muted-foreground">
                  Group components by feature or domain (e.g. &quot;Blog&quot;,
                  &quot;Marketing&quot;).
                </p>
              </div>
            )}

            {ctForm.ctKind !== "component" &&
              ctForm.ctKind !== "dynamiczone" && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-3">
                  <div className="space-y-0.5">
                    <Label>Draft &amp; publish</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow editors to review content in draft before
                      publishing it live.
                    </p>
                  </div>
                  <Switch
                    checked={ctForm.ctDraft}
                    onCheckedChange={(c) => setCtForm({ ctDraft: c })}
                  />
                </div>
              )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer">
            Cancel
          </Button>
          <Button onClick={onCreate} className="cursor-pointer">
            Create schema
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SchemaBuilderNewCtDialogWithTrigger({
  open,
  onOpenChange,
  ctForm,
  setCtForm,
  existingCategories,
  onCreate,
}: Omit<SchemaBuilderNewCtDialogProps, "trigger">) {
  return (
    <>
      <Button
        variant="outline"
        className="mt-4 mb-4 gap-2 border-primary/20 text-primary hover:bg-primary/10 w-full transition-all"
        onClick={() => onOpenChange(true)}>
        <Plus className="w-4 h-4" /> Create new schema
      </Button>
      <SchemaBuilderNewCtDialog
        open={open}
        onOpenChange={onOpenChange}
        ctForm={ctForm}
        setCtForm={setCtForm}
        existingCategories={existingCategories}
        onCreate={onCreate}
      />
    </>
  );
}
