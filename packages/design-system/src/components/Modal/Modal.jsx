import * as React from "react";
export function Modal({ open, onClose, title, children, footer, className = "" }) {
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden/>
      <div role="dialog" aria-modal="true" className={`relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg ${className}`}>
        {title && (<div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-accent" aria-label="Close">
              ×
            </button>
          </div>)}
        <div>{children}</div>
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>);
}
//# sourceMappingURL=Modal.jsx.map