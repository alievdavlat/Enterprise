import { useContext, createContext } from "react";
export const FetchClientContext = createContext(null);
export function createFetchClient(options = {}) {
    const { baseURL = "/api", headers: defaultHeaders = {} } = options;
    const request = async (method, url, body, params) => {
        const token = typeof window !== "undefined"
            ? localStorage.getItem("enterprise-token")
            : null;
        const headers = {
            "Content-Type": "application/json",
            ...defaultHeaders,
        };
        if (token)
            headers["Authorization"] = `Bearer ${token}`;
        let fullUrl = `${baseURL}${url}`;
        if (params && Object.keys(params).length > 0) {
            const queryString = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
            fullUrl = `${fullUrl}?${queryString}`;
        }
        const res = await fetch(fullUrl, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) {
            const errData = await res
                .json()
                .catch(() => ({ message: res.statusText }));
            throw new Error(errData.message || `HTTP ${res.status}`);
        }
        return res.json();
    };
    return {
        get: (url, params) => request("GET", url, undefined, params),
        post: (url, data) => request("POST", url, data),
        put: (url, data) => request("PUT", url, data),
        patch: (url, data) => request("PATCH", url, data),
        delete: (url) => request("DELETE", url),
    };
}
export function useFetchClient() {
    const ctx = useContext(FetchClientContext);
    if (!ctx) {
        return createFetchClient();
    }
    return ctx;
}
//# sourceMappingURL=useFetchClient.js.map