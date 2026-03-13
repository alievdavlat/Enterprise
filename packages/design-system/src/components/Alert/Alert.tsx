import * as React from "react";

export type AlertVariant = "default" | "success" | "warning" | "destructive";

export interface AlertProps {
  variant?: AlertVariant;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  default: "border bg-background text-foreground",
  success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
  destructive: "border-destructive/50 bg-destructive/10 text-destructive",
};

export function Alert({ variant = "default", title, children, className = "" }: AlertProps) {
  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${variantClasses[variant]} ${className}`}
    >
      {title && <h5 className="mb-1 font-medium leading-none">{title}</h5>}
      <div className="text-sm [&_p]:leading-relaxed">{children}</div>
    </div>
  );
}
