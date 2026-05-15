import { cn } from "../lib/utils";

/**
 * Skeleton block.
 *
 * - `variant="pulse"` (default): solid muted block with `animate-pulse`.
 * - `variant="shimmer"`: linear-gradient sweep. Requires the consuming app's
 *   global CSS to ship the `animate-shimmer` keyframe/class (admin already
 *   does — see `packages/admin/src/app/globals.css`).
 */
function Skeleton({
  className,
  variant = "pulse",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "pulse" | "shimmer";
}) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      className={cn(
        "rounded-md",
        variant === "pulse" && "bg-muted animate-pulse",
        variant === "shimmer" && "animate-shimmer",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
