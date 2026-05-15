"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Trash2,
  FileCode,
  Plus,
  Circle,
  CircleCheck,
  CircleDot,
  Loader2,
  RotateCcw,
  Power,
  PowerOff,
} from "lucide-react";
import {
  Button,
  Input,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Kbd,
  KbdGroup,
} from "@enterprise/design-system";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { javascript } from "@codemirror/lang-javascript";
import { json as jsonLang } from "@codemirror/lang-json";
import {
  BUILDER_KINDS,
  isBuilderKind,
  type BuilderKind,
  type BuilderKindConfig,
  type BuilderKindField,
} from "@/components/builder/kindConfig";
import { UnsavedChangesDialog } from "@/components/shared";

// CodeMirror loaded client-side only — it touches `window`.
const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((m) => m.default),
  { ssr: false },
);

type Row = Record<string, unknown> & { id: number; enabled?: boolean | number };

export function BuilderEditorView() {
  const params = useParams();
  const router = useRouter();
  const rawKind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const kind = (rawKind || "") as BuilderKind;
  const id = rawId ?? "new";

  if (!isBuilderKind(kind)) {
    return (
      <div className="p-12 text-center">
        <FileCode className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
        <p className="font-semibold">Unknown builder kind</p>
        <p className="text-sm text-muted-foreground mt-1">
          <code className="bg-muted px-1 rounded">{kind}</code> is not a known
          resource type.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/settings/builder">Back to Builder</Link>
        </Button>
      </div>
    );
  }

  const config = BUILDER_KINDS[kind];
  return <BuilderEditorInner config={config} idParam={id} router={router} />;
}

function BuilderEditorInner({
  config,
  idParam,
  router,
}: {
  config: BuilderKindConfig;
  idParam: string;
  router: ReturnType<typeof useRouter>;
}) {
  const isNew = idParam === "new";
  const numericId = isNew ? null : Number(idParam);

  const [list, setList] = useState<Row[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [form, setForm] = useState<Record<string, unknown>>(() =>
    initialForm(config),
  );
  const [code, setCode] = useState<string>(config.defaultCode);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const baselineRef = useRef<string>("");

  const compositeKey = useMemo(
    () => JSON.stringify({ form, code, enabled }),
    [form, code, enabled],
  );
  const isDirty = compositeKey !== baselineRef.current;

  // Stabilize the CodeMirror extensions so the editor doesn't re-mount its
  // language pack on every render — that's what triggered the "multiple
  // instances of @codemirror/state" error in earlier passes.
  const cmExtensions = useMemo(
    () => getCodeMirrorExtensions(config.codeLanguage),
    [config.codeLanguage],
  );

  const [unsavedOpen, setUnsavedOpen] = useState(false);
  const pendingNavRef = useRef<string | null>(null);

  // Load the existing row.
  useEffect(() => {
    if (isNew) {
      const init = initialForm(config);
      setForm(init);
      setCode(config.defaultCode);
      setEnabled(true);
      baselineRef.current = JSON.stringify({
        form: init,
        code: config.defaultCode,
        enabled: true,
      });
      setLoading(false);
      return;
    }
    if (numericId == null || Number.isNaN(numericId)) {
      toast.error("Invalid id");
      router.replace("/settings/builder");
      return;
    }
    setLoading(true);
    api
      .get(`/admin/${config.resourcePath}/${numericId}`)
      .then((res) => {
        const row = (res.data?.data ?? null) as Row | null;
        if (!row) throw new Error("not found");
        const formInit: Record<string, unknown> = {};
        for (const f of config.metadataFields) {
          formInit[f.name] = row[f.name] ?? f.defaultValue ?? "";
        }
        setForm(formInit);
        const codeInit = (row[config.codeField] as string) ?? config.defaultCode;
        setCode(codeInit);
        const enabledInit = !!row.enabled;
        setEnabled(enabledInit);
        baselineRef.current = JSON.stringify({
          form: formInit,
          code: codeInit,
          enabled: enabledInit,
        });
      })
      .catch(() => {
        toast.error(`Failed to load ${config.label.toLowerCase()}`);
        router.replace("/settings/builder");
      })
      .finally(() => setLoading(false));
  }, [config, isNew, numericId, router]);

  // Load the file-tree list (sidebar).
  const loadList = useCallback(() => {
    setListLoading(true);
    api
      .get(`/admin/${config.resourcePath}`)
      .then((res) => setList((res.data?.data ?? []) as Row[]))
      .catch(() => setList([]))
      .finally(() => setListLoading(false));
  }, [config.resourcePath]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // beforeunload guard.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Cmd/Ctrl+S to save.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isDirty && !saving) void handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, saving, form, code, enabled]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    // Validate required fields.
    for (const f of config.metadataFields) {
      if (f.required && !String(form[f.name] ?? "").trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        [config.codeField]: code,
        enabled,
      };
      if (isNew) {
        const res = await api.post(`/admin/${config.resourcePath}`, payload);
        const created = (res.data?.data ?? null) as Row | null;
        toast.success(`${config.label} created`);
        baselineRef.current = JSON.stringify({ form, code, enabled });
        if (created?.id) {
          router.replace(`/settings/builder/${config.kind}/${created.id}`);
        }
      } else {
        await api.put(`/admin/${config.resourcePath}/${numericId}`, payload);
        toast.success(`${config.label} saved`);
        baselineRef.current = JSON.stringify({ form, code, enabled });
        loadList();
      }
    } catch (e) {
      toast.error(asMsg(e) ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }, [
    config,
    form,
    code,
    enabled,
    isNew,
    numericId,
    router,
    saving,
    loadList,
  ]);

  const handleDelete = useCallback(async () => {
    if (numericId == null) return;
    if (!confirm(`Delete this ${config.label.toLowerCase()}? This cannot be undone.`))
      return;
    setDeleting(true);
    try {
      await api.delete(`/admin/${config.resourcePath}/${numericId}`);
      toast.success(`${config.label} deleted`);
      baselineRef.current = compositeKey; // suppress unsaved guard
      router.replace(`/settings/builder/${config.kind}/new`);
      loadList();
    } catch (e) {
      toast.error(asMsg(e) ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  }, [config, numericId, router, compositeKey, loadList]);

  const attemptNavigate = useCallback(
    (href: string) => {
      if (isDirty && !saving) {
        pendingNavRef.current = href;
        setUnsavedOpen(true);
      } else {
        router.push(href);
      }
    },
    [isDirty, saving, router],
  );

  const setField = (name: string, value: unknown) =>
    setForm((f) => ({ ...f, [name]: value }));

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border/60 bg-card/50">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2"
            onClick={() => attemptNavigate("/settings/builder")}>
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Builder</span>
          </Button>
          <span className="text-muted-foreground/60">/</span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
              config.tint,
            )}>
            <config.icon className="w-3.5 h-3.5" />
            {config.pluralLabel}
          </span>
          <span className="text-muted-foreground/60">/</span>
          <span className="font-mono text-sm font-medium truncate flex items-center gap-1.5">
            {isNew ? "untitled" : config.filenameOf({ ...form } as Row)}
            {isDirty && (
              <CircleDot className="w-3 h-3 text-amber-500 shrink-0" />
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!isNew && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5",
                enabled
                  ? "text-emerald-600 hover:text-emerald-700"
                  : "text-muted-foreground",
              )}
              onClick={() => setEnabled((v) => !v)}>
              {enabled ? (
                <Power className="w-4 h-4" />
              ) : (
                <PowerOff className="w-4 h-4" />
              )}
              <span className="hidden md:inline">
                {enabled ? "Enabled" : "Disabled"}
              </span>
            </Button>
          )}
          {!isNew && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              loading={deleting}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={!isDirty && !isNew}
            className="gap-2">
            <Save className="w-4 h-4" />
            <span>Save</span>
            <KbdGroup className="hidden lg:inline-flex opacity-70">
              <Kbd>⌘</Kbd>
              <Kbd>S</Kbd>
            </KbdGroup>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar — file tree ─────────────────────────── */}
        <aside className="w-64 border-r border-border/60 bg-card/30 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {config.pluralLabel}
            </span>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={loadList}
              title="Refresh">
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {listLoading ? (
              <div className="px-3 py-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-6 bg-muted/50 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : list.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground italic">
                No {config.pluralLabel.toLowerCase()} yet
              </p>
            ) : (
              list.map((row) => {
                const active = !isNew && row.id === numericId;
                const fname = config.filenameOf(row);
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() =>
                      attemptNavigate(
                        `/settings/builder/${config.kind}/${row.id}`,
                      )
                    }
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors",
                      active
                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                        : "text-foreground/80 hover:bg-muted/50 border-l-2 border-transparent",
                    )}>
                    <FileCode className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    <span className="truncate flex-1 font-mono">{fname}</span>
                    {row.enabled ? (
                      <CircleCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-border/60 p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() =>
                attemptNavigate(`/settings/builder/${config.kind}/new`)
              }>
              <Plus className="w-3.5 h-3.5" />
              New {config.label.toLowerCase()}
            </Button>
          </div>
        </aside>

        {/* ── Main editor area ─────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : (
            <>
              {/* Metadata card */}
              <div className="border-b border-border/60 bg-card/40 px-5 py-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  {config.metadataFields.map((field) => (
                    <MetadataField
                      key={field.name}
                      field={field}
                      value={form[field.name] ?? ""}
                      onChange={(v) => setField(field.name, v)}
                      isEditing={!isNew}
                    />
                  ))}
                </div>
              </div>

              {/* Code editor */}
              <div className="flex-1 overflow-hidden bg-[var(--editor-bg)] relative">
                <CodeMirror
                  value={code}
                  height="100%"
                  className="h-full text-[13px]"
                  theme="dark"
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    foldGutter: true,
                    bracketMatching: true,
                    indentOnInput: true,
                    autocompletion: true,
                  }}
                  extensions={cmExtensions}
                  onChange={(value) => setCode(value)}
                />
              </div>

              {/* Status bar */}
              <footer className="flex items-center justify-between gap-3 px-4 py-1 border-t border-border/60 bg-zinc-900 text-zinc-300 text-[11px]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    {saving ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                      </>
                    ) : isDirty ? (
                      <>
                        <CircleDot className="w-3 h-3 text-amber-400" /> Unsaved
                      </>
                    ) : isNew ? (
                      <>
                        <Circle className="w-3 h-3" /> Draft
                      </>
                    ) : (
                      <>
                        <CircleCheck className="w-3 h-3 text-emerald-400" /> Saved
                      </>
                    )}
                  </span>
                  <span className="text-zinc-500">·</span>
                  <span className="capitalize">{config.codeLanguage}</span>
                  <span className="text-zinc-500">·</span>
                  <span>{code.split("\n").length} lines</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>UTF-8</span>
                  <span className="text-zinc-500">·</span>
                  <span>LF</span>
                </div>
              </footer>
            </>
          )}
        </main>
      </div>

      <UnsavedChangesDialog
        open={unsavedOpen}
        onOpenChange={(o) => {
          setUnsavedOpen(o);
          if (!o) pendingNavRef.current = null;
        }}
        onDiscard={() => {
          setUnsavedOpen(false);
          const target = pendingNavRef.current;
          pendingNavRef.current = null;
          if (target) router.push(target);
        }}
      />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function MetadataField({
  field,
  value,
  onChange,
  isEditing,
}: {
  field: BuilderKindField;
  value: unknown;
  onChange: (v: unknown) => void;
  isEditing: boolean;
}) {
  const disabled = isEditing && field.lockOnEdit;
  const span = field.span === 2 ? "sm:col-span-2" : "";
  if (field.type === "switch") {
    return (
      <div className={`flex items-center gap-2 ${span}`}>
        <Switch
          checked={!!value}
          onCheckedChange={onChange}
          disabled={disabled}
        />
        <Label>{field.label}</Label>
      </div>
    );
  }
  return (
    <div className={`space-y-1 ${span}`}>
      <Label htmlFor={`meta-${field.name}`} className="text-xs">
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {field.type === "textarea" ? (
        <Textarea
          id={`meta-${field.name}`}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          rows={2}
          className="font-mono text-xs"
        />
      ) : field.type === "select" ? (
        <Select
          value={String(value ?? "")}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}>
          <SelectTrigger id={`meta-${field.name}`}>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={`meta-${field.name}`}
          type={field.type === "number" ? "number" : "text"}
          value={String(value ?? "")}
          onChange={(e) =>
            onChange(field.type === "number" ? Number(e.target.value) : e.target.value)
          }
          placeholder={field.placeholder}
          disabled={disabled}
          className="h-8 font-mono"
        />
      )}
      {field.helper && (
        <p className="text-[10px] text-muted-foreground">{field.helper}</p>
      )}
    </div>
  );
}

function initialForm(config: BuilderKindConfig): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  for (const field of config.metadataFields) {
    f[field.name] = field.defaultValue ?? "";
  }
  return f;
}

function asMsg(e: unknown): string | undefined {
  return (
    e as { response?: { data?: { error?: { message?: string } } } }
  )?.response?.data?.error?.message;
}

function getCodeMirrorExtensions(language: "javascript" | "typescript" | "json") {
  // Static imports above — runtime require() splits @codemirror/state into
  // separate module instances under Turbopack, which breaks the extension
  // identity check.
  if (language === "json") return [jsonLang()];
  return [javascript({ jsx: false, typescript: language === "typescript" })];
}
