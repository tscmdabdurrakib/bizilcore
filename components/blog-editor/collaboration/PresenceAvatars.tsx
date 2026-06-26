"use client";

import { usePresence } from "@/hooks/blog-editor/useBlogPost";

export function PresenceAvatars({ postId }: { postId: string }) {
  const { data } = usePresence(postId);
  const viewers = data?.viewers ?? [];

  if (viewers.length === 0) return null;

  return (
    <div className="flex items-center -space-x-2 mr-2" aria-label="Active collaborators">
      {viewers.slice(0, 3).map((v: { id: string; name: string; role?: string }) => (
        <div
          key={v.id}
          className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: "var(--c-primary)", borderColor: "var(--c-surface)" }}
          title={`${v.name} (${v.role ?? "viewing"})`}
        >
          {v.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
