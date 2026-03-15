"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from "@enterprise/design-system";
import type { MediaFolder } from "@/types";

export interface MediaAddFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onFolderNameChange: (value: string) => void;
  parentPath: string | null;
  onParentPathChange: (value: string | null) => void;
  folders: MediaFolder[];
  onSubmit: () => void;
}

export function MediaAddFolderDialog({
  open,
  onOpenChange,
  folderName,
  onFolderNameChange,
  parentPath,
  onParentPathChange,
  folders,
  onSubmit,
}: MediaAddFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add new folder</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={folderName}
              onChange={(e) => onFolderNameChange(e.target.value)}
              placeholder="Folder name"
            />
          </div>
          <div className="grid gap-2">
            <Label>Location</Label>
            <Select
              value={parentPath ?? "__root__"}
              onValueChange={(v) =>
                onParentPathChange(v === "__root__" ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose parent folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__root__">
                  Asset Gallery (top level)
                </SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.path}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              &quot;Asset Gallery (top level)&quot; is the root — your new
              folder will appear at the top level of the gallery.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!folderName.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
