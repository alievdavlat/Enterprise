export function buildQueryString(params) {
    const parts = [];
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
        }
    }
    return parts.length ? `?${parts.join("&")}` : "";
}
export function parseQueryString(query) {
    const params = {};
    const search = query.startsWith("?") ? query.slice(1) : query;
    for (const part of search.split("&")) {
        const [key, value] = part.split("=");
        if (key)
            params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    }
    return params;
}
export function formatApiResponse(data, meta) {
    return { data, meta: meta ?? {} };
}
export function formatApiError(message, details) {
    return { error: { status: 400, name: "ApplicationError", message, details } };
}
//# sourceMappingURL=api.js.map