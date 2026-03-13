import * as React from "react";
import type { InputProps } from "../../types";

export function Input({
  label,
  hint,
  error,
  leftAddon,
  rightAddon,
  className = "",
  id,
  ...rest
}: InputProps) {
  const inputId = id || React.useId();
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium leading-none">
          {label}
        </label>
      )}
      <div className="flex rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {leftAddon && (
          <span className="inline-flex items-center rounded-l-md border-r border-input px-3 text-sm text-muted-foreground">
            {leftAddon}
          </span>
        )}
        <input
          id={inputId}
          className={`flex h-10 w-full rounded-md border-0 bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${leftAddon ? "rounded-l-none" : ""} ${rightAddon ? "rounded-r-none" : ""} ${className}`}
          {...rest}
        />
        {rightAddon && (
          <span className="inline-flex items-center rounded-r-md border-l border-input px-3 text-sm text-muted-foreground">
            {rightAddon}
          </span>
        )}
      </div>
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
