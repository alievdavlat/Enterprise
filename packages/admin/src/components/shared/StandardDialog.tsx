"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@enterprise/design-system";
import { cn } from "@/lib/utils";

export type StandardDialogSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<StandardDialogSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

// Inline-style fallback in case Tailwind's responsive max-w-* class doesn't
// land (Tailwind v4 dev-server scanning of design-system dist has been
// flaky). Numbers match the Tailwind scale.
const SIZE_REM: Record<StandardDialogSize, number> = {
  sm: 28,
  md: 32,
  lg: 42,
  xl: 56,
};

export interface StandardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Animated SVG illustration shown above the title. Defaults to none. */
  illustration?: React.ReactNode;
  /** Tone tints the illustration backdrop ring. */
  tone?: "violet" | "blue" | "emerald" | "amber" | "rose";
  title: string;
  description?: React.ReactNode;
  /** Body content (forms, lists, etc.). */
  children?: React.ReactNode;
  /** Footer slot — typically Cancel + primary action buttons. */
  footer?: React.ReactNode;
  /** Standard size keyword. Defaults to `md` (sm:max-w-lg = 512px). */
  size?: StandardDialogSize;
  /** Extra Tailwind on the DialogContent. */
  className?: string;
}

const TONE_RING: Record<NonNullable<StandardDialogProps["tone"]>, string> = {
  violet: "from-violet-500/20 to-transparent",
  blue: "from-blue-500/20 to-transparent",
  emerald: "from-emerald-500/20 to-transparent",
  amber: "from-amber-500/20 to-transparent",
  rose: "from-rose-500/20 to-transparent",
};

/**
 * Standard modal chrome for the whole admin. Every dialog in the app
 * should ideally use this so size, header layout, illustration slot,
 * and footer alignment stay identical surface-to-surface.
 *
 * Anatomy (top → bottom):
 *   - Illustration (optional) in a soft radial backdrop
 *   - Title
 *   - Description (optional)
 *   - Body (children)
 *   - Footer (right-aligned buttons)
 *
 * Sizes:
 *   sm = 448px · md = 512px (default) · lg = 672px · xl = 896px
 */
export function StandardDialog({
  open,
  onOpenChange,
  illustration,
  tone = "violet",
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: StandardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(SIZE_CLASSES[size], className)}
        style={{ maxWidth: `min(calc(100vw - 2rem), ${SIZE_REM[size]}rem)` }}>
        {illustration && (
          <div
            className={cn(
              "relative flex items-center justify-center -mx-4 -mt-4 mb-1 pt-6 pb-2 overflow-hidden",
              "bg-gradient-to-b",
              TONE_RING[tone],
            )}>
            <div className="relative">{illustration}</div>
          </div>
        )}
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children && <div className="space-y-3">{children}</div>}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
