import * as React from "react";
export interface SidebarProps {
    children: React.ReactNode;
    className?: string;
}
export declare function Sidebar({ children, className }: SidebarProps): React.JSX.Element;
export declare function SidebarHeader({ children, className }: {
    children: React.ReactNode;
    className?: string;
}): React.JSX.Element;
export declare function SidebarContent({ children, className }: {
    children: React.ReactNode;
    className?: string;
}): React.JSX.Element;
export declare function SidebarFooter({ children, className }: {
    children: React.ReactNode;
    className?: string;
}): React.JSX.Element;
export declare function SidebarMenu({ children, className }: {
    children: React.ReactNode;
    className?: string;
}): React.JSX.Element;
export declare function SidebarItem({ children, active, className, }: {
    children: React.ReactNode;
    active?: boolean;
    className?: string;
}): React.JSX.Element;
export declare function SidebarLabel({ children, className }: {
    children: React.ReactNode;
    className?: string;
}): React.JSX.Element;
//# sourceMappingURL=Sidebar.d.ts.map