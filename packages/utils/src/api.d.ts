export declare function buildQueryString(params: Record<string, unknown>): string;
export declare function parseQueryString(query: string): Record<string, string>;
export declare function formatApiResponse<T>(data: T, meta?: Record<string, unknown>): {
    data: T;
    meta: Record<string, unknown>;
};
export declare function formatApiError(message: string, details?: unknown): {
    error: {
        status: number;
        name: string;
        message: string;
        details: unknown;
    };
};
//# sourceMappingURL=api.d.ts.map