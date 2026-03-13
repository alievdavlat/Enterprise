import * as React from "react";
const variantClasses = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};
export function Badge({ variant = "primary", size = "md", children, className = "", }) {
    const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-0.5";
    return (<span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClass} ${className}`}>
      {children}
    </span>);
}
//# sourceMappingURL=Badge.jsx.map