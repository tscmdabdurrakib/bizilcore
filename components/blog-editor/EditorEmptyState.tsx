"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";

export function EditorEmptyState() {
  const addBlock = useEditorStore(s => s.addBlock);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "var(--nav-active-bg)" }}
      >
        <Sparkles className="w-8 h-8" style={{ color: "var(--c-primary)" }} />
      </div>
      <h3 className="text-xl font-semibold mb-2 font-display" style={{ color: "var(--c-text)" }}>
        Start writing…
      </h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--c-text-muted)" }}>
        Press <kbd className="px-1.5 py-0.5 rounded border text-xs" style={{ borderColor: "var(--c-border)" }}>/</kbd> to insert blocks, or click below
      </p>
      <button
        type="button"
        onClick={() => addBlock("paragraph")}
        className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-transform hover:scale-105"
        style={{ background: "var(--c-primary)" }}
      >
        Add first paragraph
      </button>
    </motion.div>
  );
}
