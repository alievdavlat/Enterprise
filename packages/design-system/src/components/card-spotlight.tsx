"use client";

/**
 * CardSpotlight — card with a cursor-following radial spotlight.
 * Inspired by ui.aceternity.com.
 */
import * as React from "react";
import { cn } from "../lib/utils";

export interface CardSpotlightProps
  extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string;
  radius?: number;
}

export function CardSpotlight({
  children,
  className,
  spotlightColor = "rgba(120, 119, 198, 0.25)",
  radius = 350,
  onMouseMove: onMouseMoveProp,
  ...props
}: CardSpotlightProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [active, setActive] = React.useState(false);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
    onMouseMoveProp?.(e);
  };

  return (
    <div
      ref={ref}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseMove={onMove}
      className={cn(
        "group/spot relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-200",
        className,
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(${radius}px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
