import * as React from "react";
export function Select({ options, value, onChange, label, placeholder = "Select...", error, disabled, className = "", }) {
    const id = React.useId();
    return (<div className="space-y-2">
      {label && (<label htmlFor={id} className="text-sm font-medium leading-none">
          {label}
        </label>)}
      <select id={id} value={value ?? ""} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (<option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>))}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>);
}
//# sourceMappingURL=Select.jsx.map