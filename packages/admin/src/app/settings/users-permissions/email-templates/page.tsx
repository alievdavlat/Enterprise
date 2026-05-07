"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Pencil,
  Plus,
  Save,
  Trash2,
  Eye,
  Code2,
  ArrowLeft,
  Send,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
} from "@enterprise/design-system";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type BodyMode = "html" | "markdown" | "plain";

type EmailTemplate = {
  id: number;
  name: string;
  displayName: string;
  subject: string;
  body: string;
  bodyType?: BodyMode;
  fromName?: string | null;
  fromEmail?: string | null;
  responseEmail?: string | null;
};

type DraftTemplate = Omit<EmailTemplate, "id"> & { id: number };

const DEFAULT_TEMPLATES: Array<Omit<EmailTemplate, "id">> = [
  {
    name: "reset_password",
    displayName: "Reset password",
    subject: "Reset your password",
    bodyType: "html",
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
  <h1 style="margin:0 0 16px; font-size:22px; font-weight:600;">Reset your password</h1>
  <p style="line-height:1.6; color:#475569;">Hi <strong>{{ user.firstName }}</strong>,</p>
  <p style="line-height:1.6; color:#475569;">We received a request to reset your password. Click the button below to choose a new one. The link expires in 60 minutes.</p>
  <p style="margin: 28px 0;">
    <a href="{{ link }}" style="display:inline-block; padding: 12px 22px; background:#4f46e5; color:#fff; border-radius:8px; text-decoration:none; font-weight:600;">Reset password</a>
  </p>
  <p style="font-size:12px; color:#94a3b8;">If you did not request this, you can safely ignore this email.</p>
</div>`,
    fromName: "Enterprise CMS",
    fromEmail: "noreply@example.com",
  },
  {
    name: "email_confirmation",
    displayName: "Email address confirmation",
    subject: "Confirm your email",
    bodyType: "markdown",
    body: `Welcome to **Enterprise CMS** 🎉

Hi {{ user.firstName }}, please confirm your email address by clicking the link below:

[Confirm my email]({{ link }})

If you didn't create this account, simply ignore this message.

— The Enterprise team`,
    fromName: "Enterprise CMS",
    fromEmail: "noreply@example.com",
  },
];

const VARIABLES = [
  "{{ user.firstName }}",
  "{{ user.lastName }}",
  "{{ user.email }}",
  "{{ user.username }}",
  "{{ link }}",
  "{{ code }}",
  "{{ url }}",
];

// ─────── tiny markdown→html (no external dep) ───────
function mdToHtml(md: string): string {
  let html = md;
  // escape HTML first
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // headings
  html = html.replace(/^###### (.*)$/gm, "<h6>$1</h6>");
  html = html.replace(/^##### (.*)$/gm, "<h5>$1</h5>");
  html = html.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");
  // bold/italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  // images
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img alt="$1" src="$2" style="max-width:100%;border-radius:6px"/>'
  );
  // links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" style="color:#4f46e5;text-decoration:underline;">$1</a>'
  );
  // inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-family:ui-monospace,monospace;font-size:0.9em">$1</code>'
  );
  // unordered lists
  html = html.replace(/^[*\-] (.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  // paragraphs (split on blank lines, ignore lines that already contain a block tag)
  const blocks = html.split(/\n\n+/);
  html = blocks
    .map((b) => {
      const trimmed = b.trim();
      if (!trimmed) return "";
      if (/^<(h\d|ul|ol|p|blockquote|pre|table|div|img)/.test(trimmed))
        return trimmed;
      return `<p style="line-height:1.6;color:#334155;margin:0 0 1em;">${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
  return html;
}

function buildPreview(body: string, mode: BodyMode): string {
  const css = `
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#0f172a; padding:24px; max-width:600px; margin:0 auto; background:#fff; }
  h1,h2,h3,h4 { color:#0f172a; }
  a { color:#4f46e5; }
  pre { background:#f1f5f9; padding:12px; border-radius:6px; overflow:auto; }
</style>`;
  if (mode === "html") return `<!doctype html><html><head>${css}</head><body>${body}</body></html>`;
  if (mode === "markdown")
    return `<!doctype html><html><head>${css}</head><body>${mdToHtml(body)}</body></html>`;
  return `<!doctype html><html><head>${css}</head><body><pre style="white-space:pre-wrap;font-family:inherit;">${body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre></body></html>`;
}

// ────────────────────────────────────────────────────────

export default function EmailTemplatesPage() {
  const [list, setList] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<DraftTemplate | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testOpen, setTestOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/email-templates");
      const data = (res.data?.data ?? []) as EmailTemplate[];
      setList(data);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      for (const tpl of DEFAULT_TEMPLATES) {
        await api.post("/admin/email-templates", tpl);
      }
      toast.success("Default templates created");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to seed defaults");
    } finally {
      setSeeding(false);
    }
  };

  const openCreate = () =>
    setDraft({
      id: 0,
      name: "",
      displayName: "",
      subject: "",
      body: "",
      bodyType: "html",
      fromName: "",
      fromEmail: "",
      responseEmail: "",
    });

  const openEdit = (t: EmailTemplate) => setDraft({ ...t });

  const save = async () => {
    if (!draft) return;
    if (!draft.name?.trim() || !draft.subject?.trim() || !draft.body?.trim()) {
      toast.error("Name, subject and body are required");
      return;
    }
    setSaving(true);
    try {
      if (draft.id) {
        await api.put(`/admin/email-templates/${draft.id}`, draft);
      } else {
        await api.post("/admin/email-templates", draft);
      }
      toast.success("Template saved");
      setDraft(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (t: EmailTemplate) => {
    if (!confirm(`Delete template "${t.displayName || t.name}"?`)) return;
    try {
      await api.delete(`/admin/email-templates/${t.id}`);
      toast.success("Template deleted");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to delete");
    }
  };

  const sendTest = async () => {
    if (!draft || !testEmail.trim()) {
      toast.error("Enter a recipient email");
      return;
    }
    try {
      await api.post(`/admin/email-templates/${draft.id || 0}/test`, {
        to: testEmail.trim(),
        template: draft,
      });
      toast.success(`Test email queued to ${testEmail}`);
      setTestOpen(false);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.error?.message ||
          "Test send failed (configure email plugin first)"
      );
    }
  };

  // ──── EDITOR VIEW ────
  if (draft) {
    return <Editor draft={draft} setDraft={setDraft} onSave={save} saving={saving} onClose={() => setDraft(null)} onTestSend={() => setTestOpen(true)} />;
  }

  // ──── LIST VIEW ────
  return (
    <>
      <div className="p-8 space-y-6 animate-in fade-in duration-300">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Email templates</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Customize the emails sent by Users &amp; Permissions and other plugins
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {list.length === 0 && !loading && (
              <Button variant="outline" onClick={seedDefaults} disabled={seeding} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Seed defaults
              </Button>
            )}
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Add template
            </Button>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Templates</CardTitle>
            <CardDescription>
              Variables like <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{"{{ link }}"}</code>,{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{"{{ user.email }}"}</code> are
              replaced before sending.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading…</div>
            ) : list.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No templates yet. Use "Seed defaults" to create the standard ones.
              </div>
            ) : (
              <TableRoot>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold uppercase text-xs">Template</TableHead>
                    <TableHead className="font-semibold uppercase text-xs">Subject</TableHead>
                    <TableHead className="font-semibold uppercase text-xs">From</TableHead>
                    <TableHead className="font-semibold uppercase text-xs">Format</TableHead>
                    <TableHead className="text-right font-semibold uppercase text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((t) => (
                    <TableRow key={t.id} className="border-border/50">
                      <TableCell>
                        <div className="font-medium">{t.displayName || t.name}</div>
                        <code className="text-xs text-muted-foreground">{t.name}</code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{t.subject}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {t.fromName ? `${t.fromName} ` : ""}
                        {t.fromEmail ? `<${t.fromEmail}>` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="uppercase text-[10px]">
                          {t.bodyType ?? "html"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(t)} className="gap-1">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(t)}
                            className="gap-1 text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send test email</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Recipient</Label>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendTest} className="gap-2">
              <Send className="w-4 h-4" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ──────────────────────── EDITOR ────────────────────────
function Editor({
  draft,
  setDraft,
  onSave,
  saving,
  onClose,
  onTestSend,
}: {
  draft: DraftTemplate;
  setDraft: (d: DraftTemplate | null) => void;
  onSave: () => void;
  saving: boolean;
  onClose: () => void;
  onTestSend: () => void;
}) {
  const mode: BodyMode = draft.bodyType ?? "html";
  const previewSrc = useMemo(() => buildPreview(draft.body, mode), [draft.body, mode]);

  const insertVariable = (v: string) => {
    setDraft({ ...draft, body: draft.body + (draft.body.endsWith(" ") ? "" : " ") + v });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {draft.id ? `Edit: ${draft.displayName || draft.name}` : "New template"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {draft.subject || "Untitled subject"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {draft.id ? (
              <Button variant="outline" size="sm" onClick={onTestSend} className="gap-1.5">
                <Send className="w-3.5 h-3.5" /> Test send
              </Button>
            ) : null}
            <Button onClick={onSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-5 max-w-7xl mx-auto">
          {/* Top fields */}
          <Card className="border-border/60">
            <CardContent className="p-5 grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Internal name</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="reset_password"
                  disabled={!!draft.id}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Lowercase, snake_case. Used as the lookup key — cannot be changed once created.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Display name</Label>
                <Input
                  value={draft.displayName}
                  onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                  placeholder="Reset password"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Subject</Label>
                <Input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  placeholder="Reset your password"
                />
              </div>
              <div className="space-y-1.5">
                <Label>From name</Label>
                <Input
                  value={draft.fromName ?? ""}
                  onChange={(e) => setDraft({ ...draft, fromName: e.target.value })}
                  placeholder="Enterprise CMS"
                />
              </div>
              <div className="space-y-1.5">
                <Label>From email</Label>
                <Input
                  value={draft.fromEmail ?? ""}
                  onChange={(e) => setDraft({ ...draft, fromEmail: e.target.value })}
                  placeholder="noreply@example.com"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Reply-to (optional)</Label>
                <Input
                  value={draft.responseEmail ?? ""}
                  onChange={(e) => setDraft({ ...draft, responseEmail: e.target.value })}
                  placeholder="support@example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Designer */}
          <Card className="border-border/60">
            <CardHeader className="border-b py-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Body</CardTitle>
                  <Badge variant="secondary" className="uppercase text-[10px]">
                    {mode}
                  </Badge>
                </div>
                <Tabs value={mode} onValueChange={(v) => setDraft({ ...draft, bodyType: v as BodyMode })}>
                  <TabsList className="bg-muted/40">
                    <TabsTrigger value="html" className="gap-1.5 text-xs">
                      <Code2 className="w-3.5 h-3.5" /> HTML
                    </TabsTrigger>
                    <TabsTrigger value="markdown" className="gap-1.5 text-xs">
                      <FileText className="w-3.5 h-3.5" /> Markdown
                    </TabsTrigger>
                    <TabsTrigger value="plain" className="gap-1.5 text-xs">
                      Plain
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-b bg-muted/20 px-4 py-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">Insert:</span>
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    onClick={() => insertVariable(v)}
                    className="text-xs font-mono bg-background hover:bg-primary hover:text-primary-foreground border border-border px-2 py-0.5 rounded transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="grid lg:grid-cols-2">
                {/* Source */}
                <div className="border-r flex flex-col min-h-[480px]">
                  <div className="px-4 py-2 border-b bg-muted/10 flex items-center gap-2 text-xs text-muted-foreground">
                    <Code2 className="w-3.5 h-3.5" /> Source
                  </div>
                  <Textarea
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    placeholder={
                      mode === "html"
                        ? "<p>Hello {{ user.firstName }}…</p>"
                        : mode === "markdown"
                          ? "Hello **{{ user.firstName }}** …"
                          : "Hello {{ user.firstName }} …"
                    }
                    className={cn(
                      "flex-1 resize-none border-0 focus-visible:ring-0 rounded-none",
                      "font-mono text-sm leading-relaxed"
                    )}
                  />
                </div>

                {/* Preview */}
                <div className="flex flex-col min-h-[480px] bg-muted/10">
                  <div className="px-4 py-2 border-b bg-muted/10 flex items-center gap-2 text-xs text-muted-foreground">
                    <Eye className="w-3.5 h-3.5" /> Live preview
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    <div className="bg-white shadow-sm rounded-md overflow-hidden border border-border/40">
                      <iframe
                        title="email-preview"
                        srcDoc={previewSrc}
                        sandbox=""
                        className="w-full bg-white"
                        style={{ minHeight: 400 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
