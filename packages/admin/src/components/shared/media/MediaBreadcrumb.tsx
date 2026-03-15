import { ChevronRight } from "lucide-react";

export interface MediaBreadcrumbProps {
  currentFolder: string | null;
  onRootClick: () => void;
}

export function MediaBreadcrumb({
  currentFolder,
  onRootClick,
}: MediaBreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {currentFolder === null ? (
        <span className="text-muted-foreground">Asset Gallery</span>
      ) : (
        <>
          <button
            type="button"
            onClick={onRootClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
          >
            Asset Gallery
          </button>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium truncate">
            {currentFolder.split("/").pop()}
          </span>
        </>
      )}
    </div>
  );
}
