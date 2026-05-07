"use client";

/**
 * MovingBorder + MovingBorderButton — gradient border that runs around the perimeter.
 * Inspired by ui.aceternity.com.
 *
 * Uses CSS `conic-gradient` + rotation on a pseudo element. No motion lib needed.
 */
import * as React from "react";
import { cn } from "../lib/utils";

export interface MovingBorderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  duration?: number;
  borderRadius?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function MovingBorderButton({
  children,
  className,
  containerClassName,
  borderClassName,
  duration = 4,
  borderRadius = "1.75rem",
  as = "button",
  ...props
}: MovingBorderProps & React.ButtonHTMLAttributes<HTMLElement>) {
  return React.createElement(
    as,
    {
      className: cn(
        "relative bg-transparent overflow-hidden p-[1px] inline-flex items-center justify-center",
        containerClassName,
      ),
      style: { borderRadius },
      ...props,
    },
    <>
      <span
        className={cn(
          "absolute inset-0 ds-moving-border",
          borderClassName,
        )}
        style={{
          borderRadius,
          background:
            "conic-gradient(from var(--mb-angle, 0deg), transparent 60%, #4f46e5, #06b6d4 80%, transparent 90%)",
          animationDuration: `${duration}s`,
        }}
      />
      <span
        className={cn(
          "relative z-10 flex items-center justify-center bg-zinc-950 text-white px-5 py-2 text-sm font-medium",
          className,
        )}
        style={{ borderRadius: `calc(${borderRadius} - 1px)` }}
      >
        {children}
      </span>
      <style>{`
        @property --mb-angle {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }
        @keyframes ds-mb-rotate {
          from { --mb-angle: 0deg; }
          to   { --mb-angle: 360deg; }
        }
        .ds-moving-border {
          animation-name: ds-mb-rotate;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </>,
  );
}
