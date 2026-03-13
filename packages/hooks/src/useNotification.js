import { useState, useCallback } from "react";
export function useNotification() {
    const [notifications, setNotifications] = useState([]);
    const notify = useCallback((notification) => {
        const id = Math.random().toString(36).substring(2);
        const n = { id, timeout: 5000, ...notification };
        setNotifications((prev) => [...prev, n]);
        if (n.timeout && n.timeout > 0) {
            setTimeout(() => {
                setNotifications((prev) => prev.filter((x) => x.id !== id));
            }, n.timeout);
        }
        return id;
    }, []);
    const dismiss = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);
    const success = useCallback((title, message) => notify({ type: "success", title, message }), [notify]);
    const error = useCallback((title, message) => notify({ type: "danger", title, message }), [notify]);
    const warning = useCallback((title, message) => notify({ type: "warning", title, message }), [notify]);
    const info = useCallback((title, message) => notify({ type: "info", title, message }), [notify]);
    return { notifications, notify, dismiss, success, error, warning, info };
}
//# sourceMappingURL=useNotification.js.map