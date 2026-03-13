import * as React from "react";

export interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function Sidebar({ children, className = "" }: SidebarProps) {
  return (
    <aside className={`flex h-full w-64 flex-col border-r bg-sidebar text-sidebar-foreground ${className}`}>
      {children}
    </aside>
  );
}

export function SidebarHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex h-16 items-center border-b px-4 ${className}`}>{children}</div>;
}

export function SidebarContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex-1 overflow-y-auto py-4 ${className}`}>{children}</div>;
}

export function SidebarFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-t p-4 ${className}`}>{children}</div>;
}

export function SidebarMenu({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <nav className={`space-y-1 px-2 ${className}`}>{children}</nav>;
}

export function SidebarItem({
  children,
  active,
  className = "",
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"} ${className}`}
    >
      {children}
    </div>
  );
}

export function SidebarLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>{children}</div>;
}
