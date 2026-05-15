"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Switch,
  Badge,
  Separator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "@enterprise/design-system";
import { KeyRound, Github, ExternalLink, Plus } from "lucide-react";
import { PageHeader, ListSkeleton, StandardDialog } from "@/components/shared";
import { IllustrationKey } from "@/components/illustrations";

interface Preset {
  name: string;
  displayName: string;
  defaultScope: string;
}

interface Configured {
  id?: number;
  name: string;
  enabled: boolean | number;
  clientId?: string | null;
  clientSecret?: string | null;
  scope?: string | null;
  redirectUri?: string | null;
  allowedRedirects?: string | null;
  isCustom?: boolean | number | null;
  customConfig?: string | null;
}

/**
 * Settings → Auth providers. Phase 19 UI — toggles + client_id/secret for
 * GitHub / Discord / Google / Facebook / Microsoft / GitLab / Twitter.
 */
export default function AuthProvidersPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [configured, setConfigured] = useState<Record<string, Configured>>({});
  const [loading, setLoading] = useState(true);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/auth-providers");
      setPresets(res.data?.data?.presets ?? []);
      const map: Record<string, Configured> = {};
      for (const row of (res.data?.data?.configured ?? []) as Configured[]) {
        map[row.name] = row;
      }
      setConfigured(map);
    } catch {
      toast.error("Failed to load providers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Custom rows are those whose `name` doesn't match a preset — admins can
  // mix arbitrary OAuth 2.0 IdPs alongside the seven built-in ones.
  const presetNames = new Set(presets.map((p) => p.name));
  const customRows = Object.values(configured).filter((r) => !presetNames.has(r.name) && r.isCustom);

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={KeyRound}
        eyebrow="Settings"
        title="Auth providers"
        description="Enable social sign-in for your admin + API. Each provider talks standard OAuth 2.0."
        variant="violet"
        actions={
          <Button onClick={() => setCustomDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add custom provider
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton rows={4} />
      ) : (
        <div className="space-y-6">
          {customRows.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Custom providers
              </h2>
              <div className="grid gap-4">
                {customRows.map((row) => (
                  <ProviderCard
                    key={row.name}
                    preset={{ name: row.name, displayName: row.name, defaultScope: row.scope ?? "" }}
                    row={row}
                    onSaved={load}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            {customRows.length > 0 && (
              <h2 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                Built-in presets
              </h2>
            )}
            <div className="grid gap-4">
              {presets.map((p) => (
                <ProviderCard
                  key={p.name}
                  preset={p}
                  row={configured[p.name]}
                  onSaved={load}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <CustomProviderDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        onSaved={() => { setCustomDialogOpen(false); load(); }}
      />
    </div>
  );
}

/**
 * Add a brand-new OAuth provider not in the seven built-in presets — e.g.
 * a private enterprise SSO or a small social network we haven't shipped a
 * preset for. The admin supplies the authorize / token / user-info URLs +
 * a field-mapping object that tells the server how to pull id / email /
 * name out of the user-info response.
 */
function CustomProviderDialog({
  open, onOpenChange, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authorizeUrl, setAuthorizeUrl] = useState("");
  const [tokenUrl, setTokenUrl] = useState("");
  const [userInfoUrl, setUserInfoUrl] = useState("");
  const [defaultScope, setDefaultScope] = useState("openid email profile");
  const [userMapping, setUserMapping] = useState('{\n  "id": "id",\n  "email": "email",\n  "name": "name",\n  "username": "username",\n  "avatar": "avatar_url"\n}');
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || !authorizeUrl || !tokenUrl || !userInfoUrl) {
      toast.error("Name, authorize URL, token URL, and user-info URL are required");
      return;
    }
    let mapping: Record<string, string> = {};
    try { mapping = JSON.parse(userMapping); }
    catch { toast.error("User mapping must be valid JSON"); return; }
    setSaving(true);
    try {
      await api.put(`/admin/auth-providers/${name.toLowerCase()}`, {
        enabled: false,
        clientId,
        clientSecret,
        scope: defaultScope,
        isCustom: true,
        customConfig: {
          displayName: displayName || name,
          authorizeUrl,
          tokenUrl,
          userInfoUrl,
          defaultScope,
          userMapping: mapping,
        },
      });
      toast.success("Custom provider added — toggle it on from the list");
      onSaved();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <StandardDialog
      open={open}
      onOpenChange={onOpenChange}
      illustration={<IllustrationKey size={120} />}
      title="Add custom OAuth provider"
      description="Wire up any OAuth 2.0 IdP — give it a name, the three IdP URLs, and a field mapping for the user-info response."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Add provider
          </Button>
        </>
      }>
      <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Name (slug)</Label>
            <Input value={name} onChange={(e) => setName(e.target.value.replace(/[^a-z0-9_-]/gi, "").toLowerCase())} placeholder="acme-sso" />
          </div>
          <div className="space-y-2">
            <Label>Display name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Acme SSO" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Authorize URL</Label>
            <Input value={authorizeUrl} onChange={(e) => setAuthorizeUrl(e.target.value)} placeholder="https://idp.example.com/oauth2/authorize" className="font-mono text-xs" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Token URL</Label>
            <Input value={tokenUrl} onChange={(e) => setTokenUrl(e.target.value)} placeholder="https://idp.example.com/oauth2/token" className="font-mono text-xs" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>User-info URL</Label>
            <Input value={userInfoUrl} onChange={(e) => setUserInfoUrl(e.target.value)} placeholder="https://idp.example.com/userinfo" className="font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Default scope</Label>
            <Input value={defaultScope} onChange={(e) => setDefaultScope(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Client ID</Label>
            <Input value={clientId} onChange={(e) => setClientId(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Client secret</Label>
            <Input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>User-info field mapping (JSON)</Label>
            <Textarea value={userMapping} onChange={(e) => setUserMapping(e.target.value)} rows={7} className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground">
              Maps our canonical fields (id, email, name, username, avatar) to the keys in your IdP's user-info response.
            </p>
          </div>
        </div>
    </StandardDialog>
  );
}

function ProviderCard({
  preset,
  row,
  onSaved,
}: {
  preset: Preset;
  row?: Configured;
  onSaved: () => void;
}) {
  const [enabled, setEnabled] = useState(!!row?.enabled);
  const [clientId, setClientId] = useState(row?.clientId ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [scope, setScope] = useState(row?.scope ?? "");
  const [redirectUri, setRedirectUri] = useState(row?.redirectUri ?? "");
  const [allowedRedirects, setAllowedRedirects] = useState(row?.allowedRedirects ?? "");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(!!row?.enabled);

  useEffect(() => {
    setEnabled(!!row?.enabled);
    setClientId(row?.clientId ?? "");
    setScope(row?.scope ?? "");
    setRedirectUri(row?.redirectUri ?? "");
    setAllowedRedirects(row?.allowedRedirects ?? "");
  }, [row]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/auth-providers/${preset.name}`, {
        enabled,
        clientId,
        clientSecret, // empty string means "keep existing"
        scope,
        redirectUri,
        allowedRedirects,
      });
      toast.success(`${preset.displayName} saved`);
      setClientSecret("");
      onSaved();
    } catch (e) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      toast.error(msg ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={`border-border/60 ${enabled ? "ring-1 ring-primary/30" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <ProviderIcon name={preset.name} />
          <div>
            <CardTitle className="text-base">{preset.displayName}</CardTitle>
            <CardDescription className="text-xs">
              {row?.clientId ? `Configured · clientId ${row.clientId.slice(0, 8)}…` : "Not configured"}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {enabled && <Badge>Enabled</Badge>}
          <Switch
            checked={enabled}
            onCheckedChange={(v) => { setEnabled(v); setExpanded(true); }}
          />
          <Button variant="ghost" size="sm" onClick={() => setExpanded((x) => !x)}>
            {expanded ? "Collapse" : "Configure"}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <>
          <Separator />
          <CardContent className="pt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Client ID</Label>
                <Input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="from the provider's developer console"
                />
              </div>
              <div className="space-y-1">
                <Label>Client secret</Label>
                <Input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder={row?.clientId ? "(unchanged — type to replace)" : "from the provider"}
                />
              </div>
              <div className="space-y-1">
                <Label>Scope</Label>
                <Input
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder={preset.defaultScope}
                />
              </div>
              <div className="space-y-1">
                <Label>Redirect URI override (optional)</Label>
                <Input
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  placeholder="auto-detected from request host"
                  className="font-mono text-xs"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label>Allowed post-login redirects (comma-separated)</Label>
                <Input
                  value={allowedRedirects}
                  onChange={(e) => setAllowedRedirects(e.target.value)}
                  placeholder="https://app.example.com/dashboard"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Configure callback in {preset.displayName}: <code>/api/auth/oauth/{preset.name}/callback</code>
              </p>
              <Button onClick={save} loading={saving}>
                Save
              </Button>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

function ProviderIcon({ name }: { name: string }) {
  // Inline brand glyphs avoid pulling brand libs / additional assets.
  // GitHub uses lucide's Github icon; the rest are stylised initials so we
  // don't ship logo files without permission.
  const styles: Record<string, { bg: string; fg: string; label: string }> = {
    github: { bg: "bg-zinc-900", fg: "text-white", label: "GH" },
    discord: { bg: "bg-indigo-500", fg: "text-white", label: "DC" },
    google: { bg: "bg-red-500", fg: "text-white", label: "G" },
    facebook: { bg: "bg-blue-600", fg: "text-white", label: "f" },
    microsoft: { bg: "bg-sky-500", fg: "text-white", label: "Ms" },
    gitlab: { bg: "bg-orange-500", fg: "text-white", label: "GL" },
    twitter: { bg: "bg-black", fg: "text-white", label: "X" },
  };
  const s = styles[name] ?? { bg: "bg-muted", fg: "text-muted-foreground", label: "?" };
  if (name === "github") {
    return (
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg}`}>
        <Github className="w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${s.bg} ${s.fg}`}>
      {s.label}
    </div>
  );
}
