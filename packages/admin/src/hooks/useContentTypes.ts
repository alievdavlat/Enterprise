"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ContentTypeSchema } from "@/types";

const CONTENT_TYPES_KEY = ["admin", "content-types"] as const;

export function useContentTypesQuery() {
  return useQuery({
    queryKey: CONTENT_TYPES_KEY,
    queryFn: async (): Promise<ContentTypeSchema[]> => {
      const res = await api.get("/admin/content-types");
      const data = res.data?.data;
      return Array.isArray(data) ? data : [];
    },
  });
}

export interface CreateContentTypePayload {
  uid: string;
  kind: string;
  collectionName?: string;
  displayName: string;
  singularName: string;
  pluralName: string;
  draftAndPublish?: boolean;
  attributes?: Record<string, unknown>;
  category?: string;
}

export function useCreateContentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateContentTypePayload) => {
      const res = await api.post("/admin/content-types", payload);
      return res.data as ContentTypeSchema;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_TYPES_KEY });
    },
  });
}

export function useUpdateContentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      uid,
      data,
    }: {
      uid: string;
      data: Partial<ContentTypeSchema> & Record<string, unknown>;
    }) => {
      const res = await api.put(`/admin/content-types/${uid}`, data);
      return res.data as ContentTypeSchema;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_TYPES_KEY });
    },
  });
}

export function useDeleteContentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (uid: string) => {
      await api.delete(`/admin/content-types/${uid}`);
      return uid;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_TYPES_KEY });
    },
  });
}
