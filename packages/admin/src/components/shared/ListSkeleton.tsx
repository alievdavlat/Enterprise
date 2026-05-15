"use client";

import { Skeleton, Card, CardContent } from "@enterprise/design-system";

export interface ListSkeletonProps {
  /** Number of rows to render. Defaults to 5. */
  rows?: number;
  /** Wrap the rows in the shared Card chrome. Defaults to true. */
  card?: boolean;
  /** Use shimmer animation instead of pulse. Defaults to "pulse". */
  variant?: "pulse" | "shimmer";
  /** Extra Tailwind on the outer wrapper. */
  className?: string;
}

/**
 * List/table loading state used across settings pages (webhooks, audit
 * logs, content history, etc). Renders evenly-spaced rectangles that
 * approximate a real row so users see structure instead of a centered
 * "Loading…" string.
 */
export const ListSkeleton = ({
  rows = 5,
  card = true,
  variant = "pulse",
  className,
}: ListSkeletonProps) => {
  const body = (
    <div className={`flex flex-col divide-y divide-border/40 ${className ?? ""}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton variant={variant} className="size-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton
              variant={variant}
              className="h-3.5 w-[40%] rounded"
              style={{ animationDelay: `${i * 80}ms` }}
            />
            <Skeleton
              variant={variant}
              className="h-3 w-[65%] rounded"
              style={{ animationDelay: `${i * 80 + 40}ms` }}
            />
          </div>
          <Skeleton variant={variant} className="h-7 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );

  if (!card) return body;

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">{body}</CardContent>
    </Card>
  );
};
