"use client";

import { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
} from "@enterprise/design-system";
import { api } from "@/lib/api";
import { toast } from "sonner";

const STORE_KEY = "admin::sso";

type SsoConfig = {
  enabled?: boolean;
  provider?: string;
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
  defaultRole?: string;
};

const defaultConfig: SsoConfig = {
  enabled: false,
  provider: "oidc",
  clientId: "",
  clientSecret: "",
  callbackUrl: "",
  defaultRole: "authenticated",
};

export default function SSOPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SsoConfig>(defaultConfig);

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
      toast.success("SSO settings saved");
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
          <h1 className="text-2xl font-bold tracking-tight">
            Single Sign-On (SSO)
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure identity provider (SAML/OIDC)
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">SSO configuration</CardTitle>
          <CardDescription>
            Settings are stored in the backend. Actual SSO login flow can be
            implemented later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable SSO</p>
              <p className="text-sm text-muted-foreground">
                Allow login via identity provider
              </p>
            </div>
            <Switch
              checked={config.enabled ?? false}
              onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Provider</Label>
            <Input
              value={config.provider ?? ""}
              onChange={(e) =>
                setConfig((c) => ({ ...c, provider: e.target.value }))
              }
              placeholder="oidc or saml"
            />
          </div>
          <div className="grid gap-2">
            <Label>Client ID</Label>
            <Input
              value={config.clientId ?? ""}
              onChange={(e) =>
                setConfig((c) => ({ ...c, clientId: e.target.value }))
              }
              placeholder=""
            />
          </div>
          <div className="grid gap-2">
            <Label>Client Secret</Label>
            <Input
              type="password"
              value={config.clientSecret ?? ""}
              onChange={(e) =>
                setConfig((c) => ({ ...c, clientSecret: e.target.value }))
              }
              placeholder=""
            />
          </div>
          <div className="grid gap-2">
            <Label>Callback URL</Label>
            <Input
              value={config.callbackUrl ?? ""}
              onChange={(e) =>
                setConfig((c) => ({ ...c, callbackUrl: e.target.value }))
              }
              placeholder="https://admin.example.com/sso/callback"
            />
          </div>
          <div className="grid gap-2">
            <Label>Default role for new users</Label>
            <Input
              value={config.defaultRole ?? ""}
              onChange={(e) =>
                setConfig((c) => ({ ...c, defaultRole: e.target.value }))
              }
              placeholder="authenticated"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Enterprise feature</p>
            <p className="text-sm text-muted-foreground">
              Full SSO login flow (SAML/OIDC) can be added as a separate
              integration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
