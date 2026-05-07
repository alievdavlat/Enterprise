"use client";

/**
 * AuroraBackground — soft animated aurora mesh, perfect for hero sections, login pages, etc.
 * Inspired by ui.aceternity.com.
 *
 * Pure CSS animation, zero JS overhead. Wrap any content with `showRadialGradient`
 * to dim corners (vignette).
 */
import * as React from "react";
import { cn } from "../lib/utils";

export interface AuroraBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  showRadialGradient?: boolean;
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col h-[100vh] items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-foreground overflow-hidden isolate",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          // 3 stacked gradient layers, each animated via translate keyframes
          "absolute inset-[-10px] opacity-50 will-change-transform pointer-events-none",
          "[--white-gradient:repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)]",
          "[--dark-gradient:repeating-linear-gradient(100deg,#000_0%,#000_7%,transparent_10%,transparent_12%,#000_16%)]",
          "[--aurora:repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)]",
          "[background-image:var(--white-gradient),var(--aurora)]",
          "dark:[background-image:var(--dark-gradient),var(--aurora)]",
          "[background-size:300%_200%]",
          "[background-position:50%_50%,50%_50%]",
          "filter blur-[10px]",
          "after:content-[''] after:absolute after:inset-0",
          "after:[background-image:var(--white-gradient),var(--aurora)]",
          "after:dark:[background-image:var(--dark-gradient),var(--aurora)]",
          "after:[background-size:200%_100%] after:[background-attachment:fixed] after:mix-blend-difference",
          "ds-aurora",
          showRadialGradient &&
            "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]",
        )}
      />
      <style>{`
        @keyframes ds-aurora {
          0%   { background-position: 50% 50%, 50% 50%; }
          100% { background-position: 350% 50%, 350% 50%; }
        }
        .ds-aurora {
          animation: ds-aurora 60s linear infinite;
        }
        .ds-aurora::after {
          animation: ds-aurora 60s linear infinite;
        }
      `}</style>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
