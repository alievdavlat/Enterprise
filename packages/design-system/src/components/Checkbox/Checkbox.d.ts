import * as React from "react";
export interface CheckboxProps {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    label?: React.ReactNode;
    className?: string;
}
export declare function Checkbox({ checked, onChange, disabled, label, className }: CheckboxProps): React.JSX.Element;
//# sourceMappingURL=Checkbox.d.ts.map