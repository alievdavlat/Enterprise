"use client";

/**
 * BackgroundGradient — animated gradient halo around any container (testimonial cards, CTAs).
 * Inspired by ui.aceternity.com.
 *
 * Wraps `children` with a blurred animated multicolor gradient ring + an inner solid surface.
 */
import * as React from "react";
import { cn } from "../lib/utils";

export interface BackgroundGradientProps
  extends React.HTMLAttributes<HTMLDivElement> {
  containerClassName?: string;
  animate?: boolean;
}

export function BackgroundGradient({
  children,
  className,
  containerClassName,
  animate = true,
  ...props
}: BackgroundGradientProps) {
  return (
    <div className={cn("relative p-[3px] group", containerClassName)} {...props}>
      <div
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] opacity-60 group-hover:opacity-100 blur-xl transition duration-500 will-change-transform",
          "bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)]",
          animate && "ds-bg-gradient-anim",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 rounded-3xl z-[1] will-change-transform",
          "bg-[radial-gradient(circle_farthest-side_at_0_100%,#00ccb1,transparent),radial-gradient(circle_farthest-side_at_100%_0,#7b61ff,transparent),radial-gradient(circle_farthest-side_at_100%_100%,#ffc414,transparent),radial-gradient(circle_farthest-side_at_0_0,#1ca0fb,#141316)]",
          animate && "ds-bg-gradient-anim",
        )}
      />
      <div className={cn("relative z-10", className)}>{children}</div>
      <style>{`
        @keyframes ds-bg-gradient-spin {
          0%   { background-position: 0% 0%; }
          50%  { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }
        .ds-bg-gradient-anim {
          background-size: 400% 400%;
          animation: ds-bg-gradient-spin 5s ease infinite;
        }
      `}</style>
    </div>
  );
}
