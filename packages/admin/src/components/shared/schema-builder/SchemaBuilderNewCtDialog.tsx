"use client";

import {
  Button,
  Input,
  Label,
  Toggle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@enterprise/design-system";
import { CategoryCombobox } from "./CategoryCombobox";
import { Plus } from "lucide-react";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger>{trigger as never}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Content Schema</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input
              value={ctForm.ctName}
              onChange={(e) => setCtForm({ ctName: e.target.value })}
              placeholder="e.g. Article"
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={ctForm.ctKind}
              onValueChange={(v) => setCtForm({ ctKind: v ?? ctForm.ctKind })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collectionType">
                  Collection Schema (Multiple)
                </SelectItem>
                <SelectItem value="singleType">
                  Single Schema (One)
                </SelectItem>
                <SelectItem value="component">Component (Reusable)</SelectItem>
                <SelectItem value="dynamiczone">Dynamic Zone</SelectItem>
              </SelectContent>
            </Select>
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
                Select a category or create a new one
              </p>
            </div>
          )}
          {ctForm.ctKind !== "component" && ctForm.ctKind !== "dynamiczone" && (
            <div className="flex items-center justify-between border p-3 rounded-lg mt-2">
              <div className="space-y-0.5">
                <Label>Draft & Publish</Label>
                <p className="text-sm text-muted-foreground">
                  Allows reviewing content before publishing
                </p>
              </div>
              <Toggle
                checked={ctForm.ctDraft}
                onCheckedChange={(c) => setCtForm({ ctDraft: c })}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate}>Create</Button>
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
        onClick={() => onOpenChange(true)}
      >
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
