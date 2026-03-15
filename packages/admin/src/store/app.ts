import { create } from "zustand";
import { api } from "@/lib/api";
import type { ContentTypeSchema } from "@/types";

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
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
  setIsLoading: (loading: boolean) => void;
}

let _fetchPromise: Promise<void> | null = null;

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

    _fetchPromise = (async () => {
      try {
        const res = await api.get("/admin/content-types");
        const data = res.data?.data;
        if (Array.isArray(data)) {
          set({ contentTypes: data });
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

  setIsLoading: (isLoading) => set({ isLoading }),
}));
