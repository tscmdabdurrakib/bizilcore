"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { BlockList } from "./BlockList";

export function EditorCanvas() {
  const blocks = useEditorStore(s => s.blocks);
  const title = useEditorStore(s => s.title);
  const setTitle = useEditorStore(s => s.setTitle);
  const setFocusBlockId = useEditorStore(s => s.setFocusBlockId);
  const contentWidth = useEditorStore(s => s.contentWidth);
  const setContentWidth = useEditorStore(s => s.setContentWidth);
  const readOnly = useEditorStore(s => s.readOnly);

  useEffect(() => {
    if (blocks[0]?.id) {
      setFocusBlockId(blocks[0].id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- focus first block once on mount

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto py-8 px-4 md:px-8"
      style={{ background: "var(--c-bg)" }}
    >
      {readOnly && (
        <div
          className="mx-auto mb-4 px-4 py-2 rounded-lg text-sm text-center"
          style={{ maxWidth: contentWidth, background: "var(--accent-warm-soft)", color: "var(--c-text)" }}
          role="status"
        >
          This post is locked by another editor. You are in read-only mode.
        </div>
      )}
      <div className="mx-auto transition-all duration-300" style={{ maxWidth: contentWidth }}>
        <div className="card-premium p-6 md:p-10 min-h-[60vh]">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            readOnly={readOnly}
            placeholder="Post title…"
            className="w-full text-3xl md:text-4xl font-bold font-display bg-transparent outline-none mb-8"
            style={{ color: "var(--c-text)" }}
            aria-label="Post title"
          />

          <BlockList blocks={blocks} />
        </div>

        <div className="mt-4 flex items-center gap-3 px-2">
          <label className="text-xs" style={{ color: "var(--c-text-muted)" }}>Content width</label>
          <input
            type="range"
            min={480}
            max={1200}
            value={contentWidth}
            onChange={e => setContentWidth(Number(e.target.value))}
            className="flex-1"
            aria-label="Content width"
          />
          <span className="text-xs tabular-nums" style={{ color: "var(--c-text-muted)" }}>{contentWidth}px</span>
        </div>
      </div>
    </motion.main>
  );
}
