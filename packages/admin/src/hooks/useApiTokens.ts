"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ApiToken,
  CreateApiTokenPayload,
  UpdateApiTokenPayload,
} from "@/types";

const API_TOKENS_KEY = ["admin", "api-tokens"] as const;

export function useApiTokens() {
  return useQuery({
    queryKey: API_TOKENS_KEY,
    queryFn: async (): Promise<ApiToken[]> => {
      const res = await api.get("/admin/api-tokens");
      return (res.data?.data ?? []) as ApiToken[];
    },
  });
}

export function useCreateApiToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateApiTokenPayload) => {
      const res = await api.post("/admin/api-tokens", payload);
      return (res.data?.data ?? res.data) as ApiToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_TOKENS_KEY });
    },
  });
}

export function useUpdateApiToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: number | string; payload: UpdateApiTokenPayload }) => {
      const res = await api.put(`/admin/api-tokens/${args.id}`, args.payload);
      return (res.data?.data ?? res.data) as ApiToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_TOKENS_KEY });
    },
  });
}

export function useDeleteApiToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.delete(`/admin/api-tokens/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_TOKENS_KEY });
    },
  });
}
