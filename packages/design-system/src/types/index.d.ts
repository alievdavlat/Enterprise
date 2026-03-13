export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "success" | "ghost" | "link";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    icon?: React.ReactNode;
    iconRight?: React.ReactNode;
}
export interface BadgeProps {
    variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
    size?: "sm" | "md";
    children: React.ReactNode;
    className?: string;
}
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    hint?: string;
    error?: string;
    leftAddon?: React.ReactNode;
    rightAddon?: React.ReactNode;
}
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface SelectProps {
    options: SelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
}
export interface TableColumn<T = Record<string, unknown>> {
    key: string;
    title: string;
    render?: (value: unknown, row: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
}
export interface TableProps<T = Record<string, unknown>> {
    columns: TableColumn<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    className?: string;
}
//# sourceMappingURL=index.d.ts.map