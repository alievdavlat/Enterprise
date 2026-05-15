"use client";

import { Button } from "@enterprise/design-system";
import { StandardDialog } from "@/components/shared/StandardDialog";
import {
  IllustrationDelete,
  IllustrationConfirm,
} from "@/components/illustrations";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

/**
 * Generic confirm dialog used across the admin (delete X, archive Y,
 * etc.). Uses the standard chrome — same illustration band + size as
 * every other dialog.
 *
 * Illustration picks itself from variant: destructive → trash bin,
 * default → question speech bubble.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  variant = "destructive",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const confirmVariant: "destructive" | "default" =
    variant === "destructive" ? "destructive" : "default";

  const illustration =
    variant === "destructive" ? (
      <IllustrationDelete size={120} />
    ) : (
      <IllustrationConfirm size={120} />
    );

  return (
    <StandardDialog
      open={open}
      onOpenChange={onOpenChange}
      illustration={illustration}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
