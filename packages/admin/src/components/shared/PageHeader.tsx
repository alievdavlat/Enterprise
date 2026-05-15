"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  /** Primary icon shown in a tinted square next to the title. */
  icon?: LucideIcon;
  /** Optional eyebrow line (e.g. "Settings", "Content Manager"). */
  eyebrow?: string;
  /** The main page heading. */
  title: string;
  /** One-line description below the title. */
  description?: string;
  /** Right-side slot for action buttons. */
  actions?: React.ReactNode;
  /** Optional extra row of content (filters, tabs, etc.) below the title. */
  toolbar?: React.ReactNode;
  /** Visual variant for the icon tint. Defaults to "primary". */
  variant?: "primary" | "violet" | "blue" | "emerald" | "amber" | "rose";
  /** Extra Tailwind on the outer wrapper. */
  className?: string;
}

const VARIANT_CLASSES: Record<
  NonNullable<PageHeaderProps["variant"]>,
  string
> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  violet: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40",
  blue: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40",
  emerald: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
  amber: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
  rose: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40",
};

/**
 * Standard page-header for every admin route. Replaces the ad-hoc
 * "icon + title + description" / "just title + description" pairs that
 * shipped per-page before — same chrome everywhere so the surface reads
 * as one product.
 *
 * Layout: icon tile (left) → eyebrow + h1 + description → actions (right).
 * Stays single-row on desktop, wraps cleanly on small screens.
 */
export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
  toolbar,
  variant = "primary",
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-300",
        className,
      )}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          {Icon && (
            <div
              className={cn(
                "hidden sm:flex w-12 h-12 rounded-xl items-center justify-center border shrink-0",
                VARIANT_CLASSES[variant],
              )}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div className="space-y-1 min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
      {toolbar && <div>{toolbar}</div>}
    </header>
  );
}
