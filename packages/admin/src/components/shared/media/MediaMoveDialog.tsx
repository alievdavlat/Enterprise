"use client";

import { Globe, Folder } from "lucide-react";
import { Button } from "@enterprise/design-system";
import { StandardDialog } from "@/components/shared/StandardDialog";
import { IllustrationDocument } from "@/components/illustrations";
import type { MediaFolder } from "@/types";

export interface MediaMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: MediaFolder[];
  onMove: (targetPath: string | null) => void;
}

export function MediaMoveDialog({
  open,
  onOpenChange,
  folders,
  onMove,
}: MediaMoveDialogProps) {
  return (
    <StandardDialog
      open={open}
      onOpenChange={onOpenChange}
      illustration={<IllustrationDocument size={120} />}
      title="Move assets"
      description="Pick a destination folder. Move to global places assets at the gallery root.">
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => onMove(null)}>
          <Globe className="w-4 h-4 text-emerald-500" />
          Move to global
        </Button>
        {folders.map((f) => (
          <Button
            key={f.id}
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onMove(f.path)}>
            <Folder className="w-4 h-4 text-cyan-500" />
            {f.name}
          </Button>
        ))}
      </div>
    </StandardDialog>
  );
}
