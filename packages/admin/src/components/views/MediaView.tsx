"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  MediaHeader,
  MediaFilterBar,
  MediaFolderSection,
  MediaEditDialog,
  MediaBreadcrumb,
  MediaConfigDialog,
  MediaAddFolderDialog,
  MediaAddAssetDialog,
  MediaMoveDialog,
  MediaSelectionBar,
  MediaAssetsSection,
} from "@/components/shared";
import {
  useMediaFiles,
  useMediaFolders,
  useUpdateMediaFile,
  useDeleteMediaFile,
  useMoveMediaFiles,
  useCreateMediaFolder,
  useUploadMediaFiles,
} from "@/hooks/useMedia";
import { useMediaPreferencesStore } from "@/store/mediaPreferences";
import { SORT_OPTIONS } from "@/consts";
import type { MediaFile } from "@/types";
import type { MediaEditFormState } from "@/components/shared/media/MediaEditDialog";
import type { MediaUploadTab } from "@/components/shared/media/MediaAddAssetDialog";

export function MediaView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { viewMode, pageSize, sort, setViewMode, setPageSize, setSort } =
    useMediaPreferencesStore();

  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [addFolderName, setAddFolderName] = useState("");
  const [addFolderLocation, setAddFolderLocation] = useState<string | null>(
    null,
  );
  const [editing, setEditing] = useState<MediaFile | null>(null);
  const [editForm, setEditForm] = useState<MediaEditFormState>({
    name: "",
    caption: "",
    alternativeText: "",
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [uploadTab, setUploadTab] = useState<MediaUploadTab>("computer");
  const [urlInput, setUrlInput] = useState("");

  const setSortAndSave = useCallback(
    (value: string | null) => {
      const next = value ?? "created_at:desc";
      setSort(next);
      setPage(1);
    },
    [setSort],
  );

  const handlePageSizeChange = useCallback(
    (n: number) => {
      setPageSize(n);
      setPage(1);
    },
    [setPageSize],
  );

  const filesParams = {
    page,
    pageSize,
    sort,
    folderPath: currentFolder,
  };
  const { data: filesData, isLoading: filesLoading } =
    useMediaFiles(filesParams);
  const { data: folders = [], refetch: refetchFolders } = useMediaFolders();
  const updateFile = useUpdateMediaFile();
  const deleteFile = useDeleteMediaFile();
  const moveFiles = useMoveMediaFiles();
  const createFolder = useCreateMediaFolder();
  const uploadFiles = useUploadMediaFiles();

  const list = filesData?.data ?? [];
  const total = filesData?.total ?? 0;
  const pageCount = Math.ceil(total / pageSize) || 1;
  const rootFolders = folders.filter(
    (f) => !f.parentPath || f.parentPath === "/",
  );
  const childFolders = (path: string) =>
    folders.filter((f) => f.parentPath === path);

  const openEdit = useCallback((file: MediaFile) => {
    setEditing(file);
    setEditForm({
      name: file.name || "",
      caption: file.caption ?? "",
      alternativeText: file.alternativeText ?? "",
    });
    setEditOpen(true);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editing) return;
    try {
      await updateFile.mutateAsync({
        id: editing.id,
        payload: {
          name: editForm.name.trim() || editing.name,
          caption: editForm.caption.trim() || null,
          alternativeText: editForm.alternativeText.trim() || null,
        },
      });
      toast.success("Updated");
      setEditOpen(false);
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.error(err?.response?.data?.error?.message ?? "Error");
    }
  }, [editing, editForm, updateFile]);

  const remove = useCallback(
    async (id: number) => {
      if (!confirm("Delete this file?")) return;
      try {
        await deleteFile.mutateAsync(id);
        toast.success("Deleted");
        setSelectedIds((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      } catch (e: unknown) {
        const err = e as {
          response?: { data?: { error?: { message?: string } } };
        };
        toast.error(err?.response?.data?.error?.message ?? "Error");
      }
    },
    [deleteFile],
  );

  const handleCreateFolder = useCallback(async () => {
    if (!addFolderName.trim()) return;
    try {
      await createFolder.mutateAsync({
        name: addFolderName.trim(),
        parentPath: addFolderLocation,
      });
      toast.success("Folder created");
      setAddFolderOpen(false);
      setAddFolderName("");
      setAddFolderLocation(null);
      refetchFolders();
    } catch (e: unknown) {
      const err = e as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.error(err?.response?.data?.error?.message ?? "Error");
    }
  }, [addFolderName, addFolderLocation, createFolder, refetchFolders]);

  const handleMoveAssets = useCallback(
    async (targetPath: string | null) => {
      if (selectedIds.size === 0) return;
      try {
        await moveFiles.mutateAsync({
          ids: Array.from(selectedIds),
          folderPath: targetPath,
        });
        toast.success("Moved");
        setMoveOpen(false);
        setSelectedIds(new Set());
      } catch (e: unknown) {
        const err = e as {
          response?: { data?: { error?: { message?: string } } };
        };
        toast.error(err?.response?.data?.error?.message ?? "Error");
      }
    },
    [selectedIds, moveFiles],
  );

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === list.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(list.map((f) => f.id)));
  }, [list, selectedIds.size]);

  const onFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const fileList = Array.from(files);
      try {
        await uploadFiles.mutateAsync({
          files: fileList,
          folderPath: currentFolder,
        });
        toast.success("Uploaded");
        setAddAssetOpen(false);
        e.target.value = "";
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        toast.error(message);
      } finally {
        e.target.value = "";
      }
    },
    [currentFolder, uploadFiles],
  );

  return (
    <div className="p-8 w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <MediaHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        setConfigOpen={setConfigOpen}
        setAddFolderOpen={setAddFolderOpen}
        setAddAssetOpen={setAddAssetOpen}
        fileInputRef={fileInputRef}
        onFileSelect={onFileSelect}
        uploading={uploadFiles.isPending}
      />

      <MediaFilterBar
        list={list}
        selectedIds={selectedIds}
        toggleSelectAll={toggleSelectAll}
        sort={sort}
        setSortAndSave={setSortAndSave}
        SORT_OPTIONS={SORT_OPTIONS}
      />

      <MediaBreadcrumb
        currentFolder={currentFolder}
        onRootClick={() => setCurrentFolder(null)}
      />

      <MediaFolderSection
        currentFolder={currentFolder}
        childFolders={childFolders}
        rootFolders={rootFolders}
        setCurrentFolder={setCurrentFolder}
      />

      <MediaAssetsSection
        list={list}
        total={total}
        loading={filesLoading}
        viewMode={viewMode}
        selectedIds={selectedIds}
        page={page}
        pageCount={pageCount}
        pageSize={pageSize}
        onToggleSelect={toggleSelect}
        onEdit={openEdit}
        onRemove={remove}
        onPagePrev={() => setPage((p) => Math.max(1, p - 1))}
        onPageNext={() => setPage((p) => Math.min(pageCount, p + 1))}
        onAddAssetsClick={() => {
          setAddAssetOpen(true);
          fileInputRef.current?.click();
        }}
        uploading={uploadFiles.isPending}
      />

      <MediaSelectionBar
        selectedCount={selectedIds.size}
        onMoveClick={() => setMoveOpen(true)}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <MediaEditDialog
        editOpen={editOpen}
        setEditOpen={setEditOpen}
        editForm={editForm}
        setEditForm={setEditForm}
        saveEdit={saveEdit}
      />

      <MediaConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        sort={sort}
        onSortChange={setSortAndSave}
        sortOptions={SORT_OPTIONS}
      />

      <MediaAddFolderDialog
        open={addFolderOpen}
        onOpenChange={setAddFolderOpen}
        folderName={addFolderName}
        onFolderNameChange={setAddFolderName}
        parentPath={addFolderLocation}
        onParentPathChange={setAddFolderLocation}
        folders={folders}
        onSubmit={handleCreateFolder}
      />

      <MediaAddAssetDialog
        open={addAssetOpen}
        onOpenChange={setAddAssetOpen}
        uploadTab={uploadTab}
        onUploadTabChange={setUploadTab}
        urlInput={urlInput}
        onUrlInputChange={setUrlInput}
        fileInputRef={fileInputRef}
        onFileSelect={onFileSelect}
        uploading={uploadFiles.isPending}
      />

      <MediaMoveDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        folders={folders}
        onMove={handleMoveAssets}
      />
    </div>
  );
}
