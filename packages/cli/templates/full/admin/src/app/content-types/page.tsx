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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wrench,
  Plus,
  Database,
  Settings,
  Table,
  Type,
  Hash,
  Calendar,
  Box,
  ToggleLeft,
  Link,
  Eye,
} from "lucide-react";

const FIELD_TYPES = [
  { id: "string", name: "Text", icon: Type },
  { id: "text", name: "Long Text", icon: Type },
  { id: "integer", name: "Number", icon: Hash },
  { id: "boolean", name: "Boolean", icon: ToggleLeft },
  { id: "date", name: "Date", icon: Calendar },
  { id: "relation", name: "Relation", icon: Link },
  { id: "json", name: "JSON", icon: Box },
];

export default function ContentTypeBuilder() {
  const { contentTypes, fetchContentTypes } = useAppStore();
  const [selectedCt, setSelectedCt] = useState<any | null>(null);
  const [isNewCtOpen, setIsNewCtOpen] = useState(false);
  const [isNewFieldOpen, setIsNewFieldOpen] = useState(false);

  // New CT form state
  const [ctName, setCtName] = useState("");
  const [ctKind, setCtKind] = useState("collectionType");
  const [ctDraft, setCtDraft] = useState(true);

  // New Field form state
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("string");
  const [fieldRequired, setFieldRequired] = useState(false);

  useEffect(() => {
    fetchContentTypes();
  }, [fetchContentTypes]);

  const handleCreateContentType = async () => {
    try {
      if (!ctName) return;
      const uid = `api::${ctName.toLowerCase()}.${ctName.toLowerCase()}`;
      const plural = ctName.toLowerCase() + "s";
      const schema = {
        uid,
        kind: ctKind,
        collectionName: plural,
        displayName: ctName,
        singularName: ctName.toLowerCase(),
        pluralName: plural,
        draftAndPublish: ctDraft,
        attributes: {
          title: { type: "string", required: true }, // Auto add a title field
        },
      };
      await api.post("/admin/content-types", schema);
      toast.success("Content Type created");
      setIsNewCtOpen(false);
      fetchContentTypes();
      setSelectedCt(schema);
    } catch (e: any) {
      toast.error(
        e.response?.data?.error?.message || "Error creating content type",
      );
    }
  };

  const handleAddField = async () => {
    if (!selectedCt || !fieldName) return;
    try {
      const updatedCt = { ...selectedCt };
      updatedCt.attributes[fieldName] = {
        type: fieldType,
        required: fieldRequired,
      };
      await api.put(`/admin/content-types/${selectedCt.uid}`, updatedCt);
      toast.success("Field added");
      setIsNewFieldOpen(false);
      fetchContentTypes();
      setSelectedCt(updatedCt);
      setFieldName("");
      setFieldType("string");
    } catch (e) {
      toast.error("Error adding field");
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Sidebar: List of Content Types */}
      <div className="w-80 border-r border-border bg-card/30 flex flex-col pt-8 px-4 h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Content Types</h2>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pr-2">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Collection Types
            </h3>
            <div className="space-y-1">
              {contentTypes
                .filter((c) => c.kind === "collectionType")
                .map((ct) => (
                  <button
                    key={ct.uid}
                    onClick={() => setSelectedCt(ct)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group ${selectedCt?.uid === ct.uid ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"}`}
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 opacity-70" />
                      <span className="font-medium">{ct.displayName}</span>
                    </div>
                    <span className="text-xs opacity-50 group-hover:opacity-100">
                      {Object.keys(ct.attributes).length} fields
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <Dialog open={isNewCtOpen} onOpenChange={setIsNewCtOpen}>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                className="mt-4 mb-4 gap-2 border-primary/20 text-primary hover:bg-primary/10 w-full transition-all"
              >
                <Plus className="w-4 h-4" /> Create new type
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Content Type</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={ctName}
                  onChange={(e) => setCtName(e.target.value)}
                  placeholder="e.g. Article"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={ctKind} onValueChange={(v) => setCtKind(v ?? ctKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collectionType">
                      Collection Type (Multiple)
                    </SelectItem>
                    <SelectItem value="singleType">
                      Single Type (One)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between border p-3 rounded-lg mt-2">
                <div className="space-y-0.5">
                  <Label>Draft & Publish</Label>
                  <p className="text-sm text-muted-foreground">
                    Allows reviewing content before publishing
                  </p>
                </div>
                <Switch checked={ctDraft} onCheckedChange={setCtDraft} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsNewCtOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateContentType}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content: Schema Builder */}
      <div className="flex-1 overflow-y-auto bg-muted/10 p-8">
        {selectedCt ? (
          <div className="space-y-6 max-w-4xl mx-auto animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between bg-card p-6 rounded-xl border border-border shadow-sm">
              <div>
                <h1 className="text-3xl font-bold">{selectedCt.displayName}</h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                    {selectedCt.uid}
                  </span>
                  • {Object.keys(selectedCt.attributes).length} fields
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="gap-2">
                  <Settings className="w-4 h-4" /> Configure
                </Button>
              </div>
            </div>

            <Card className="shadow-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b border-border/50 py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Table className="w-5 h-5 text-primary" /> Fields
                </CardTitle>
                <Dialog open={isNewFieldOpen} onOpenChange={setIsNewFieldOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        size="sm"
                        className="gap-2 hover:scale-105 transition-transform"
                      >
                        <Plus className="w-4 h-4" /> Add Field
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        Add New Field to {selectedCt.displayName}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                      <div className="space-y-2">
                        <Label>Field Type</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
                          {FIELD_TYPES.map((ft) => {
                            const Icon = ft.icon;
                            return (
                              <button
                                key={ft.id}
                                onClick={() => setFieldType(ft.id)}
                                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${fieldType === ft.id ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}
                              >
                                <Icon
                                  className={`w-5 h-5 ${fieldType === ft.id ? "text-primary" : "text-muted-foreground"}`}
                                />
                                <span className="font-medium">{ft.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2 border-t pt-4">
                        <Label>Field Name</Label>
                        <Input
                          value={fieldName}
                          onChange={(e) =>
                            setFieldName(
                              e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, "_"),
                            )
                          }
                          placeholder="e.g. title, description, price"
                        />
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                          Machine name:{" "}
                          <span className="font-mono bg-muted px-1 py-0.5 rounded">
                            {fieldName || "---"}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center justify-between border p-3 rounded-lg">
                        <div className="space-y-0.5">
                          <Label>Required field</Label>
                          <p className="text-sm text-muted-foreground">
                            You won't be able to create an entry if this field
                            is empty
                          </p>
                        </div>
                        <Switch
                          checked={fieldRequired}
                          onCheckedChange={setFieldRequired}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="ghost"
                        onClick={() => setIsNewFieldOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddField} disabled={!fieldName}>
                        Add field
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {Object.entries(selectedCt.attributes).map(
                    ([name, config]: [string, any]) => {
                      const fieldDef =
                        FIELD_TYPES.find((f) => f.id === config.type) ||
                        FIELD_TYPES[0];
                      const Icon = fieldDef.icon;
                      return (
                        <div
                          key={name}
                          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-2 rounded-md ring-1 ring-primary/20">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[15px]">
                                  {name}
                                </span>
                                {config.required && (
                                  <span className="text-[10px] font-bold tracking-wider uppercase bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                                    Required
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground capitalize">
                                {config.type}
                              </p>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
              <Wrench className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Content Type Builder</h2>
            <p className="text-muted-foreground mb-8">
              Select an existing content type or create a new one to define your
              data structure and generate APIs instantly.
            </p>
            <Button
              onClick={() => setIsNewCtOpen(true)}
              size="lg"
              className="w-full gap-2 font-medium shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform"
            >
              <Plus className="w-5 h-5" /> Create new Content Type
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
