import React from "react";
import { Label, Input, Button } from "@enterprise/design-system";
import { StandardDialog } from "@/components/shared/StandardDialog";
import { IllustrationDocument } from "@/components/illustrations";

export interface MediaEditFormState {
  name: string;
  caption: string;
  alternativeText: string;
}

export interface MediaEditDialogProps {
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  editForm: MediaEditFormState;
  setEditForm: React.Dispatch<React.SetStateAction<MediaEditFormState>>;
  saveEdit: () => void | Promise<void>;
}

export const MediaEditDialog = ({
  editOpen,
  setEditOpen,
  editForm,
  setEditForm,
  saveEdit,
}: MediaEditDialogProps) => {
  return (
    <StandardDialog
      open={editOpen}
      onOpenChange={setEditOpen}
      illustration={<IllustrationDocument size={120} />}
      title="Edit asset"
      description="Update the asset's name, caption, and alt text for accessibility."
      footer={
        <>
          <Button variant="outline" onClick={() => setEditOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveEdit}>Save</Button>
        </>
      }>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Name</Label>
          <Input
            value={editForm.name}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, name: e.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>Caption</Label>
          <Input
            value={editForm.caption}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, caption: e.target.value }))
            }
            placeholder="Optional"
          />
        </div>
        <div className="grid gap-2">
          <Label>Alternative text</Label>
          <Input
            value={editForm.alternativeText}
            onChange={(e) =>
              setEditForm((f) => ({
                ...f,
                alternativeText: e.target.value,
              }))
            }
            placeholder="For accessibility"
          />
        </div>
      </div>
    </StandardDialog>
  );
};
