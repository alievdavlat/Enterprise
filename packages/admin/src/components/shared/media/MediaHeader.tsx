import { Button } from "@enterprise/design-system";
import { LayoutGrid, List, Settings, FolderPlus, Upload } from "lucide-react";
import { Sparkles } from "lucide-react";

interface MediaHeaderProps {
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  setConfigOpen: (open: boolean) => void;
  setAddFolderOpen: (open: boolean) => void;
  setAddAssetOpen: (open: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

export const MediaHeader = ({
  viewMode,
  setViewMode,
  setConfigOpen,
  setAddFolderOpen,
  setAddAssetOpen,
  fileInputRef,
  onFileSelect,
  uploading,
}: MediaHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Asset Gallery</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Upload and manage your media assets
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex rounded-md border border-input bg-muted/30 p-0.5">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setViewMode("grid")}
            title="Grid view">
            <LayoutGrid className="w-4 h-4 text-emerald-500" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setViewMode("list")}
            title="List view">
            <List className="w-4 h-4 text-blue-500" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setConfigOpen(true)}>
          <Settings className="w-4 h-4 text-amber-500" />
          Configure view
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,application/pdf,text/plain,text/csv,application/json"
          onChange={onFileSelect}
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setAddFolderOpen(true)}>
          <FolderPlus className="w-4 h-4 text-cyan-500" />
          Add new folder
        </Button>
        <Button
          disabled={uploading}
          onClick={() => setAddAssetOpen(true)}
          className="gap-2">
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading…" : "Add new assets"}
        </Button>
      </div>
    </div>
  );
};
