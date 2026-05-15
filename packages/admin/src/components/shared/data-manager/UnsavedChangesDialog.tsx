"use client";

import { Button } from "@enterprise/design-system";
import { StandardDialog } from "@/components/shared/StandardDialog";
import { IllustrationWarning } from "@/components/illustrations";

export interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
}

export const UnsavedChangesDialog = ({
  open,
  onOpenChange,
  onDiscard,
}: UnsavedChangesDialogProps) => {
  return (
    <StandardDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="amber"
      illustration={<IllustrationWarning size={120} />}
      title="Discard unsaved changes?"
      description="You have unsaved changes on this entry. If you leave now, your edits will be lost."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep editing
          </Button>
          <Button
            variant="default"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onDiscard}>
            Discard changes
          </Button>
        </>
      }
    />
  );
};
