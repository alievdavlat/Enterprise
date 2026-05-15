"use client";

import { Upload, Link2 } from "lucide-react";
import { Label, Input, Button } from "@enterprise/design-system";
import { StandardDialog } from "@/components/shared/StandardDialog";
import { IllustrationUpload } from "@/components/illustrations";

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
  uploading,
}: MediaAddAssetDialogProps) {
  return (
    <StandardDialog
      open={open}
      onOpenChange={onOpenChange}
      tone="blue"
      illustration={<IllustrationUpload size={120} />}
      title="Add new assets"
      description="Drop files from your computer or paste a URL — uploads land in the media library."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {uploadTab === "computer" && (
            <Button
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}>
              Browse files
            </Button>
          )}
        </>
      }>
      <div className="flex gap-2 border-b border-border/60 pb-3">
        <Button
          variant={uploadTab === "computer" ? "secondary" : "ghost"}
          size="sm"
          className="gap-2"
          onClick={() => onUploadTabChange("computer")}>
          <Upload className="w-4 h-4 text-emerald-500" />
          From computer
        </Button>
        <Button
          variant={uploadTab === "url" ? "secondary" : "ghost"}
          size="sm"
          className="gap-2"
          onClick={() => onUploadTabChange("url")}>
          <Link2 className="w-4 h-4 text-blue-500" />
          From URL
        </Button>
      </div>
      {uploadTab === "computer" ? (
        <div
          className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}>
          <span className="text-muted-foreground block mb-2 text-sm">
            Drag &amp; drop here or
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}>
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
    </StandardDialog>
  );
}
