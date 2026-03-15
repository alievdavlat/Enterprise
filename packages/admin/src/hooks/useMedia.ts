"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiUrl } from "@/lib/api";
import type { MediaFile, MediaFolder } from "@/types";
import { normalizeMediaFile } from "@/types";

const MEDIA_KEYS = {
  files: (page: number, pageSize: number, sort: string, folderPath: string) =>
    ["media", "files", page, pageSize, sort, folderPath] as const,
  folders: () => ["media", "folders"] as const,
};

export interface MediaFilesParams {
  page: number;
  pageSize: number;
  sort: string;
  folderPath: string | null;
}

export function useMediaFiles(params: MediaFilesParams) {
  const folderParam = params.folderPath === null ? "__root__" : params.folderPath;
  const [field, direction] = params.sort.split(":");
  const sortParam = `${field}:${direction || "desc"}`;

  return useQuery({
    queryKey: MEDIA_KEYS.files(
      params.page,
      params.pageSize,
      sortParam,
      folderParam,
    ),
    queryFn: async () => {
      const res = await api.get("/upload/files", {
        params: {
          page: params.page,
          pageSize: params.pageSize,
          sort: sortParam,
          folderPath: folderParam,
        },
      });
      const data = (res.data?.data ?? []) as Record<string, unknown>[];
      const total =
        res.data?.meta?.pagination?.total ?? res.data?.data?.length ?? 0;
      return {
        data: data.map(normalizeMediaFile),
        total: total as number,
      };
    },
  });
}

export function useMediaFolders() {
  return useQuery({
    queryKey: MEDIA_KEYS.folders(),
    queryFn: async () => {
      const res = await api.get("/upload/folders");
      return (res.data?.data ?? []) as MediaFolder[];
    },
  });
}

export function useUpdateMediaFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        name?: string;
        caption?: string | null;
        alternativeText?: string | null;
      };
    }) => {
      const res = await api.patch(`/upload/files/${id}`, payload);
      return res.data as MediaFile | Record<string, unknown>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useDeleteMediaFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/upload/files/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useMoveMediaFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      folderPath,
    }: { ids: number[]; folderPath: string | null }) => {
      await api.post("/upload/files/move", { ids, folderPath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useCreateMediaFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      parentPath,
    }: { name: string; parentPath: string | null }) => {
      const res = await api.post("/upload/folders", {
        name: name.trim(),
        parentPath,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media", "folders"] });
    },
  });
}

export function useUploadMediaFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      files,
      folderPath,
    }: {
      files: File[];
      folderPath: string | null;
    }) => {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      if (folderPath) formData.append("folderPath", folderPath);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(getApiUrl("/upload"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error?.message || res.statusText);
      const created = Array.isArray(body) ? body : (body?.data ?? []);
      return created as Record<string, unknown>[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}
