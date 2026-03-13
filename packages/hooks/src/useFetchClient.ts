import { useCallback, useContext, createContext } from "react";

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

export const FetchClientContext = createContext<FetchClientInstance | null>(
  null,
);

export function createFetchClient(
  options: FetchClientOptions = {},
): FetchClientInstance {
  const { baseURL = "/api", headers: defaultHeaders = {} } = options;

  const request = async <T>(
    method: string,
    url: string,
    body?: unknown,
    params?: Record<string, unknown>,
  ): Promise<T> => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("enterprise-token")
        : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...defaultHeaders,
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let fullUrl = `${baseURL}${url}`;
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString();
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

    return res.json() as Promise<T>;
  };

  return {
    get: (url, params) => request("GET", url, undefined, params),
    post: (url, data) => request("POST", url, data),
    put: (url, data) => request("PUT", url, data),
    patch: (url, data) => request("PATCH", url, data),
    delete: (url) => request("DELETE", url),
  };
}

export function useFetchClient(): FetchClientInstance {
  const ctx = useContext(FetchClientContext);
  if (!ctx) {
    return createFetchClient();
  }
  return ctx;
}
