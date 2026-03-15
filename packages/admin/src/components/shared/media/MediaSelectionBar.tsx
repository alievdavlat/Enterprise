"use client";

import { Move, X } from "lucide-react";
import { Button } from "@enterprise/design-system";

export interface MediaSelectionBarProps {
  selectedCount: number;
  onMoveClick: () => void;
  onClearSelection: () => void;
}

export function MediaSelectionBar({
  selectedCount,
  onMoveClick,
  onClearSelection,
}: MediaSelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 flex items-center gap-2 p-3 rounded-lg bg-card border shadow-xl">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <Button size="sm" className="gap-2" onClick={onMoveClick}>
        <Move className="w-4 h-4 text-cyan-500" />
        Move
      </Button>
      <Button size="sm" variant="ghost" onClick={onClearSelection}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
