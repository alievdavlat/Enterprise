"use client";

import { useEffect, useState } from "react";
import { Wrench, Save } from "lucide-react";
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

type AdvancedConfig = {
  allowRegister: boolean;
  defaultRole: string;
  emailConfirmation: boolean;
  resetPasswordPage: string;
  emailConfirmationRedirection: string;
  uniqueEmail: boolean;
};

const DEFAULTS: AdvancedConfig = {
  allowRegister: true,
  defaultRole: "authenticated",
  emailConfirmation: false,
  resetPasswordPage: "",
  emailConfirmationRedirection: "",
  uniqueEmail: true,
};

export default function AdvancedSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AdvancedConfig>(DEFAULTS);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/admin/users-permissions/advanced").catch(() => null),
      api.get("/admin/roles").catch(() => null),
    ])
      .then(([cfgRes, rolesRes]) => {
        if (cfgRes?.data?.data) {
          setConfig({ ...DEFAULTS, ...cfgRes.data.data });
        }
        if (rolesRes?.data?.data) {
          setRoles(rolesRes.data.data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/admin/users-permissions/advanced", config);
      toast.success("Settings saved");
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

  const roleOptions = roles.length > 0
    ? roles.map((r) => r.name)
    : ["public", "authenticated", "admin", "superAdmin"];

  return (
    <div className="p-8 max-w-4xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Advanced settings</h1>
            <p className="text-muted-foreground mt-1">Users &amp; Permissions</p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Registration</CardTitle>
          <CardDescription>Control how users can sign up.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Allow registrations</Label>
              <p className="text-xs text-muted-foreground mt-1">
                When off, only an admin can create users.
              </p>
            </div>
            <Switch
              checked={config.allowRegister}
              onCheckedChange={(v) => setConfig({ ...config, allowRegister: v })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Default role for authenticated users</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={config.defaultRole}
              onChange={(e) => setConfig({ ...config, defaultRole: e.target.value })}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">One account per email</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Reject registrations that re-use an existing email.
              </p>
            </div>
            <Switch
              checked={config.uniqueEmail}
              onCheckedChange={(v) => setConfig({ ...config, uniqueEmail: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Email confirmation</CardTitle>
          <CardDescription>
            Require users to confirm their email address before they can sign in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Require email confirmation</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Users must click the confirmation link before logging in.
              </p>
            </div>
            <Switch
              checked={config.emailConfirmation}
              onCheckedChange={(v) => setConfig({ ...config, emailConfirmation: v })}
            />
          </div>
          {config.emailConfirmation && (
            <div className="grid gap-2">
              <Label>Redirection URL after confirmation</Label>
              <Input
                value={config.emailConfirmationRedirection}
                onChange={(e) =>
                  setConfig({ ...config, emailConfirmationRedirection: e.target.value })
                }
                placeholder="https://example.com/welcome"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Password reset</CardTitle>
          <CardDescription>Front-end page that handles the reset-password link.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Label>Reset password page URL</Label>
            <Input
              value={config.resetPasswordPage}
              onChange={(e) => setConfig({ ...config, resetPasswordPage: e.target.value })}
              placeholder="https://example.com/reset-password"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used as <code>{"{{ link }}"}</code> in the reset-password email.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
