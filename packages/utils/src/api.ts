export function buildQueryString(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export function parseQueryString(query: string): Record<string, string> {
  const params: Record<string, string> = {};
  const search = query.startsWith("?") ? query.slice(1) : query;
  for (const part of search.split("&")) {
    const [key, value] = part.split("=");
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || "");
  }
  return params;
}

export function formatApiResponse<T>(data: T, meta?: Record<string, unknown>) {
  return { data, meta: meta ?? {} };
}

export function formatApiError(message: string, details?: unknown) {
  return { error: { status: 400, name: "ApplicationError", message, details } };
}
