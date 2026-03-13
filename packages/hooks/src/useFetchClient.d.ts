export interface FetchClientOptions {
    baseURL?: string;
    headers?: Record<string, string>;
}
export interface FetchClientInstance {
    get: <T>(url: string, params?: Record<string, unknown>) => Promise<T>;
    post: <T>(url: string, data?: unknown) => Promise<T>;
    put: <T>(url: string, data?: unknown) => Promise<T>;
    patch: <T>(url: string, data?: unknown) => Promise<T>;
    delete: <T>(url: string) => Promise<T>;
}
export declare const FetchClientContext: import("react").Context<FetchClientInstance | null>;
export declare function createFetchClient(options?: FetchClientOptions): FetchClientInstance;
export declare function useFetchClient(): FetchClientInstance;
//# sourceMappingURL=useFetchClient.d.ts.map