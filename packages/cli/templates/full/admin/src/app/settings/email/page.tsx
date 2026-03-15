"use client";

import { useState, useEffect } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function EmailSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [config, setConfig] = useState({
    provider: "sendmail",
    from: "",
    testAddress: "",
    smtp: {} as { host?: string; port?: number; user?: string; pass?: string; secure?: boolean },
  });

  useEffect(() => {
    api
      .get("/admin/email/config")
      .then((res) => {
        const d = res.data?.data ?? {};
        setConfig((c) => ({
          ...c,
          provider: d.provider ?? "sendmail",
          from: d.from ?? "",
          testAddress: d.testAddress ?? "",
          smtp: d.smtp ?? {},
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.post("/admin/email/config", {
        provider: config.provider,
        from: config.from,
        smtp: config.smtp,
      });
      toast.success("Email configuration saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!config.testAddress?.trim()) {
      toast.error("Enter a test email address");
      return;
    }
    setSending(true);
    try {
      await api.post("/admin/email/test", { to: config.testAddress.trim() });
      toast.success("Test email sent");
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to send test email");
    } finally {
      setSending(false);
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
          <h1 className="text-2xl font-bold tracking-tight">Email</h1>
          <p className="text-muted-foreground mt-1">Configure the email provider and send test emails</p>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
          <CardDescription>Settings are stored in the backend. Use Sendmail (default) or SMTP.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label>Provider</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={config.provider}
              onChange={(e) => setConfig((c) => ({ ...c, provider: e.target.value }))}
            >
              <option value="sendmail">Sendmail (default)</option>
              <option value="smtp">SMTP</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Default from address</Label>
            <Input
              value={config.from}
              onChange={(e) => setConfig((c) => ({ ...c, from: e.target.value }))}
              placeholder="noreply@example.com"
            />
          </div>
          {config.provider === "smtp" && (
            <>
              <div className="grid gap-2">
                <Label>SMTP host</Label>
                <Input
                  value={config.smtp?.host ?? ""}
                  onChange={(e) => setConfig((c) => ({ ...c, smtp: { ...c.smtp, host: e.target.value } }))}
                  placeholder="smtp.example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label>SMTP port</Label>
                <Input
                  type="number"
                  value={config.smtp?.port ?? 587}
                  onChange={(e) => setConfig((c) => ({ ...c, smtp: { ...c.smtp, port: Number(e.target.value) || 587 } }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>SMTP user</Label>
                <Input
                  value={config.smtp?.user ?? ""}
                  onChange={(e) => setConfig((c) => ({ ...c, smtp: { ...c.smtp, user: e.target.value } }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>SMTP password</Label>
                <Input
                  type="password"
                  value={config.smtp?.pass ?? ""}
                  onChange={(e) => setConfig((c) => ({ ...c, smtp: { ...c.smtp, pass: e.target.value } }))}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Test email</CardTitle>
          <CardDescription>Send a test email to verify the configuration.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="grid gap-2 flex-1">
            <Label>Recipient</Label>
            <Input
              value={config.testAddress}
              onChange={(e) => setConfig((c) => ({ ...c, testAddress: e.target.value }))}
              placeholder="you@example.com"
            />
          </div>
          <Button className="gap-2" onClick={sendTest} disabled={sending}>
            <Send className="w-4 h-4" />
            {sending ? "Sending…" : "Send test email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
