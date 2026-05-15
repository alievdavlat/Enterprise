"use client";

import { Card, CardContent } from "@enterprise/design-system";
import { cn } from "@/lib/utils";

export interface EmptyCardProps {
  /** Animated Illustration component (e.g. `<IllustrationNoData size={140} />`). */
  illustration?: React.ReactNode;
  /** Headline (e.g. "No webhooks yet"). */
  title: string;
  /** Helper text below the title. */
  description?: React.ReactNode;
  /** Optional CTA — typically a Button or anchor. */
  action?: React.ReactNode;
  /** Extra Tailwind on the wrapper. */
  className?: string;
  /** Render without the outer Card chrome. Defaults to false. */
  bare?: boolean;
}

/**
 * Standard empty state for list/table pages. Centers an animated SVG
 * illustration over a title + description + optional CTA. Drop-in
 * replacement for the bespoke "circle-with-icon + headline + helper"
 * pattern that shipped per-page before.
 *
 * Pick illustrations from `@/components/illustrations`:
 *   - `IllustrationNoData`   — generic "nothing here yet"
 *   - `IllustrationSearch`   — "no search results"
 *   - `IllustrationError`    — "something went wrong"
 *   - `IllustrationBuilding` — "feature coming soon"
 *   - `IllustrationKey`      — auth / tokens / providers
 *   - `IllustrationCode`     — routes / middlewares / cron
 *   - `IllustrationDocument` — folders / files / templates
 *   - `IllustrationDatabase` — content types / migrations
 *
 * All illustrations are animated by default (float, pulse-glow, etc).
 */
export function EmptyCard({
  illustration,
  title,
  description,
  action,
  className,
  bare = false,
}: EmptyCardProps) {
  const body = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className,
      )}>
      {illustration && <div className="mb-2">{illustration}</div>}
      <p className="text-lg font-medium mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );

  if (bare) return body;

  return (
    <Card className="border-border/50 border-dashed">
      <CardContent className="p-0">{body}</CardContent>
    </Card>
  );
}
