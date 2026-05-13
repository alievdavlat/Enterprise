"use client";

import { Button } from "@enterprise/design-system";
import type { LucideIcon } from "lucide-react";

/**
 * Empty state used across every builder panel. Visually identical so the
 * "we have no data yet" experience is consistent and inviting instead of a
 * line of grey text.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  return (
    <div className="relative px-6 py-16 md:py-20 text-center overflow-hidden">
      {/* Soft glow + grid hint behind the icon — makes the empty state feel
          designed rather than minimal. */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, hsl(var(--primary) / 0.06), transparent 60%)",
        }}
      />
      <div className="relative max-w-md mx-auto space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
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
