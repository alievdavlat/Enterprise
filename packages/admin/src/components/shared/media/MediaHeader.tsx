import { Button } from "@enterprise/design-system";
import {
  LayoutGrid,
  List,
  Settings,
  FolderPlus,
  Upload,
  Smartphone,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/PageHeader";
import type { MediaViewMode } from "./MediaAssetsSection";

interface MediaHeaderProps {
  viewMode: MediaViewMode;
  setViewMode: (mode: MediaViewMode) => void;
  setConfigOpen: (open: boolean) => void;
  setAddFolderOpen: (open: boolean) => void;
  setAddAssetOpen: (open: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

const VIEW_OPTIONS: Array<{
  value: MediaViewMode;
  icon: typeof LayoutGrid;
  title: string;
  iconTint: string;
}> = [
  { value: "grid", icon: LayoutGrid, title: "Grid view", iconTint: "text-emerald-500" },
  { value: "list", icon: List, title: "List view", iconTint: "text-blue-500" },
  { value: "phone", icon: Smartphone, title: "Phone gallery (Photos-style)", iconTint: "text-violet-500" },
];

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
    <PageHeader
      icon={ImageIcon}
      title="Asset Gallery"
      description="Upload and manage your media assets."
      variant="rose"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-md border border-input bg-muted/30 p-0.5">
            {VIEW_OPTIONS.map(({ value, icon: Icon, title, iconTint }) => (
              <Button
                key={value}
                variant={viewMode === value ? "secondary" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewMode(value)}
                title={title}>
                <Icon className={cn("w-4 h-4", iconTint)} />
              </Button>
            ))}
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
      }
    />
  );
};
