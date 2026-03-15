 "use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/app";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Pencil,
  Trash2,
  Database,
  LayoutGrid,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useParams } from "next/navigation";

// For projects generated with `output: "export"` this provides
// at least one concrete param so the export step succeeds.
// At runtime other content-type UIDs are handled on the client side.
export function generateStaticParams() {
  return [{ model: "api::article.article" }];
}

export default function ContentManager() {
  const { model } = useParams();
  const { contentTypes, fetchContentTypes } = useAppStore();
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const contentType = contentTypes.find((c) => c.uid === model);

  useEffect(() => {
    fetchContentTypes();
  }, [fetchContentTypes]);

  const fetchData = async () => {
    if (!contentType) return;
    setLoading(true);
    try {
      const endpoint =
        contentType.kind === "singleType"
          ? `/${contentType.singularName}`
          : `/${contentType.pluralName}`;

      const res = await api.get(endpoint);
      if (contentType.kind === "singleType") {
        setData(res.data.data ? [res.data.data] : []);
        setFormData(res.data.data || {});
      } else {
        setData(res.data.data || []);
        setMeta(res.data.meta || {});
      }
    } catch (e) {
      toast.error("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [contentType]);

  const handleSave = async () => {
    if (!contentType) return;
    try {
      const endpoint =
        contentType.kind === "singleType"
          ? `/${contentType.singularName}`
          : `/${contentType.pluralName}`;

      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, { data: formData });
        toast.success("Entry updated successfully");
      } else if (contentType.kind === "singleType") {
        await api.put(endpoint, { data: formData });
        toast.success("Entry saved successfully");
      } else {
        await api.post(endpoint, { data: formData });
        toast.success("Entry created successfully");
      }
      setIsFormOpen(false);
      setFormData({});
      setEditingId(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.error?.message || "Error saving entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!contentType || !confirm("Are you sure you want to delete this entry?"))
      return;
    try {
      await api.delete(`/${contentType.pluralName}/${id}`);
      toast.success("Entry deleted");
      fetchData();
    } catch (e) {
      toast.error("Error deleting entry");
    }
  };

  const openEditForm = (item: any) => {
    setFormData(item);
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  if (!contentType) {
    return (
      <div className="p-8 flex items-center justify-center font-bold text-xl h-full text-muted-foreground animate-pulse">
        Loading Schema...
      </div>
    );
  }

  const columns = [
    "id",
    ...Object.keys(contentType.attributes),
    "createdAt",
    "updatedAt",
  ];

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {contentType.displayName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm bg-muted/50 inline-block px-2 py-0.5 rounded-md font-mono">
            {contentType.uid} • {contentType.kind}
          </p>
        </div>

        <div className="flex gap-3">
          {contentType.kind === "collectionType" && (
            <Dialog
              open={isFormOpen}
              onOpenChange={(open) => {
                setIsFormOpen(open);
                if (!open) {
                  setFormData({});
                  setEditingId(null);
                }
              }}
            >
              <DialogTrigger
                render={
                  <Button className="gap-2 shadow-md hover:scale-[1.02] transition-transform">
                    <Plus className="w-4 h-4" /> Create new entry
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4 mb-4">
                  <DialogTitle className="text-xl">
                    {editingId ? "Edit Entry" : "Create New Entry"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-2">
                  {Object.entries(contentType.attributes).map(
                    ([field, config]: [string, any]) => (
                      <div key={field} className="space-y-2">
                        <Label className="font-semibold flex items-center justify-between">
                          <span>{field}</span>
                          {config.required && (
                            <span className="text-xs text-destructive font-bold uppercase tracking-wider">
                              Required
                            </span>
                          )}
                        </Label>

                        {config.type === "boolean" ? (
                          <Switch
                            checked={!!formData[field]}
                            onCheckedChange={(c) =>
                              setFormData({ ...formData, [field]: c })
                            }
                          />
                        ) : config.type === "text" ||
                          config.type === "richtext" ? (
                          <textarea
                            className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
                            value={formData[field] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [field]: e.target.value,
                              })
                            }
                            placeholder={`Enter ${field}...`}
                          />
                        ) : (
                          <Input
                            type={
                              config.type === "integer" ||
                              config.type === "float"
                                ? "number"
                                : "text"
                            }
                            value={formData[field] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [field]: e.target.value,
                              })
                            }
                            placeholder={`Enter ${field}...`}
                            className="focus-visible:ring-primary"
                          />
                        )}
                      </div>
                    ),
                  )}
                </div>
                <DialogFooter className="border-t pt-4 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="min-w-[100px] shadow-sm"
                  >
                    {editingId ? "Save Changes" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex-1 bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
        {contentType.kind === "collectionType" ? (
          <>
            <div className="p-4 border-b border-border/50 bg-muted/10 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${contentType.pluralName}...`}
                  className="pl-9 bg-background/50 border-input/50 focus-visible:ring-primary/30"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Filter className="w-4 h-4" /> Filters
                </Button>
                <div className="flex items-center gap-2 border-l pl-4 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary bg-primary/10 rounded-md"
                  >
                    <Table className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-sm">
                  <TableRow className="border-b-border/50 hover:bg-transparent">
                    {columns.map((col) => (
                      <TableHead
                        key={col}
                        className="font-semibold text-foreground whitespace-nowrap"
                      >
                        <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                          {col}
                          <ArrowUpDown className="w-3 h-3 opacity-50" />
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="w-[100px] text-right font-semibold text-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <TableRow key={i} className="animate-pulse">
                          {columns.map((c) => (
                            <TableCell key={c}>
                              <div className="h-4 bg-muted/50 rounded" />
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="h-4 bg-muted/50 rounded w-12 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + 1}
                        className="h-full text-center py-20"
                      >
                        <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                          <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                            <Database className="w-8 h-8 opacity-20" />
                          </div>
                          <p className="text-lg font-medium text-foreground mb-1">
                            No entries found
                          </p>
                          <p className="text-sm">
                            Get started by creating a new entry for{" "}
                            {contentType.displayName}.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow
                        key={item.id}
                        className="group hover:bg-muted/20 border-border/30 transition-colors"
                      >
                        {columns.map((col) => (
                          <TableCell
                            key={`${item.id}-${col}`}
                            className="max-w-[200px] truncate py-3"
                          >
                            {col === "id" ? (
                              <span className="font-mono text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                {item[col]}
                              </span>
                            ) : typeof item[col] === "boolean" ? (
                              item[col] ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground/30" />
                              )
                            ) : (
                              <span className="text-sm">
                                {String(item[col] || "—")}
                              </span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-right py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={() => openEditForm(item)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {meta?.pagination && (
              <div className="p-4 border-t border-border/50 bg-muted/10 flex items-center justify-between text-sm text-muted-foreground">
                <p>
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {data.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {meta.pagination.total}
                  </span>{" "}
                  entries
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.pagination.page === 1}
                    className="h-8"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={meta.pagination.page >= meta.pagination.pageCount}
                    className="h-8"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 max-w-3xl mx-auto w-full">
            <Card className="border-border shadow-sm">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {contentType.displayName} Data
                    </h2>
                    <p className="text-muted-foreground">
                      Single Type configuration
                    </p>
                  </div>
                </div>

                <div className="grid gap-6">
                  {Object.entries(contentType.attributes).map(
                    ([field, config]: [string, any]) => (
                      <div key={field} className="space-y-2">
                        <Label className="font-semibold">{field}</Label>
                        {config.type === "boolean" ? (
                          <Switch
                            checked={!!formData[field]}
                            onCheckedChange={(c) =>
                              setFormData({ ...formData, [field]: c })
                            }
                          />
                        ) : config.type === "text" ||
                          config.type === "richtext" ? (
                          <textarea
                            className="w-full min-h-[120px] p-3 rounded-lg border border-input focus:ring-2 focus:ring-primary focus:outline-none"
                            value={formData[field] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [field]: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <Input
                            type={
                              config.type === "integer" ||
                              config.type === "float"
                                ? "number"
                                : "text"
                            }
                            value={formData[field] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [field]: e.target.value,
                              })
                            }
                            className="max-w-md h-11"
                          />
                        )}
                      </div>
                    ),
                  )}
                  <div className="pt-6">
                    <Button
                      onClick={handleSave}
                      size="lg"
                      className="px-8 shadow-sm hover:scale-[1.02] transition-transform"
                    >
                      Save Content
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
