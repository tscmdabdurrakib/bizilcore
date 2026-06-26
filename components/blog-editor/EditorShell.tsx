"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { useEditorUIStore } from "@/lib/blog-editor/store/ui-store";
import { Sheet } from "@/components/ui/Sheet";
import { EditorToolbar } from "./EditorToolbar";
import { EditorCanvas } from "./EditorCanvas";
import { LeftPanel } from "./LeftPanel";
import { RightSidebar } from "./sidebar/RightSidebar";
import { SlashCommandMenu } from "./toolbars/SlashCommandMenu";
import { MediaLibraryModal } from "./media/MediaLibraryModal";
import { PublishDialog } from "./PublishDialog";

interface EditorShellProps {
  postId: string;
  adminName?: string;
  onSave: () => void;
  onPreview: () => void;
}

export function EditorShell({ postId, adminName, onSave, onPreview }: EditorShellProps) {
  const fullscreen = useEditorStore(s => s.fullscreen);
  const setReadOnly = useEditorStore(s => s.setReadOnly);
  const {
    leftPanelOpen, rightPanelOpen, leftDrawerOpen, rightDrawerOpen,
    setLeftDrawerOpen, setRightDrawerOpen,
  } = useEditorUIStore();

  useEffect(() => {
    let active = true;

    async function acquireLock() {
      try {
        const res = await fetch(`/api/admin/blog/${postId}/lock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "acquire" }),
        });
        if (!active) return;
        if (res.status === 423) {
          setReadOnly(true);
        } else {
          setReadOnly(false);
        }
      } catch {
        if (active) setReadOnly(false);
      }
    }

    acquireLock();

    return () => {
      active = false;
      fetch(`/api/admin/blog/${postId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "release" }),
      }).catch(() => {});
    };
  }, [postId, setReadOnly]);

  return (
    <div
      className={cn(
        "flex flex-col h-[calc(100vh-4rem)] md:h-screen",
        fullscreen && "fixed inset-0 z-50 h-screen"
      )}
      style={{ background: "var(--c-bg)" }}
    >
      <EditorToolbar postId={postId} onSave={onSave} onPreview={onPreview} adminName={adminName} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — desktop */}
        {leftPanelOpen && (
          <aside
            className="hidden md:flex w-56 lg:w-64 border-r shrink-0 flex-col"
            style={{ borderColor: "var(--c-border)", background: "var(--c-surface)" }}
            aria-label="Block inserter"
          >
            <LeftPanel />
          </aside>
        )}

        <EditorCanvas />

        {/* Right panel — desktop */}
        {rightPanelOpen && (
          <aside
            className="hidden md:flex w-72 lg:w-80 border-l shrink-0 flex-col"
            style={{ borderColor: "var(--c-border)", background: "var(--c-surface)" }}
          >
            <RightSidebar postId={postId} />
          </aside>
        )}
      </div>

      {/* Mobile drawers */}
      <Sheet open={leftDrawerOpen} onClose={() => setLeftDrawerOpen(false)} title="Blocks" side="left">
        <LeftPanel />
      </Sheet>
      <Sheet open={rightDrawerOpen} onClose={() => setRightDrawerOpen(false)} title="Settings" side="right">
        <RightSidebar postId={postId} />
      </Sheet>

      <SlashCommandMenu />
      <MediaLibraryModal />
      <PublishDialog postId={postId} />

      <div className="sr-only" aria-live="polite" id="editor-announcer" />
    </div>
  );
}
