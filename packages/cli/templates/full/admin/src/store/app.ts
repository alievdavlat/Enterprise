import { create } from "zustand";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface ContentTypeSchema {
  uid: string;
  kind: string;
  displayName: string;
  collectionName: string;
  singularName: string;
  pluralName: string;
  attributes: Record<string, any>;
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
    try {
      const res = await api.get("/admin/content-types");
      set({ contentTypes: res.data.data });
    } catch (e) {
      console.error("Failed to fetch content types", e);
    }
  },

  setIsLoading: (isLoading) => set({ isLoading }),
}));
