import * as React from "react";
export interface BreadcrumbItem {
    label: React.ReactNode;
    href?: string;
}
export interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}
export declare function Breadcrumb({ items, className }: BreadcrumbProps): React.JSX.Element;
//# sourceMappingURL=Breadcrumb.d.ts.map