import * as React from "react";
export interface TabItem {
    value: string;
    label: React.ReactNode;
    content: React.ReactNode;
}
export interface TabsProps {
    items: TabItem[];
    value?: string;
    onChange?: (value: string) => void;
    className?: string;
}
export declare function Tabs({ items, value, onChange, className }: TabsProps): React.JSX.Element;
//# sourceMappingURL=Tabs.d.ts.map