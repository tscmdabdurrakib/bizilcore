"use client";

import { useState } from "react";
import { useBlockComments } from "@/hooks/blog-editor/useBlogPost";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import toast from "react-hot-toast";

export function CommentsPanel({ postId }: { postId: string }) {
  const { data: comments = [], refetch } = useBlockComments(postId);
  const selectedBlockId = useEditorStore(s => s.selectedBlockId);
  const [body, setBody] = useState("");

  const blockComments = selectedBlockId
    ? comments.filter((c: { blockId: string }) => c.blockId === selectedBlockId)
    : comments;

  async function addComment() {
    if (!selectedBlockId || !body.trim()) return;
    const res = await fetch(`/api/admin/blog/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockId: selectedBlockId, body: body.trim() }),
    });
    if (!res.ok) { toast.error("Failed to add comment"); return; }
    setBody("");
    refetch();
  }

  async function resolve(id: string) {
    await fetch(`/api/admin/blog/${postId}/comments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId: id, resolved: true }),
    });
    refetch();
  }

  return (
    <div className="p-4 space-y-4 text-sm">
      {!selectedBlockId && (
        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Select a block to add comments</p>
      )}

      {selectedBlockId && (
        <div className="space-y-2">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Add a comment… Use @name to mention"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border resize-none text-sm"
            style={{ borderColor: "var(--c-border)" }}
          />
          <button
            type="button"
            onClick={addComment}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
            style={{ background: "var(--c-primary)" }}
          >
            Comment
          </button>
        </div>
      )}

      <div className="space-y-3">
        {blockComments.map((c: { id: string; body: string; author?: { name: string }; resolved: boolean; createdAt: string }) => (
          <div
            key={c.id}
            className="p-3 rounded-xl"
            style={{ background: "var(--c-bg)", opacity: c.resolved ? 0.6 : 1 }}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-medium" style={{ color: "var(--c-text)" }}>{c.author?.name}</span>
              {!c.resolved && (
                <button type="button" onClick={() => resolve(c.id)} className="text-[10px]" style={{ color: "var(--c-primary)" }}>
                  Resolve
                </button>
              )}
            </div>
            <p className="text-xs" style={{ color: "var(--c-text-sub)" }}>{c.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
