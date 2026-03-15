"use client";

import { Upload, Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Input,
  Button,
} from "@enterprise/design-system";

export type MediaUploadTab = "computer" | "url";

export interface MediaAddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadTab: MediaUploadTab;
  onUploadTabChange: (tab: MediaUploadTab) => void;
  urlInput: string;
  onUrlInputChange: (value: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

export function MediaAddAssetDialog({
  open,
  onOpenChange,
  uploadTab,
  onUploadTabChange,
  urlInput,
  onUrlInputChange,
  fileInputRef,
  onFileSelect,
  uploading,
}: MediaAddAssetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Add new assets</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 border-b pb-4">
          <Button
            variant={uploadTab === "computer" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => onUploadTabChange("computer")}
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            From computer
          </Button>
          <Button
            variant={uploadTab === "url" ? "secondary" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => onUploadTabChange("url")}
          >
            <Link2 className="w-4 h-4 text-blue-500" />
            From URL
          </Button>
        </div>
        {uploadTab === "computer" ? (
          <div
            className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <span className="text-muted-foreground block mb-2">
              Drag & Drop here or
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse files
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={urlInput}
              onChange={(e) => onUrlInputChange(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              URL upload coming soon
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {uploadTab === "computer" && (
            <Button onClick={() => fileInputRef.current?.click()}>
              Browse files
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
