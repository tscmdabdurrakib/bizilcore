"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { useEditorUIStore } from "@/lib/blog-editor/store/ui-store";

export function useKeyboardShortcuts(opts: { onSave: () => void; onPreview: () => void }) {
  const { undo, redo, setFullscreen, fullscreen, setFocusMode, focusMode } = useEditorStore();
  const { toggleLeftPanel, toggleRightPanel } = useEditorUIStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === "s") {
        e.preventDefault();
        opts.onSave();
      }
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if (mod && e.shiftKey && e.key === "P") {
        e.preventDefault();
        opts.onPreview();
      }
      if (mod && e.key === "\\") {
        e.preventDefault();
        toggleLeftPanel();
      }
      if (mod && e.key === "/") {
        e.preventDefault();
        toggleRightPanel();
      }
      if (e.key === "F11") {
        e.preventDefault();
        setFullscreen(!fullscreen);
      }
      if (mod && e.shiftKey && e.key === "F") {
        e.preventDefault();
        setFocusMode(!focusMode);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [opts, undo, redo, fullscreen, focusMode, setFullscreen, setFocusMode, toggleLeftPanel, toggleRightPanel]);
}
