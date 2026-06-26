"use client";

import { useState } from "react";
import { useBlogRevisions } from "@/hooks/blog-editor/useBlogPost";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { diffJson } from "diff";
import toast from "react-hot-toast";

export function RevisionPanel({ postId }: { postId: string }) {
  const { data: revisions = [], refetch } = useBlogRevisions(postId);
  const { initPost, blocks, title } = useEditorStore();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [compareMode, setCompareMode] = useState(false);

  const current = revisions[selectedIdx];
  const diffs = current
    ? diffJson(
        { title, content: blocks },
        { title: current.title, content: current.content }
      )
    : [];

  async function createSnapshot() {
    const res = await fetch(`/api/admin/blog/${postId}/revisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "Manual snapshot" }),
    });
    if (!res.ok) { toast.error("Failed to create snapshot"); return; }
    toast.success("Snapshot saved");
    refetch();
  }

  async function restore(revisionId: string) {
    const res = await fetch(`/api/admin/blog/${postId}/revisions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionId }),
    });
    if (!res.ok) { toast.error("Failed to restore"); return; }
    const postRes = await fetch(`/api/admin/blog/${postId}`);
    const post = await postRes.json();
    initPost(post);
    toast.success("Revision restored");
    refetch();
  }

  return (
    <div className="p-4 space-y-4 text-sm">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={createSnapshot}
          className="flex-1 py-2 rounded-lg text-xs font-medium text-white"
          style={{ background: "var(--c-primary)" }}
        >
          Save snapshot
        </button>
        <button
          type="button"
          onClick={() => setCompareMode(!compareMode)}
          className="px-3 py-2 rounded-lg border text-xs"
          style={{ borderColor: "var(--c-border)" }}
        >
          {compareMode ? "Timeline" : "Compare"}
        </button>
      </div>

      {compareMode && current ? (
        <div className="rounded-xl p-3 font-mono text-xs overflow-x-auto max-h-64" style={{ background: "var(--c-bg)" }}>
          {diffs.map((part, i) => (
            <span
              key={i}
              style={{
                background: part.added ? "rgba(29,158,117,0.2)" : part.removed ? "rgba(226,75,74,0.2)" : undefined,
                color: part.added ? "var(--c-primary)" : part.removed ? "var(--color-danger)" : "var(--c-text-sub)",
              }}
            >
              {part.value}
            </span>
          ))}
        </div>
      ) : (
        <>
          <input
            type="range"
            min={0}
            max={Math.max(0, revisions.length - 1)}
            value={selectedIdx}
            onChange={e => setSelectedIdx(Number(e.target.value))}
            className="w-full"
            aria-label="Revision timeline"
          />
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {revisions.map((r: { id: string; label: string | null; createdAt: string; createdBy?: { name: string } }, i: number) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 rounded-lg"
                style={{ background: i === selectedIdx ? "var(--nav-active-bg)" : "var(--c-bg)" }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--c-text)" }}>{r.label ?? "Autosave"}</p>
                  <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
                    {new Date(r.createdAt).toLocaleString()} · {r.createdBy?.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => restore(r.id)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ color: "var(--c-primary)" }}
                >
                  Restore
                </button>
              </div>
            ))}
            {revisions.length === 0 && (
              <p className="text-xs text-center py-4" style={{ color: "var(--c-text-muted)" }}>No revisions yet</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
