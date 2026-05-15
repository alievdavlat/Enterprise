"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 h-8 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors file:h-6 file:text-sm file:font-medium focus-visible:ring-3 aria-invalid:ring-3 md:text-sm w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Password input with built-in show/hide eye toggle. Drop-in for the bare
 * `<Input type="password" />` pattern — keeps the same className API so
 * forms don't need other layout changes.
 */
function PasswordInput({
  className,
  showToggleAriaLabel = "Show password",
  hideToggleAriaLabel = "Hide password",
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  showToggleAriaLabel?: string;
  hideToggleAriaLabel?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative w-full">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        className={cn("pr-9", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? hideToggleAriaLabel : showToggleAriaLabel}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-1.5 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <Icon className="w-3.5 h-3.5" aria-hidden />
      </button>
    </div>
  );
}

export { Input, PasswordInput };
