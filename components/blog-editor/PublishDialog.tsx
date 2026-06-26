"use client";

import { Dialog } from "@/components/ui/Dialog";
import { useEditorUIStore } from "@/lib/blog-editor/store/ui-store";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { useUpdateBlogPost } from "@/hooks/blog-editor/useBlogPost";
import toast from "react-hot-toast";

interface PublishDialogProps {
  postId: string;
}

export function PublishDialog({ postId }: PublishDialogProps) {
  const { publishDialogOpen, setPublishDialogOpen } = useEditorUIStore();
  const { title, blocks, postMeta, setPostMeta } = useEditorStore();
  const updatePost = useUpdateBlogPost(postId);

  async function publish() {
    try {
      await updatePost.mutateAsync({
        title,
        content: blocks,
        status: postMeta.scheduledAt ? "scheduled" : "published",
        publishedAt: postMeta.scheduledAt ? null : new Date().toISOString(),
        scheduledAt: postMeta.scheduledAt ?? null,
      });
      toast.success(postMeta.scheduledAt ? "Post scheduled!" : "Post published!");
      setPublishDialogOpen(false);
    } catch {
      toast.error("Failed to publish");
    }
  }

  return (
    <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)} title="Ready to publish?" size="sm">
      <div className="p-5 space-y-4">
        <p className="text-sm" style={{ color: "var(--c-text-sub)" }}>
          {postMeta.scheduledAt
            ? `This post will be published on ${new Date(postMeta.scheduledAt).toLocaleString()}.`
            : "This post will be visible on the public blog immediately."}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setPublishDialogOpen(false)}
            className="px-4 py-2 rounded-xl text-sm border"
            style={{ borderColor: "var(--c-border)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={publish}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "var(--c-primary)" }}
          >
            {postMeta.scheduledAt ? "Schedule" : "Publish now"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
