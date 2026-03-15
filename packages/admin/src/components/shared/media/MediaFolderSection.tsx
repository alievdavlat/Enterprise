import { Folder, FolderOpen } from "lucide-react";
import type { MediaFolder } from "@/types";

export interface MediaFolderSectionProps {
  currentFolder: string | null;
  childFolders: (path: string) => MediaFolder[];
  rootFolders: MediaFolder[];
  setCurrentFolder: (path: string | null) => void;
}

export const MediaFolderSection = ({
  currentFolder,
  childFolders,
  rootFolders,
  setCurrentFolder,
}: MediaFolderSectionProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-amber-500" />
        Folders (
        {(currentFolder ? childFolders(currentFolder) : rootFolders).length})
      </h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,100px))] gap-2">
        {(currentFolder ? childFolders(currentFolder) : rootFolders).map(
          (folder) => (
            <button
              key={folder.id}
              type="button"
              className="w-[130px] h-[100px] flex flex-row items-center gap-2 p-2 rounded-lg overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors text-left"
              onClick={() => setCurrentFolder(folder.path)}>
              <Folder
                className="w-8 h-8 shrink-0 fill-gray-500 text-gray-500"
                strokeWidth={1.5}
              />
              <span
                className="font-medium text-sm truncate min-w-0 flex-1"
                title={folder.name}>
                {folder.name}
              </span>
            </button>
          ),
        )}
      </div>
    </div>
  );
};
