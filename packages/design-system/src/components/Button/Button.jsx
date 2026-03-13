import * as React from "react";
export function Button({ variant = "primary", size = "md", loading, icon, iconRight, children, className = "", disabled, ...rest }) {
    const sizeClass = size === "sm" ? "text-sm px-3 py-1.5" : size === "lg" ? "text-lg px-6 py-3" : "text-base px-4 py-2";
    const variantClass = variant === "secondary"
        ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        : variant === "danger"
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : variant === "success"
                ? "bg-green-600 text-white hover:bg-green-700"
                : variant === "ghost"
                    ? "hover:bg-accent hover:text-accent-foreground"
                    : variant === "link"
                        ? "text-primary underline-offset-4 hover:underline"
                        : "bg-primary text-primary-foreground hover:bg-primary/90";
    return (<button type="button" className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${sizeClass} ${variantClass} ${className}`} disabled={disabled || loading} {...rest}>
      {loading ? (<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"/>) : (icon)}
      {children}
      {!loading && iconRight}
    </button>);
}
//# sourceMappingURL=Button.jsx.map