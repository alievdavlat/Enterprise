import * as React from "react";

export interface EmptyStateProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center ${className}`}>
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      {title && <h3 className="text-lg font-semibold">{title}</h3>}
      {description && <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
