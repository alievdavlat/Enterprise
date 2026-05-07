"use client";

/**
 * BentoGrid + BentoGridItem — Apple-inspired feature grid.
 * Inspired by ui.aceternity.com.
 */
import * as React from "react";
import { cn } from "../lib/utils";

export function BentoGrid({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface BentoGridItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
  ...props
}: BentoGridItemProps) {
  return (
    <div
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-zinc-900 dark:border-zinc-800 bg-white border border-transparent justify-between flex flex-col space-y-4",
        className,
      )}
      {...props}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        {title && (
          <div className="font-sans font-bold text-foreground mb-2 mt-2">
            {title}
          </div>
        )}
        {description && (
          <div className="font-sans font-normal text-muted-foreground text-xs">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
