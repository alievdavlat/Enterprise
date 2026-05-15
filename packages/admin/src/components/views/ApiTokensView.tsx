"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ApiTokensHeader,
  ApiTokensEmptyState,
  ApiTokensTable,
} from "@/components/shared/settings";
import { ListSkeleton } from "@/components/shared";
import {
  useApiTokens,
  useCreateApiToken,
  useUpdateApiToken,
  useDeleteApiToken,
} from "@/hooks/useApiTokens";
import {
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Input,
  Label,
  Textarea,
  Button,
} from "@enterprise/design-system";
import type { ApiToken, ApiTokenType, CreateApiTokenPayload } from "@/types";
import { Copy, Check, RefreshCw, KeyRound } from "lucide-react";

const TOKEN_TYPES: { value: ApiTokenType; label: string; description: string }[] =
  [
    {
      value: "read-only",
      label: "Read-only",
      description: "GET requests only across the API",
    },
    {
      value: "full-access",
      label: "Full Access",
      description: "All operations on every endpoint",
    },
    {
      value: "custom",
      label: "Custom",
      description: "Configure permissions per endpoint",
    },
  ];

type DialogMode = "create" | "edit" | null;

export function ApiTokensView() {
  const { data: tokens = [], isLoading } = useApiTokens();
  const create = useCreateApiToken();
  const update = useUpdateApiToken();
  const remove = useDeleteApiToken();

  const [mode, setMode] = useState<DialogMode>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateApiTokenPayload>({
    name: "",
    description: "",
    type: "read-only",
  });
  const [createdToken, setCreatedToken] = useState<ApiToken | null>(null);
  const [copied, setCopied] = useState(false);

  const openCreate = () => {
    setForm({ name: "", description: "", type: "read-only" });
    setEditingId(null);
    setCreatedToken(null);
    setMode("create");
  };

  const openEdit = (token: ApiToken) => {
    setForm({
      name: token.name,
      description: token.description ?? "",
      type: (token.type as ApiTokenType) ?? "read-only",
    });
    setEditingId(token.id);
    setCreatedToken(null);
    setMode("edit");
  };

  const closeDialog = () => {
    setMode(null);
    setEditingId(null);
    setCreatedToken(null);
    setCopied(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Token name is required");
      return;
    }
    try {
      if (mode === "create") {
        const created = await create.mutateAsync(form);
        toast.success(`Token "${created.name}" created`);
        setCreatedToken(created);
      } else if (mode === "edit" && editingId !== null) {
        await update.mutateAsync({ id: editingId, payload: form });
        toast.success("Token updated");
        closeDialog();
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.error?.message ||
          (mode === "create" ? "Failed to create token" : "Failed to update token"),
      );
    }
  };

  const handleRegenerate = async () => {
    if (editingId === null) return;
    if (!confirm("Regenerate access key? The old key will stop working immediately.")) return;
    try {
      const updated = await update.mutateAsync({
        id: editingId,
        payload: { regenerate: true },
      });
      toast.success("Access key regenerated");
      setCreatedToken(updated);
    } catch {
      toast.error("Failed to regenerate key");
    }
  };

  const handleDelete = (token: ApiToken) => {
    if (!confirm(`Delete token "${token.name}"?`)) return;
    remove.mutate(token.id, {
      onSuccess: () => toast.success("Token deleted"),
      onError: () => toast.error("Failed to delete token"),
    });
  };

  const copyKey = (key?: string) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Access key copied");
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <ApiTokensHeader onCreateClick={openCreate} />

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : tokens.length === 0 ? (
        <ApiTokensEmptyState onCreateClick={openCreate} />
      ) : (
        <ApiTokensTable
          tokens={tokens}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={mode !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Create new API token" : "Edit API token"}
            </DialogTitle>
            <DialogDescription>
              API tokens give programmatic access. Treat them like passwords.
            </DialogDescription>
          </DialogHeader>

          {createdToken?.accessKey ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
                <p className="font-semibold mb-1 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Copy this key now — you won't see it again
                </p>
                <p className="text-muted-foreground text-xs">
                  Treat the key like a password. Store it in your secrets manager.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-md border">
                <code className="flex-1 text-xs font-mono break-all">
                  {createdToken.accessKey}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyKey(createdToken.accessKey)}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={closeDialog}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Frontend App"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="What is this token used for?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Token type</Label>
                <div className="grid gap-2">
                  {TOKEN_TYPES.map((t) => (
                    <label
                      key={t.value}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        form.type === t.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="token-type"
                        value={t.value}
                        checked={form.type === t.value}
                        onChange={() =>
                          setForm((f) => ({ ...f, type: t.value }))
                        }
                        className="mt-1 accent-primary"
                      />
                      <div>
                        <p className="font-medium text-sm">{t.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {mode === "edit" && (
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3 flex items-start justify-between gap-3">
                  <div className="text-xs">
                    <p className="font-medium">Regenerate access key</p>
                    <p className="text-muted-foreground mt-0.5">
                      Replaces the existing key with a new one.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    className="gap-2 shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate
                  </Button>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={create.isPending || update.isPending}
                >
                  {mode === "create"
                    ? create.isPending
                      ? "Creating…"
                      : "Create token"
                    : update.isPending
                      ? "Saving…"
                      : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
