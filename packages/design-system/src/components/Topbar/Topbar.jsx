import * as React from "react";
export function Topbar({ children, className = "" }) {
    return (<header className={`flex h-14 items-center border-b bg-background px-4 ${className}`}>
      {children}
    </header>);
}
//# sourceMappingURL=Topbar.jsx.map