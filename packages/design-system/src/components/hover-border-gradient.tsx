"use client";

/**
 * HoverBorderGradient — button/wrapper with a moving gradient border on hover.
 * Inspired by ui.aceternity.com.
 */
import * as React from "react";
import { cn } from "../lib/utils";

type Direction = "TOP" | "RIGHT" | "BOTTOM" | "LEFT";

const directionMap: Record<Direction, string> = {
  TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  RIGHT:
    "radial-gradient(16.6% 43.1% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  BOTTOM:
    "radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  LEFT: "radial-gradient(16.2% 41.2% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
};

const HIGHLIGHT =
  "radial-gradient(75% 181% at 50% 50%, #3275F8 0%, rgba(255, 255, 255, 0) 100%)";

export interface HoverBorderGradientProps
  extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements;
  containerClassName?: string;
  duration?: number;
  clockwise?: boolean;
}

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  ...props
}: HoverBorderGradientProps) {
  const [hovered, setHovered] = React.useState(false);
  const [direction, setDirection] = React.useState<Direction>("TOP");

  const rotateDirection = React.useCallback(
    (current: Direction): Direction => {
      const directions: Direction[] = clockwise
        ? ["TOP", "LEFT", "BOTTOM", "RIGHT"]
        : ["TOP", "RIGHT", "BOTTOM", "LEFT"];
      const idx = directions.indexOf(current);
      return directions[(idx + 1) % directions.length];
    },
    [clockwise],
  );

  React.useEffect(() => {
    if (hovered) return;
    const id = setInterval(() => {
      setDirection((prev) => rotateDirection(prev));
    }, duration * 1000);
    return () => clearInterval(id);
  }, [hovered, rotateDirection, duration]);

  // Use createElement so the polymorphic `as` prop type-checks cleanly.
  return React.createElement(
    Tag,
    {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      className: cn(
        "relative flex rounded-full content-center items-center flex-col flex-nowrap gap-10 h-min justify-center overflow-visible p-px decoration-clone w-fit",
        containerClassName,
      ),
      ...props,
    },
    <>
      <div
        className={cn(
          "w-auto z-10 bg-black text-white px-4 py-2 rounded-[inherit]",
          className,
        )}
      >
        {children}
      </div>
      <div
        className="flex-none inset-0 overflow-hidden absolute z-0 rounded-[inherit] transition-[background] duration-500"
        style={{
          background: hovered ? HIGHLIGHT : directionMap[direction],
          filter: "blur(2px)",
        }}
      />
      <div className="bg-black absolute z-1 flex-none inset-[2px] rounded-[100px]" />
    </>,
  );
}
