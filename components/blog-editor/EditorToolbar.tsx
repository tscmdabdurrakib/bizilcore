"use client";

import {
  Undo2, Redo2, Eye, Settings, Moon, Sun, PanelLeft, PanelRight,
  Maximize2, Focus, Save, Cloud, CloudOff, Loader2,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { useEditorUIStore } from "@/lib/blog-editor/store/ui-store";
import { extractPlainText, wordCount, readingTimeMinutes } from "@/lib/blog-editor/utils/blocks";
import type { SaveStatus } from "@/lib/blog-editor/types";
import { PresenceAvatars } from "./collaboration/PresenceAvatars";

interface EditorToolbarProps {
  postId: string;
  onSave: () => void;
  onPreview: () => void;
  adminName?: string;
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "saving") return <span className="flex items-center gap-1 text-xs" style={{ color: "var(--c-text-muted)" }}><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>;
  if (status === "saved") return <span className="flex items-center gap-1 text-xs" style={{ color: "var(--c-primary)" }}><Cloud className="w-3 h-3" /> Saved</span>;
  if (status === "error") return <span className="flex items-center gap-1 text-xs text-red-500"><CloudOff className="w-3 h-3" /> Error</span>;
  return null;
}

export function EditorToolbar({ postId, onSave, onPreview, adminName }: EditorToolbarProps) {
  const { isDark, toggle } = useTheme();
  const {
    undo, redo, canUndo, canRedo, saveStatus, blocks, title,
    setFullscreen, fullscreen, focusMode, setFocusMode,
  } = useEditorStore();
  const { toggleLeftPanel, toggleRightPanel, setPublishDialogOpen } = useEditorUIStore();

  const text = extractPlainText(blocks);
  const words = wordCount(text);
  const readTime = readingTimeMinutes(text);

  return (
    <header
      className="flex items-center gap-2 px-4 py-2.5 border-b shrink-0 backdrop-blur-md"
      style={{ borderColor: "var(--c-border)", background: "color-mix(in srgb, var(--c-surface) 90%, transparent)" }}
      role="banner"
    >
      <button type="button" onClick={toggleLeftPanel} className="p-2 rounded-lg hover:bg-black/5 hidden md:block" aria-label="Toggle block inserter">
        <PanelLeft className="w-4 h-4" style={{ color: "var(--c-text-sub)" }} />
      </button>

      <div className="flex items-center gap-1">
        <button type="button" onClick={undo} disabled={!canUndo()} className="p-2 rounded-lg hover:bg-black/5 disabled:opacity-30" aria-label="Undo"><Undo2 className="w-4 h-4" /></button>
        <button type="button" onClick={redo} disabled={!canRedo()} className="p-2 rounded-lg hover:bg-black/5 disabled:opacity-30" aria-label="Redo"><Redo2 className="w-4 h-4" /></button>
      </div>

      <SaveIndicator status={saveStatus} />

      <div className="hidden sm:flex items-center gap-2 ml-2 text-xs" style={{ color: "var(--c-text-muted)" }}>
        <span>{words} words</span>
        <span>·</span>
        <span>{readTime} min read</span>
      </div>

      <div className="flex-1" />

      <PresenceAvatars postId={postId} />

      <button type="button" onClick={onSave} className="p-2 rounded-lg hover:bg-black/5" aria-label="Save now"><Save className="w-4 h-4" /></button>
      <button type="button" onClick={onPreview} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-black/5" style={{ color: "var(--c-text-sub)" }}>
        <Eye className="w-4 h-4" /> Preview
      </button>
      <button
        type="button"
        onClick={() => setPublishDialogOpen(true)}
        className="px-4 py-1.5 rounded-xl text-sm font-medium text-white"
        style={{ background: "var(--c-primary)" }}
      >
        Publish
      </button>

      <button type="button" onClick={() => setFocusMode(!focusMode)} className="p-2 rounded-lg hover:bg-black/5 hidden lg:block" aria-label="Focus mode"><Focus className="w-4 h-4" /></button>
      <button type="button" onClick={() => setFullscreen(!fullscreen)} className="p-2 rounded-lg hover:bg-black/5 hidden lg:block" aria-label="Fullscreen"><Maximize2 className="w-4 h-4" /></button>
      <button type="button" onClick={toggle} className="p-2 rounded-lg hover:bg-black/5" aria-label="Toggle dark mode">
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <button type="button" onClick={toggleRightPanel} className="p-2 rounded-lg hover:bg-black/5 hidden md:block" aria-label="Toggle settings"><Settings className="w-4 h-4" /></button>
      <button type="button" onClick={toggleRightPanel} className="p-2 rounded-lg hover:bg-black/5 md:hidden" aria-label="Settings"><PanelRight className="w-4 h-4" /></button>

      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: "var(--c-primary)" }}
        title={adminName}
      >
        {adminName?.charAt(0)?.toUpperCase() ?? "A"}
      </div>
    </header>
  );
}
