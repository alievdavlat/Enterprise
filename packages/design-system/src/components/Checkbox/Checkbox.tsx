import * as React from "react";

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  className?: string;
}

export function Checkbox({ checked, onChange, disabled, label, className = "" }: CheckboxProps) {
  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-input"
      />
      {label && <span className="text-sm font-medium">{label}</span>}
    </label>
  );
}
