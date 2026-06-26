"use client";

import { BLOCK_DEFINITIONS } from "@/lib/blog-editor/blocks/registry";
import { BLOCK_PATTERNS } from "@/lib/blog-editor/patterns";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import type { BlockType } from "@/lib/blog-editor/types";
import { useEditorUIStore } from "@/lib/blog-editor/store/ui-store";
import { useState } from "react";
import { extractPlainText } from "@/lib/blog-editor/utils/blocks";

export function LeftPanel() {
  const addBlock = useEditorStore(s => s.addBlock);
  const blocks = useEditorStore(s => s.blocks);
  const setSelectedBlockId = useEditorStore(s => s.setSelectedBlockId);
  const setBlocks = useEditorStore(s => s.setBlocks);
  const pushHistory = useEditorStore(s => s.pushHistory);
  const [tab, setTab] = useState<"blocks" | "outline" | "patterns">("blocks");

  const headings = blocks.filter(b => b.type === "heading");

  return (
    <div className="h-full flex flex-col">
      <div className="flex border-b shrink-0" style={{ borderColor: "var(--c-border)" }}>
        {(["blocks", "outline", "patterns"] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 text-xs font-medium capitalize transition-colors"
            style={{
              color: tab === t ? "var(--c-primary)" : "var(--c-text-muted)",
              borderBottom: tab === t ? "2px solid var(--c-primary)" : "2px solid transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {tab === "blocks" && BLOCK_DEFINITIONS.map(def => {
          const Icon = def.icon;
          return (
            <button
              key={def.type}
              type="button"
              onClick={() => addBlock(def.type as BlockType)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-[var(--nav-active-bg)] transition-colors"
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--c-primary)" }} />
              <span className="text-sm" style={{ color: "var(--c-text)" }}>{def.label}</span>
            </button>
          );
        })}

        {tab === "outline" && (
          headings.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: "var(--c-text-muted)" }}>No headings yet</p>
          ) : (
            headings.map(h => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedBlockId(h.id)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-[var(--nav-active-bg)] truncate"
                style={{ color: "var(--c-text-sub)", paddingLeft: `${((h.attrs?.level as number) ?? 2) * 8}px` }}
              >
                {extractPlainText([h]) || "Untitled heading"}
              </button>
            ))
          )
        )}

        {tab === "patterns" && BLOCK_PATTERNS.map(p => (
          <button
            key={p.id}
            type="button"
            onClick={() => { pushHistory(); setBlocks([...blocks, ...p.blocks]); }}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[var(--nav-active-bg)] transition-colors"
          >
            <span className="block text-sm font-medium" style={{ color: "var(--c-text)" }}>{p.name}</span>
            <span className="block text-xs" style={{ color: "var(--c-text-muted)" }}>{p.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
