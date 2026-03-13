import * as React from "react";
export type AlertVariant = "default" | "success" | "warning" | "destructive";
export interface AlertProps {
    variant?: AlertVariant;
    title?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}
export declare function Alert({ variant, title, children, className }: AlertProps): React.JSX.Element;
//# sourceMappingURL=Alert.d.ts.map