"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

const STORE_KEY = "admin::media-library";

type MediaLibraryConfig = {
  responsiveUpload?: boolean;
  sizeOptimization?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
};

const defaultConfig: MediaLibraryConfig = {
  responsiveUpload: false,
  sizeOptimization: false,
  maxSize: 51200,
  allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"],
};

export default function MediaLibrarySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<MediaLibraryConfig>(defaultConfig);

  useEffect(() => {
    api
      .get("/admin/store", { params: { key: STORE_KEY } })
      .then((res) => {
        const v = res.data?.data?.value;
        if (v && typeof v === "object") setConfig({ ...defaultConfig, ...v });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/admin/store", { key: STORE_KEY, value: config });
      toast.success("Media Library settings saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl space-y-8 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground mt-1">Configure the settings for the Media Library</p>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </div>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Asset management</CardTitle>
          <CardDescription>Responsive upload and size optimization. Settings are stored in the backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Responsive friendly upload</p>
              <p className="text-sm text-muted-foreground">Generate multiple formats (small, medium, large)</p>
            </div>
            <Switch
              checked={config.responsiveUpload ?? false}
              onCheckedChange={(v) => setConfig((c) => ({ ...c, responsiveUpload: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Size optimization</p>
              <p className="text-sm text-muted-foreground">Reduce image size and quality</p>
            </div>
            <Switch
              checked={config.sizeOptimization ?? false}
              onCheckedChange={(v) => setConfig((c) => ({ ...c, sizeOptimization: v }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Max file size (KB)</Label>
            <Input
              type="number"
              value={config.maxSize ?? 51200}
              onChange={(e) => setConfig((c) => ({ ...c, maxSize: Number(e.target.value) || 51200 }))}
              placeholder="51200"
            />
            <p className="text-xs text-muted-foreground">Default 51200 (50 MB)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
