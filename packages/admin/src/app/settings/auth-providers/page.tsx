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
} from "@enterprise/design-system";
import { KeyRound, Github, ExternalLink } from "lucide-react";

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
}

/**
 * Settings → Auth providers. Phase 19 UI — toggles + client_id/secret for
 * GitHub / Discord / Google / Facebook / Microsoft / GitLab / Twitter.
 */
export default function AuthProvidersPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [configured, setConfigured] = useState<Record<string, Configured>>({});
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Auth providers</h1>
          <p className="text-muted-foreground mt-1">
            Enable social sign-in for your admin + API. Each provider talks standard OAuth 2.0.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground p-8 text-center">Loading…</div>
      ) : (
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
      )}
    </div>
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
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save"}
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
