"use client";

import { useEffect, useState } from "react";
import { Wrench, Save, Palette, ShieldCheck, Eye } from "lucide-react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
} from "@enterprise/design-system";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAppStore } from "@/store/app";
import {
  AUTH_TEMPLATES,
  DEFAULT_AUTH_TEMPLATE,
  type AuthTemplateId,
} from "@/components/auth/types";
import { NexusTemplate } from "@/components/auth/templates/NexusTemplate";
import { WelcomeBackTemplate } from "@/components/auth/templates/WelcomeBackTemplate";
import { AuroraTemplate } from "@/components/auth/templates/AuroraTemplate";
import { MinimalTemplate } from "@/components/auth/templates/MinimalTemplate";
import { cn } from "@/lib/utils";

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

const UI_STORE_KEY = "admin::ui::auth-template";

export default function AdvancedSettingsPage() {
  const user = useAppStore((s) => s.user);
  const isSuperAdmin = user?.role === "superAdmin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AdvancedConfig>(DEFAULTS);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);

  const [activeTemplate, setActiveTemplate] =
    useState<AuthTemplateId>(DEFAULT_AUTH_TEMPLATE);
  const [savingTpl, setSavingTpl] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/admin/users-permissions/advanced").catch(() => null),
      api.get("/admin/roles").catch(() => null),
      api
        .get("/admin/store", { params: { key: UI_STORE_KEY } })
        .catch(() => null),
    ])
      .then(([cfgRes, rolesRes, tplRes]) => {
        if (cfgRes?.data?.data) {
          setConfig({ ...DEFAULTS, ...cfgRes.data.data });
        }
        if (rolesRes?.data?.data) {
          setRoles(rolesRes.data.data);
        }
        const stored = tplRes?.data?.data?.value;
        if (typeof stored === "string") {
          setActiveTemplate(stored as AuthTemplateId);
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

  const saveTemplate = async () => {
    setSavingTpl(true);
    try {
      await api.post("/admin/store", {
        key: UI_STORE_KEY,
        value: activeTemplate,
      });
      toast.success("Auth template applied");
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to save template");
    } finally {
      setSavingTpl(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const roleOptions =
    roles.length > 0
      ? roles.map((r) => r.name)
      : ["public", "authenticated", "admin", "superAdmin"];

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
            <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Advanced settings
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Users &amp; Permissions, registration policies and UI customization
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="auth" className="space-y-6">
        <TabsList className="bg-muted/40 p-1 rounded-xl">
          <TabsTrigger value="auth" className="gap-2 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
            Authentication
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="ui" className="gap-2 rounded-lg">
              <Palette className="w-4 h-4" />
              UI Customization
              <Badge variant="secondary" className="ml-1 text-[9px] uppercase">
                Super admin
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* AUTHENTICATION TAB */}
        <TabsContent value="auth" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Registration</CardTitle>
              <CardDescription>Control how users can sign up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Allow registrations
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    When off, only an admin can create users.
                  </p>
                </div>
                <Switch
                  checked={config.allowRegister}
                  onCheckedChange={(v) =>
                    setConfig({ ...config, allowRegister: v })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Default role for authenticated users</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={config.defaultRole}
                  onChange={(e) =>
                    setConfig({ ...config, defaultRole: e.target.value })
                  }
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
                  <Label className="text-sm font-medium">
                    One account per email
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reject registrations that re-use an existing email.
                  </p>
                </div>
                <Switch
                  checked={config.uniqueEmail}
                  onCheckedChange={(v) =>
                    setConfig({ ...config, uniqueEmail: v })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Email confirmation</CardTitle>
              <CardDescription>
                Require users to confirm their email address before they can sign in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Require email confirmation
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Users must click the confirmation link before logging in.
                  </p>
                </div>
                <Switch
                  checked={config.emailConfirmation}
                  onCheckedChange={(v) =>
                    setConfig({ ...config, emailConfirmation: v })
                  }
                />
              </div>
              {config.emailConfirmation && (
                <div className="grid gap-2">
                  <Label>Redirection URL after confirmation</Label>
                  <Input
                    value={config.emailConfirmationRedirection}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        emailConfirmationRedirection: e.target.value,
                      })
                    }
                    placeholder="https://example.com/welcome"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Password reset</CardTitle>
              <CardDescription>
                Front-end page that handles the reset-password link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label>Reset password page URL</Label>
                <Input
                  value={config.resetPasswordPage}
                  onChange={(e) =>
                    setConfig({ ...config, resetPasswordPage: e.target.value })
                  }
                  placeholder="https://example.com/reset-password"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used as <code>{"{{ link }}"}</code> in the reset-password email.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI CUSTOMIZATION TAB (super-admin only) */}
        {isSuperAdmin && (
          <TabsContent value="ui" className="space-y-6">
            <UICustomizationPanel
              activeTemplate={activeTemplate}
              setActiveTemplate={setActiveTemplate}
              onSave={saveTemplate}
              saving={savingTpl}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function UICustomizationPanel({
  activeTemplate,
  setActiveTemplate,
  onSave,
  saving,
}: {
  activeTemplate: AuthTemplateId;
  setActiveTemplate: (id: AuthTemplateId) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [previewMode, setPreviewMode] = useState<"login" | "register">("login");
  const [demoEmail, setDemoEmail] = useState("admin@example.com");
  const [demoPassword, setDemoPassword] = useState("••••••••");
  const [demoUsername, setDemoUsername] = useState("admin");

  const previewProps = {
    mode: previewMode,
    email: demoEmail,
    setEmail: setDemoEmail,
    password: demoPassword,
    setPassword: setDemoPassword,
    username: demoUsername,
    setUsername: setDemoUsername,
    loading: false,
    error: "",
    onSubmit: (e: React.FormEvent) => e.preventDefault(),
  };

  const PreviewComponent =
    activeTemplate === "welcome-back"
      ? WelcomeBackTemplate
      : activeTemplate === "aurora"
        ? AuroraTemplate
        : activeTemplate === "minimal"
          ? MinimalTemplate
          : NexusTemplate;

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                Login &amp; Register layout
              </CardTitle>
              <CardDescription>
                Choose a layout for the public sign-in and sign-up pages. Changes apply immediately for everyone after saving.
              </CardDescription>
            </div>
            <Button onClick={onSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Apply template"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AUTH_TEMPLATES.map((tpl) => {
            const selected = tpl.id === activeTemplate;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setActiveTemplate(tpl.id)}
                className={cn(
                  "text-left rounded-xl border-2 p-4 transition-all space-y-3 hover:shadow-md",
                  selected
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                    : "border-border hover:border-primary/40"
                )}
              >
                <div className="aspect-[16/10] rounded-lg overflow-hidden border bg-zinc-950 flex items-center justify-center">
                  <TemplateThumbnail templateId={tpl.id} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{tpl.name}</h4>
                    {selected && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 border text-[10px]">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tpl.description}
                  </p>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                Live preview
              </CardTitle>
              <CardDescription>
                See exactly how visitors will experience the chosen layout.
              </CardDescription>
            </div>
            <div className="flex gap-1 bg-muted/40 p-1 rounded-md">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPreviewMode(m)}
                  className={cn(
                    "px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors",
                    previewMode === m
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t bg-zinc-950 overflow-hidden">
            {/* Scaled-down preview using transform */}
            <div className="origin-top-left scale-[0.65] w-[154%] -mb-[35%] pointer-events-none select-none">
              <PreviewComponent {...previewProps} />
            </div>
          </div>
          <div className="px-4 py-3 border-t flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Preview is interactive in the chosen template only — saving applies it globally.</span>
            <a
              href={previewMode === "login" ? "/login" : "/register"}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Open in new tab ↗
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateThumbnail({ templateId }: { templateId: AuthTemplateId }) {
  if (templateId === "aurora") {
    return (
      <svg viewBox="0 0 160 100" className="w-full h-full">
        <defs>
          <radialGradient id="aurora-bg" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#a5b4fc" stopOpacity="0.7" />
            <stop offset="0.6" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="1" stopColor="#0a0a0a" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="160" height="100" fill="#0a0a0a" />
        <rect width="160" height="100" fill="url(#aurora-bg)" />
        <rect x="50" y="22" width="60" height="56" rx="6" fill="#0a0a0a" stroke="#27272a" strokeWidth="0.6" opacity="0.85" />
        <circle cx="80" cy="32" r="3" fill="#a5b4fc" />
        <rect x="60" y="40" width="40" height="2" rx="0.5" fill="#fafafa" />
        <rect x="60" y="46" width="40" height="2" fill="#52525b" />
        <rect x="60" y="54" width="40" height="5" rx="1" fill="#18181b" />
        <rect x="60" y="62" width="40" height="5" rx="1" fill="#18181b" />
        <rect x="60" y="70" width="40" height="5" rx="1" fill="#fafafa" />
      </svg>
    );
  }
  if (templateId === "nexus") {
    return (
      <svg viewBox="0 0 160 100" className="w-full h-full">
        <rect width="160" height="100" fill="#0a0a0a" />
        <rect width="160" height="2" fill="#10b981" />
        <rect x="0" y="2" width="80" height="98" fill="#0d0d0d" />
        <circle cx="20" cy="22" r="6" fill="#06b6d4" opacity="0.4" />
        <text x="20" y="55" fill="#a3a3a3" fontSize="6" fontWeight="700">
          Brand
        </text>
        <rect x="100" y="35" width="40" height="2" fill="#3f3f46" />
        <rect x="100" y="45" width="40" height="6" rx="1" fill="#1f1f1f" stroke="#3f3f46" strokeWidth="0.3" />
        <rect x="100" y="55" width="40" height="2" fill="#3f3f46" />
        <rect x="100" y="65" width="40" height="6" rx="1" fill="#1f1f1f" stroke="#3f3f46" strokeWidth="0.3" />
        <rect x="100" y="78" width="40" height="6" rx="1" fill="#3b82f6" />
      </svg>
    );
  }
  if (templateId === "welcome-back") {
    return (
      <svg viewBox="0 0 160 100" className="w-full h-full">
        <rect width="160" height="100" fill="#0a0a0a" />
        <text x="10" y="25" fill="#fafafa" fontSize="8" fontWeight="700">
          Welcome
        </text>
        <rect x="10" y="35" width="60" height="3" fill="#3f3f46" />
        <rect x="10" y="42" width="60" height="6" rx="1" fill="#18181b" />
        <rect x="10" y="52" width="60" height="3" fill="#3f3f46" />
        <rect x="10" y="59" width="60" height="6" rx="1" fill="#18181b" />
        <rect x="10" y="72" width="60" height="6" rx="1" fill="#27272a" />
        <rect x="80" y="20" width="70" height="60" rx="6" fill="url(#g2)" />
        <defs>
          <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#27272a" />
            <stop offset="1" stopColor="#d6d3d1" />
          </linearGradient>
        </defs>
        <rect x="86" y="55" width="58" height="20" rx="3" fill="#0a0a0a" opacity="0.7" />
        <rect x="90" y="60" width="40" height="2" fill="#a3a3a3" />
        <rect x="90" y="64" width="30" height="2" fill="#a3a3a3" />
        <rect x="90" y="70" width="20" height="2" fill="#fafafa" />
      </svg>
    );
  }
  // minimal
  return (
    <svg viewBox="0 0 160 100" className="w-full h-full">
      <rect width="160" height="100" fill="#fafafa" />
      <rect x="50" y="20" width="60" height="65" rx="4" fill="#fff" stroke="#e4e4e7" strokeWidth="0.5" />
      <circle cx="80" cy="32" r="4" fill="#3b82f6" opacity="0.2" />
      <rect x="60" y="42" width="40" height="3" rx="0.5" fill="#27272a" />
      <rect x="60" y="50" width="40" height="2" fill="#a1a1aa" />
      <rect x="60" y="56" width="40" height="5" rx="1" fill="#f4f4f5" />
      <rect x="60" y="64" width="40" height="5" rx="1" fill="#f4f4f5" />
      <rect x="60" y="74" width="40" height="5" rx="1" fill="#3b82f6" />
    </svg>
  );
}
