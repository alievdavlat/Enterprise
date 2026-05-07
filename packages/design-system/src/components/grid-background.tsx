"use client";

/**
 * GridBackground — subtle dotted/lined grid pattern as a section background.
 * Inspired by ui.aceternity.com.
 */
import * as React from "react";
import { cn } from "../lib/utils";

export interface GridBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "dot" | "line";
  fade?: boolean;
}

export function GridBackground({
  children,
  className,
  variant = "line",
  fade = true,
  ...props
}: GridBackgroundProps) {
  const pattern =
    variant === "dot"
      ? "[background-image:radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:18px_18px]"
      : "[background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px]";

  return (
    <div
      className={cn("relative overflow-hidden bg-zinc-950", className)}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-0 pointer-events-none",
          pattern,
          fade && "[mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]",
        )}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
