import { create } from "zustand";
import { api } from "@/lib/api";
import type { ContentTypeSchema } from "@/types";

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  contentTypes: ContentTypeSchema[];
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchContentTypes: () => Promise<void>;
  /** Force the next fetchContentTypes() to hit the network (call after schema edits). */
  invalidateContentTypes: () => void;
  setIsLoading: (loading: boolean) => void;
}

let _fetchPromise: Promise<void> | null = null;
/**
 * Last successful fetch timestamp. We keep a short freshness window so that
 * navigating between pages — each of which calls `fetchContentTypes()` on
 * mount — doesn't re-hit the API. 30s is short enough that the next focus /
 * page-load picks up admin-side schema changes.
 */
let _lastFetchAt = 0;
const FRESHNESS_WINDOW_MS = 30 * 1000;

export const useAppStore = create<AppState>((set, get) => ({
  user:
    typeof window !== "undefined" && localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user")!)
      : null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  contentTypes: [],
  isLoading: true,

  login: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null, contentTypes: [] });
  },

  fetchContentTypes: async () => {
    if (_fetchPromise) return _fetchPromise;
    // Skip the network round-trip when we fetched recently and already have
    // a populated list. Mutations (create/edit schema) reset the timestamp
    // via `invalidateContentTypes` so freshness is still guaranteed.
    if (
      Date.now() - _lastFetchAt < FRESHNESS_WINDOW_MS &&
      get().contentTypes.length > 0
    ) {
      return;
    }

    _fetchPromise = (async () => {
      try {
        const res = await api.get("/admin/content-types");
        const data = res.data?.data;
        if (Array.isArray(data)) {
          set({ contentTypes: data });
          _lastFetchAt = Date.now();
        }
      } catch (e: unknown) {
        const err = e as { response?: { status?: number } };
        if (err?.response?.status !== 401) {
          console.error("Failed to fetch content types", err);
        }
      } finally {
        _fetchPromise = null;
      }
    })();

    return _fetchPromise;
  },

  invalidateContentTypes: () => {
    _lastFetchAt = 0;
  },

  setIsLoading: (isLoading) => set({ isLoading }),
}));
