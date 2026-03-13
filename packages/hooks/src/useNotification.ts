import { useState, useCallback } from "react";

export type NotificationType = "success" | "warning" | "danger" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  timeout?: number;
}

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substring(2);
    const n: Notification = { id, timeout: 5000, ...notification };
    setNotifications((prev) => [...prev, n]);

    if (n.timeout && n.timeout > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((x) => x.id !== id));
      }, n.timeout);
    }
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) =>
      notify({ type: "success", title, message }),
    [notify],
  );

  const error = useCallback(
    (title: string, message?: string) =>
      notify({ type: "danger", title, message }),
    [notify],
  );

  const warning = useCallback(
    (title: string, message?: string) =>
      notify({ type: "warning", title, message }),
    [notify],
  );

  const info = useCallback(
    (title: string, message?: string) =>
      notify({ type: "info", title, message }),
    [notify],
  );

  return { notifications, notify, dismiss, success, error, warning, info };
}
