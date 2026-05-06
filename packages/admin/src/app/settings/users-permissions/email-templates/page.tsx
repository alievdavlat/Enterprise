"use client";

import { useEffect, useState } from "react";
import { FileText, Pencil, Plus, Save, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
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
} from "@enterprise/design-system";
import { api } from "@/lib/api";
import { toast } from "sonner";

type EmailTemplate = {
  id: number;
  name: string;
  displayName: string;
  subject: string;
  body: string;
  fromName?: string | null;
  fromEmail?: string | null;
  responseEmail?: string | null;
};

const DEFAULT_TEMPLATES: Array<Omit<EmailTemplate, "id">> = [
  {
    name: "reset_password",
    displayName: "Reset password",
    subject: "Reset your password",
    body: "Hello,\n\nWe received a request to reset your password. Click the link below to choose a new one:\n\n{{ link }}\n\nIf you did not request this, you can safely ignore this email.",
    fromName: "Enterprise CMS",
    fromEmail: "noreply@example.com",
  },
  {
    name: "email_confirmation",
    displayName: "Email address confirmation",
    subject: "Confirm your email address",
    body: "Welcome to Enterprise CMS!\n\nPlease confirm your email by clicking the link below:\n\n{{ link }}",
    fromName: "Enterprise CMS",
    fromEmail: "noreply@example.com",
  },
];

export default function EmailTemplatesPage() {
  const [list, setList] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setSaving(true);
    try {
      for (const tpl of DEFAULT_TEMPLATES) {
        await api.post("/admin/email-templates", tpl);
      }
      toast.success("Default templates created");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to seed defaults");
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditing({
      id: 0,
      name: "",
      displayName: "",
      subject: "",
      body: "",
      fromName: "",
      fromEmail: "",
      responseEmail: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (t: EmailTemplate) => {
    setEditing({ ...t });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name?.trim() || !editing.subject?.trim() || !editing.body?.trim()) {
      toast.error("Name, subject and body are required");
      return;
    }
    setSaving(true);
    try {
      if (editing.id) {
        await api.put(`/admin/email-templates/${editing.id}`, editing);
      } else {
        await api.post("/admin/email-templates", editing);
      }
      toast.success("Template saved");
      setDialogOpen(false);
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to save template");
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

  return (
    <div className="p-8 max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Email templates</h1>
            <p className="text-muted-foreground mt-1">
              Customize the emails sent by Users &amp; Permissions
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {list.length === 0 && !loading && (
            <Button variant="outline" onClick={seedDefaults} disabled={saving}>
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
            Variables like <code>{"{{ link }}"}</code>, <code>{"{{ user.email }}"}</code> are
            replaced before sending.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No templates yet. Use “Seed defaults” to create the standard ones, or add your own.
            </div>
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold uppercase text-xs">Name</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Subject</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">From</TableHead>
                  <TableHead className="text-right font-semibold uppercase text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((t) => (
                  <TableRow key={t.id} className="border-border/50">
                    <TableCell className="font-medium">
                      {t.displayName || t.name}
                      <div className="text-xs text-muted-foreground">{t.name}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.subject}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.fromName ? `${t.fromName} ` : ""}
                      {t.fromEmail ? `<${t.fromEmail}>` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(t)} className="gap-1">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(t)} className="gap-1 text-destructive">
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit template" : "New template"}</DialogTitle>
            <DialogDescription>
              {editing?.id
                ? "Update the email template fields below."
                : "Fill in the template fields. Use {{ variable }} placeholders."}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Internal name</Label>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="reset_password"
                  disabled={!!editing.id}
                />
              </div>
              <div className="grid gap-2">
                <Label>Display name</Label>
                <Input
                  value={editing.displayName}
                  onChange={(e) => setEditing({ ...editing, displayName: e.target.value })}
                  placeholder="Reset password"
                />
              </div>
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Input
                  value={editing.subject}
                  onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                  placeholder="Reset your password"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>From name</Label>
                  <Input
                    value={editing.fromName ?? ""}
                    onChange={(e) => setEditing({ ...editing, fromName: e.target.value })}
                    placeholder="Enterprise CMS"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>From email</Label>
                  <Input
                    value={editing.fromEmail ?? ""}
                    onChange={(e) => setEditing({ ...editing, fromEmail: e.target.value })}
                    placeholder="noreply@example.com"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Response (Reply-To)</Label>
                <Input
                  value={editing.responseEmail ?? ""}
                  onChange={(e) => setEditing({ ...editing, responseEmail: e.target.value })}
                  placeholder="support@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label>Body</Label>
                <Textarea
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  rows={8}
                  placeholder={"Hello,\n\nClick the link: {{ link }}"}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); }}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
