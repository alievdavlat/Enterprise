"use client";

/**
 * Meteors — falling diagonal "meteor" lines for hero backgrounds.
 * Inspired by ui.aceternity.com.
 */
import * as React from "react";
import { cn } from "../lib/utils";

export interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 20, className }: MeteorsProps) {
  const meteors = React.useMemo(
    () =>
      Array.from({ length: number }).map((_, idx) => ({
        idx,
        top: -5,
        left: Math.floor(Math.random() * 100) + "%",
        delay: Math.random() * 0.6 + 0.2,
        duration: Math.random() * (10 - 2) + 2,
      })),
    [number],
  );

  return (
    <>
      {meteors.map((m) => (
        <span
          key={m.idx}
          className={cn(
            "ds-meteor pointer-events-none absolute h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className,
          )}
          style={{
            top: m.top,
            left: m.left,
            animationDelay: m.delay + "s",
            animationDuration: m.duration + "s",
          }}
        />
      ))}
      <style>{`
        @keyframes ds-meteor {
          0%   { transform: rotate(215deg) translateX(0); opacity: 1; }
          70%  { opacity: 1; }
          100% { transform: rotate(215deg) translateX(-500px); opacity: 0; }
        }
        .ds-meteor {
          animation: ds-meteor 5s linear infinite;
        }
      `}</style>
    </>
  );
}
