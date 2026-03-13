import * as React from "react";
export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}
export declare function Modal({ open, onClose, title, children, footer, className }: ModalProps): React.JSX.Element | null;
//# sourceMappingURL=Modal.d.ts.map