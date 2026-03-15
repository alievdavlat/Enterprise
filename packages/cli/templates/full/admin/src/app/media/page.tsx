"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, Trash2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";

type MediaFile = {
  id: number;
  name: string;
  url: string;
  mime?: string;
  size?: number;
  caption?: string | null;
  alternativeText?: string | null;
  createdAt?: string;
};

export default function MediaLibraryPage() {
  const [list, setList] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<MediaFile | null>(null);
  const [editForm, setEditForm] = useState({ name: "", caption: "", alternativeText: "" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageSize = 24;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const uploadBase = baseUrl.replace(/\/api\/?$/, "");

  const load = () => {
    setLoading(true);
    api
      .get("/upload/files", { params: { page, pageSize } })
      .then((res) => {
        setList(res.data?.data ?? []);
        setTotal(res.data?.meta?.pagination?.total ?? res.data?.data?.length ?? 0);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  const openEdit = (file: MediaFile) => {
    setEditing(file);
    setEditForm({
      name: file.name || "",
      caption: file.caption ?? "",
      alternativeText: file.alternativeText ?? "",
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await api.patch(`/upload/files/${editing.id}`, {
        name: editForm.name.trim() || editing.name,
        caption: editForm.caption.trim() || null,
        alternativeText: editForm.alternativeText.trim() || null,
      });
      toast.success("Updated");
      setEditOpen(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Update failed");
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this file?")) return;
    try {
      await api.delete(`/upload/files/${id}`);
      toast.success("Deleted");
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Delete failed");
    }
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${baseUrl}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || res.statusText);
      }
      toast.success("Uploaded");
      load();
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const isImage = (mime: string) => /^image\//.test(mime);
  const pageCount = Math.ceil(total / pageSize) || 1;

  return (
    <div className="p-8 max-w-6xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">Upload and manage assets</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,application/pdf,text/plain,text/csv,application/json"
          onChange={onFileSelect}
        />
        <Button
          className="gap-2"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading…" : "Add new assets"}
        </Button>
      </div>

      {loading ? (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center text-muted-foreground">Loading…</CardContent>
        </Card>
      ) : list.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-24 px-6">
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center mb-4">
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">No assets yet</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
              Upload images, videos or documents to use in your content.
            </p>
            <Button className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4" />
              Add new assets
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {list.map((file) => (
              <Card key={file.id} className="border-border/50 overflow-hidden group">
                <div className="aspect-square bg-muted relative">
                  {isImage(file.mime || "") ? (
                    <img
                      src={file.url.startsWith("http") ? file.url : `${uploadBase}${file.url}`}
                      alt={file.alternativeText || file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => openEdit(file)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => remove(file.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-2">
                  <p className="text-xs font-medium truncate" title={file.name}>{file.name}</p>
                  {file.size != null && (
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} MB</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {pageCount} ({total} assets)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit asset</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Caption</Label>
              <Input
                value={editForm.caption}
                onChange={(e) => setEditForm((f) => ({ ...f, caption: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label>Alternative text</Label>
              <Input
                value={editForm.alternativeText}
                onChange={(e) => setEditForm((f) => ({ ...f, alternativeText: e.target.value }))}
                placeholder="For accessibility"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
