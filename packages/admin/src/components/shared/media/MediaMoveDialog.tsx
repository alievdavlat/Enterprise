"use client";

import { Globe, Folder } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from "@enterprise/design-system";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move assets</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onMove(null)}
          >
            <Globe className="w-4 h-4 text-emerald-500" />
            Move to global
          </Button>
          {folders.map((f) => (
            <Button
              key={f.id}
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => onMove(f.path)}
            >
              <Folder className="w-4 h-4 text-cyan-500" />
              {f.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
