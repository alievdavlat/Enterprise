"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@enterprise/design-system";
import { Copy, Check, AlignLeft, AlertCircle } from "lucide-react";
import { json as jsonLang } from "@codemirror/lang-json";
import { useTheme } from "next-themes";

const CodeMirror = dynamic(
  () => import("@uiw/react-codemirror").then((m) => m.default),
  { ssr: false },
);

export interface JsonFieldProps {
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string;
}

/**
 * Robust JSON editor.
 *
 * The previous implementation parsed on every keystroke and threw the
 * raw string back when parse failed — fine until the parent re-rendered
 * with the parsed object and CodeMirror's value got reset. That made
 * editing impossible because the cursor jumped on every partial token.
 *
 * Here we keep a local `text` state that mirrors exactly what the user
 * sees. Changes always update the local text first. We propagate to the
 * parent in two cases:
 *   - The text parses cleanly → send the parsed value (object/array).
 *   - The text is empty → send `undefined` so the field clears.
 * Otherwise we hold the text locally and surface a small "Invalid JSON"
 * banner, letting the user finish typing without losing focus.
 */
export function JsonField({ value, onChange, placeholder }: JsonFieldProps) {
  // Track theme so the editor matches admin chrome (light/dark).
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  // Stringify the parent value into our initial buffer. We only do this
  // when the *parent* hands us a value we didn't just produce — see the
  // ref dance below.
  const lastEmittedRef = useRef<string>("");
  const initial = useMemo(() => stringify(value), [value]);
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // External value updates (eg. form reset, server re-fetch) should
  // overwrite the buffer — but only if the parent's value isn't already
  // what we last propagated. Without this guard, our own onChange would
  // round-trip through the parent and clobber the typing.
  useEffect(() => {
    const next = stringify(value);
    if (next !== lastEmittedRef.current && next !== text) {
      setText(next);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (code: string) => {
    setText(code);
    if (code.trim() === "") {
      lastEmittedRef.current = "";
      setError(null);
      onChange(undefined);
      return;
    }
    try {
      const parsed = JSON.parse(code);
      lastEmittedRef.current = code;
      setError(null);
      onChange(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
      // Do NOT propagate — we'd corrupt the parent's state with a half
      // typed string. The buffer stays in local state until valid.
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(text);
      const pretty = JSON.stringify(parsed, null, 2);
      setText(pretty);
      lastEmittedRef.current = pretty;
      setError(null);
      onChange(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot format invalid JSON");
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard might be blocked (insecure context etc.) — silently skip.
    }
  };

  return (
    <div className="rounded-lg border border-input bg-background overflow-hidden text-xs">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-2 py-1.5">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <code className="font-mono">{"{ }"}</code>
          <span>JSON</span>
          {error && (
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-3 h-3" />
              <span className="truncate max-w-[260px]">{error}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="gap-1.5 text-[11px]"
            onClick={formatJson}
            disabled={!text.trim()}>
            <AlignLeft className="w-3 h-3" /> Format
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="gap-1.5 text-[11px]"
            onClick={copyJson}
            disabled={!text}>
            {copied ? (
              <>
                <Check className="w-3 h-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </Button>
        </div>
      </div>
      <CodeMirror
        value={text}
        height="200px"
        theme={theme}
        extensions={[jsonLang()]}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          foldGutter: true,
          autocompletion: false,
        }}
        onChange={handleChange}
        placeholder={placeholder ?? "{\n  \"key\": \"value\"\n}"}
      />
    </div>
  );
}

function stringify(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
