"use client";

/**
 * AnimatedTooltip — overlapping avatar list, each shows a tooltip with name + role on hover.
 * Inspired by ui.aceternity.com.
 *
 * CSS hover state only (no motion lib) — keeps the bundle slim.
 */
import * as React from "react";
import { cn } from "../lib/utils";

export interface AnimatedTooltipItem {
  id: number | string;
  name: string;
  designation?: string;
  image: string;
}

export interface AnimatedTooltipProps {
  items: AnimatedTooltipItem[];
  className?: string;
}

export function AnimatedTooltip({ items, className }: AnimatedTooltipProps) {
  return (
    <div className={cn("flex items-center -space-x-3", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className="group/at relative inline-block"
        >
          <div
            className={cn(
              "absolute -top-14 left-1/2 -translate-x-1/2 z-50",
              "opacity-0 translate-y-2 transition-all duration-200",
              "group-hover/at:opacity-100 group-hover/at:translate-y-0 pointer-events-none",
            )}
          >
            <div className="relative bg-black text-white px-3 py-1.5 rounded-md text-xs whitespace-nowrap shadow-xl">
              <div className="font-bold">{item.name}</div>
              {item.designation && (
                <div className="text-zinc-300 text-[10px]">
                  {item.designation}
                </div>
              )}
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-black rotate-45" />
            </div>
          </div>
          <img
            src={item.image}
            alt={item.name}
            className="size-10 rounded-full border-2 border-white object-cover transition-transform duration-200 group-hover/at:scale-110 group-hover/at:-translate-y-0.5"
          />
        </div>
      ))}
    </div>
  );
}
