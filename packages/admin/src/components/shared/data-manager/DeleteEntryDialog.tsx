"use client";

import { Button } from "@enterprise/design-system";
import { StandardDialog } from "@/components/shared/StandardDialog";
import { IllustrationDelete } from "@/components/illustrations";

export interface DeleteEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export const DeleteEntryDialog = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: DeleteEntryDialogProps) => {
  return (
    <StandardDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="rose"
      illustration={<IllustrationDelete size={120} />}
      title="Delete entry"
      description="Are you sure you want to delete this entry? This action cannot be undone."
      footer={
        <>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="default"
            loading={loading}
            onClick={onConfirm}>
            Delete
          </Button>
        </>
      }
    />
  );
};
