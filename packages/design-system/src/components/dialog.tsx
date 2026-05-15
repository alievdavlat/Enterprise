"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { cn } from "../lib/utils";
import { Button } from "./button";
import { XIcon } from "lucide-react";

function Dialog({ modal = true, ...props }: DialogPrimitive.Root.Props) {
  return (
    <DialogPrimitive.Root data-slot="dialog" modal={modal} {...props} />
  );
}

type DialogTriggerProps = DialogPrimitive.Trigger.Props & { asChild?: boolean };

function DialogTrigger({ asChild, children, ...props }: DialogTriggerProps) {
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...(asChild && React.Children.only(children) != null
        ? { render: React.Children.only(children) as React.ReactElement }
        : { children })}
      {...props}
    />
  );
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 bg-black/40 duration-200 supports-backdrop-filter:bg-black/30 supports-backdrop-filter:backdrop-blur-md fixed inset-0 isolate z-50",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  style,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // Chrome + animation.
          "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-open:slide-in-from-bottom-3 data-closed:slide-out-to-bottom-2 ring-foreground/10 grid gap-4 rounded-xl p-4 text-sm ring-1 shadow-2xl shadow-black/20 duration-200 ease-out outline-none",
          // Position. Width handled via inline style below so the cap
          // survives Tailwind v4 not picking up `sm:max-w-*` from dist
          // files in a dev-server reload.
          "fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
          className,
        )}
        style={{
          maxWidth: "min(calc(100vw - 2rem), 32rem)",
          ...style,
        }}
        {...props}>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm">
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            }
          />
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("gap-2 flex flex-col", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "bg-muted/50 -mx-4 -mb-4 rounded-b-xl border-t p-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}>
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          render={<Button variant="outline">Close</Button>}
        />
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-none font-medium", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-muted-foreground *:[a]:hover:text-foreground text-sm *:[a]:underline *:[a]:underline-offset-3",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
