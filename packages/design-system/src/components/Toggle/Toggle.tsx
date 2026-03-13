import * as React from "react";

export interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  className?: string;
}

export function Toggle({ checked, onChange, disabled, label, className = "" }: ToggleProps) {
  return (
    <label className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-primary" : "bg-input"}`}
      >
        <span
          className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow ring-0 transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`}
        />
      </button>
      {label && <span className="text-sm font-medium">{label}</span>}
    </label>
  );
}
