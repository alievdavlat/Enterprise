import * as React from "react";
export interface ToggleProps {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    label?: React.ReactNode;
    className?: string;
}
export declare function Toggle({ checked, onChange, disabled, label, className }: ToggleProps): React.JSX.Element;
//# sourceMappingURL=Toggle.d.ts.map