"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BlogPostDTO } from "@/lib/blog-editor/types";
import type { BlockNode } from "@/lib/blog-editor/types";

async function fetchPost(id: string): Promise<BlogPostDTO> {
  const res = await fetch(`/api/admin/blog/${id}`);
  if (!res.ok) throw new Error("Failed to load post");
  return res.json();
}

async function updatePost(id: string, data: Record<string, unknown>): Promise<BlogPostDTO> {
  const res = await fetch(`/api/admin/blog/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save post");
  return res.json();
}

async function autosavePost(id: string, data: { title?: string; excerpt?: string | null; content?: BlockNode[] }) {
  const res = await fetch(`/api/admin/blog/${id}/autosave`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Autosave failed");
  return res.json();
}

export function useBlogPost(postId: string) {
  return useQuery({
    queryKey: ["blog-post", postId],
    queryFn: () => fetchPost(postId),
    enabled: !!postId,
  });
}

export function useUpdateBlogPost(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => updatePost(postId, data),
    onSuccess: data => qc.setQueryData(["blog-post", postId], data),
  });
}

export function useAutosaveMutation(postId: string) {
  return useMutation({
    mutationFn: (data: { title?: string; excerpt?: string | null; content?: BlockNode[] }) =>
      autosavePost(postId, data),
  });
}

export function useBlogAuthors() {
  return useQuery({
    queryKey: ["blog-authors"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users?role=admin");
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.users ?? [];
    },
  });
}

export function useBlogCategories() {
  return useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blog/categories");
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useBlogTags(q?: string) {
  return useQuery({
    queryKey: ["blog-tags", q],
    queryFn: async () => {
      const res = await fetch(`/api/admin/blog/tags${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useBlogMedia(type?: string, q?: string) {
  return useQuery({
    queryKey: ["blog-media", type, q],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/blog/media?${params}`);
      if (!res.ok) return [];
      return res.json();
    },
  });
}

export function useBlogRevisions(postId: string) {
  return useQuery({
    queryKey: ["blog-revisions", postId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/blog/${postId}/revisions`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!postId,
  });
}

export function useBlockComments(postId: string) {
  return useQuery({
    queryKey: ["blog-comments", postId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/blog/${postId}/comments`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!postId,
  });
}

export function usePresence(postId: string) {
  return useQuery({
    queryKey: ["blog-presence", postId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/blog/${postId}/presence`);
      if (!res.ok) return { viewers: [] };
      return res.json();
    },
    enabled: !!postId,
    refetchInterval: 10000,
  });
}
