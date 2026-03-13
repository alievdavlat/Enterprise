export type NotificationType = "success" | "warning" | "danger" | "info";
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    timeout?: number;
}
export declare function useNotification(): {
    notifications: Notification[];
    notify: (notification: Omit<Notification, "id">) => string;
    dismiss: (id: string) => void;
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
};
//# sourceMappingURL=useNotification.d.ts.map