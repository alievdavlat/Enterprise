"use client";

import { Button } from "@enterprise/design-system";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IllustrationNoData } from "@/components/illustrations";

/**
 * Empty state used across every builder panel. Visually identical so the
 * "we have no data yet" experience is consistent and inviting instead of a
 * line of grey text.
 *
 * Phase 36 upgrade: each panel can opt into a custom SVG illustration via
 * the `illustration` prop. When omitted we fall back to the generic
 * `IllustrationNoData` so existing callers keep working.
 */
export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  ctaLabel,
  onCta,
}: {
  icon?: LucideIcon;
  /** Custom SVG illustration. If unset, IllustrationNoData is used. */
  illustration?: ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <div className="relative px-6 py-16 md:py-20 text-center overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
      <div className="relative max-w-md mx-auto space-y-5">
        <div className="flex justify-center">
          {illustration ?? (
            Icon ? (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl ring-glow bg-background">
                <Icon className="w-8 h-8 text-primary" />
              </div>
            ) : (
              <IllustrationNoData size={160} className="animate-float-slow" />
            )
          )}
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <Button onClick={onCta} size="lg" className="shadow-sm hover:shadow-md transition-shadow">
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}

/**
 * Skeleton rows shown while a panel's data is fetching. Avoids the layout
 * shift you get with a "Loading…" centered string.
 */
export function PanelLoadingSkeleton() {
  return (
    <div className="p-4 space-y-2 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-12 bg-muted/40 rounded-lg" />
      ))}
    </div>
  );
}
