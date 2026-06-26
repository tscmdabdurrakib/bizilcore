"use client";

import { useEffect } from "react";
import { useBlogPost } from "@/hooks/blog-editor/useBlogPost";
import { useAutosave } from "@/hooks/blog-editor/useAutosave";
import { useKeyboardShortcuts } from "@/hooks/blog-editor/useKeyboardShortcuts";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { EditorShell } from "./EditorShell";
import { Loader2 } from "lucide-react";

interface BlogEditorProps {
  postId: string;
  adminName?: string;
}

export function BlogEditor({ postId, adminName }: BlogEditorProps) {
  const { data: post, isLoading, error } = useBlogPost(postId);
  const initPost = useEditorStore(s => s.initPost);
  const { saveNow } = useAutosave(postId);

  useEffect(() => {
    if (post) initPost(post);
  }, [post, initPost]);

  useKeyboardShortcuts({
    onSave: saveNow,
    onPreview: () => window.open(`/admin/blog/${postId}/preview`, "_blank"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--c-primary)" }} />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex items-center justify-center h-96 text-sm" style={{ color: "var(--color-danger)" }}>
        Failed to load post
      </div>
    );
  }

  return (
    <EditorShell
      postId={postId}
      adminName={adminName}
      onSave={saveNow}
      onPreview={() => window.open(`/admin/blog/${postId}/preview`, "_blank")}
    />
  );
}
