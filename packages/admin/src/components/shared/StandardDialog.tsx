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
  /** Animated SVG illustration shown above the title. */
  illustration?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** Body content (forms, lists, etc.). */
  children?: React.ReactNode;
  /** Footer slot — typically Cancel + primary action buttons. */
  footer?: React.ReactNode;
  /**
   * Standard size keyword. Defaults to `lg` (≈672px) — that's the canonical
   * "Add new assets" footprint. Every dialog in the admin should default to
   * this so they all look the same width/height.
   */
  size?: StandardDialogSize;
  /** Extra Tailwind on the DialogContent. */
  className?: string;
  /**
   * @deprecated Kept for source compatibility — tone is now ignored.
   * Previous versions tinted the illustration band per-action (rose for
   * delete, amber for warning, ...). User feedback: backgrounds shouldn't
   * vary between dialogs. The band now uses one neutral subtle backdrop
   * for every dialog so they feel like the same surface.
   */
  tone?: "violet" | "blue" | "emerald" | "amber" | "rose";
}

/**
 * Standard modal chrome for the whole admin. Every dialog in the app
 * should ideally use this so size, header layout, illustration slot,
 * and footer alignment stay identical surface-to-surface.
 *
 * Anatomy (top → bottom):
 *   - Illustration (optional) over a neutral subtle backdrop band
 *   - Title
 *   - Description (optional)
 *   - Body (children)
 *   - Footer (right-aligned buttons)
 *
 * Sizes:
 *   sm = 448 · md = 512 · lg = 672 (default) · xl = 896
 */
export function StandardDialog({
  open,
  onOpenChange,
  illustration,
  title,
  description,
  children,
  footer,
  size = "lg",
  className,
}: StandardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(SIZE_CLASSES[size], className)}
        style={{ maxWidth: `min(calc(100vw - 2rem), ${SIZE_REM[size]}rem)` }}>
        {illustration && (
          <div className="relative flex items-center justify-center -mx-4 -mt-4 mb-1 pt-8 pb-4 overflow-hidden bg-muted/40 dark:bg-muted/15">
            <div className="relative">{illustration}</div>
          </div>
        )}
        <DialogHeader>
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
