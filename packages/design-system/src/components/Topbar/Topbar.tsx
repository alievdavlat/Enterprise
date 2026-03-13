import * as React from "react";

export interface TopbarProps {
  children: React.ReactNode;
  className?: string;
}

export function Topbar({ children, className = "" }: TopbarProps) {
  return (
    <header className={`flex h-14 items-center border-b bg-background px-4 ${className}`}>
      {children}
    </header>
  );
}
