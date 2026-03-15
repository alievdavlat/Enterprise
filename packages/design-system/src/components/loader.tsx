import * as React from "react";

export interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Loader({ size = "md", className = "" }: LoaderProps) {
  const sizeClass = size === "sm" ? "h-4 w-4 border-2" : size === "lg" ? "h-10 w-10 border-3" : "h-6 w-6 border-2";
  return (
    <span
      className={`inline-block animate-spin rounded-full border-solid border-current border-t-transparent ${sizeClass} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
