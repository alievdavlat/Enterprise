"use client";

/**
 * BeamsBackground — animated diagonal beams of light.
 * Inspired by ui.aceternity.com.
 */
import * as React from "react";
import { cn } from "../lib/utils";

export interface BeamsBackgroundProps
  extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "subtle" | "medium" | "strong";
}

export function BeamsBackground({
  children,
  className,
  intensity = "medium",
  ...props
}: BeamsBackgroundProps) {
  const opacity =
    intensity === "subtle" ? 0.3 : intensity === "strong" ? 0.85 : 0.55;

  const beams = React.useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        left: 10 + i * 12,
        delay: i * 0.7,
        duration: 8 + (i % 4) * 2,
      })),
    [],
  );

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-zinc-950 isolate",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {beams.map((b, i) => (
          <span
            key={i}
            className="ds-beam absolute top-[-30%] h-[160%] w-[6px] bg-gradient-to-b from-transparent via-blue-400 to-transparent blur-md"
            style={{
              left: `${b.left}%`,
              opacity,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes ds-beam-shift {
          0%   { transform: translateY(-30%) rotate(15deg); opacity: 0; }
          25%  { opacity: 1; }
          75%  { opacity: 1; }
          100% { transform: translateY(30%) rotate(15deg); opacity: 0; }
        }
        .ds-beam {
          animation: ds-beam-shift linear infinite;
          transform-origin: top;
        }
      `}</style>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
