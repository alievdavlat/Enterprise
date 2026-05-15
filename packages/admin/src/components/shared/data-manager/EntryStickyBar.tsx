"use client";

import { Button, Kbd, KbdGroup } from "@enterprise/design-system";
import { CheckCircle2, Loader2, Trash2, AlertCircle } from "lucide-react";

export interface EntryStickyBarProps {
  isNew: boolean;
  isDirty: boolean;
  saving: boolean;
  shortcutLabel: string;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  onDelete?: () => void;
}

export const EntryStickyBar = ({
  isNew,
  isDirty,
  saving,
  shortcutLabel,
  onSave,
  onDiscard,
  onDelete,
}: EntryStickyBarProps) => {
  const status = saving
    ? { icon: Loader2, text: "Saving…", tone: "text-muted-foreground", spin: true }
    : isDirty
      ? {
          icon: AlertCircle,
          text: "Unsaved changes",
          tone: "text-amber-600 dark:text-amber-400",
          spin: false,
        }
      : isNew
        ? {
            icon: CheckCircle2,
            text: "Ready to create",
            tone: "text-muted-foreground",
            spin: false,
          }
        : {
            icon: CheckCircle2,
            text: "All changes saved",
            tone: "text-emerald-600 dark:text-emerald-400",
            spin: false,
          };

  const StatusIcon = status.icon;

  return (
    <div
      className="sticky bottom-0 -mx-8 -mb-8 mt-8 z-30 border-t border-border/60 bg-background/85 backdrop-blur-md
                 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3 px-8 py-4">
        <div className={`flex items-center gap-2 text-sm ${status.tone}`}>
          <StatusIcon className={`w-4 h-4 ${status.spin ? "animate-spin" : ""}`} />
          <span className="font-medium">{status.text}</span>
        </div>

        <div className="flex-1" />

        {!isNew && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
            disabled={saving}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onDiscard}
          disabled={saving || (!isDirty && !isNew)}>
          {isDirty ? "Discard" : "Cancel"}
        </Button>

        <Button
          size="sm"
          onClick={onSave}
          disabled={saving || (!isDirty && !isNew)}
          className="gap-2">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{isNew ? "Create" : "Save"}</span>
              <KbdGroup className="hidden sm:inline-flex opacity-70">
                <Kbd>{shortcutLabel}</Kbd>
                <Kbd>S</Kbd>
              </KbdGroup>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
