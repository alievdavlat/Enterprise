"use client";

import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BooleanFieldProps {
  value: unknown;
  onChange: (value: boolean | null) => void;
  /** Allow a third "unset" state. Defaults to false. */
  nullable?: boolean;
}

/**
 * Segmented Yes / No toggle. Replaces the bare Switch — visual state is
 * obvious at a glance, you can hit either option directly instead of
 * inferring which side means "true", and accessibility uses real
 * radiogroup semantics.
 *
 * When `nullable` is set the field also exposes an "Unset" option so
 * users can clear the value to `null` (useful when boolean fields are
 * optional and `null` semantically differs from `false`).
 */
export function BooleanField({ value, onChange, nullable = false }: BooleanFieldProps) {
  const current: boolean | null =
    value === true ? true : value === false ? false : null;

  const options: Array<{
    value: boolean | null;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    activeClass: string;
  }> = [
    {
      value: true,
      label: "Yes",
      icon: Check,
      activeClass: "bg-emerald-100 text-emerald-700 ring-emerald-400/40 dark:bg-emerald-950/50 dark:text-emerald-300",
    },
    {
      value: false,
      label: "No",
      icon: X,
      activeClass: "bg-rose-100 text-rose-700 ring-rose-400/40 dark:bg-rose-950/50 dark:text-rose-300",
    },
  ];
  if (nullable) {
    options.push({
      value: null,
      label: "Unset",
      icon: Minus,
      activeClass: "bg-muted text-muted-foreground ring-border",
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Boolean value"
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = current === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ring-1 ring-transparent",
              "focus-visible:outline-none focus-visible:ring-ring/40",
              active
                ? opt.activeClass + " shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60",
            )}>
            <Icon className="w-3.5 h-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
