"use client";

import {
  ArrowUp, ArrowDown, Copy, Trash2, AlignLeft, AlignCenter, AlignRight, RefreshCw,
} from "lucide-react";
import type { BlockNode } from "@/lib/blog-editor/types";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { TRANSFORM_MAP } from "@/lib/blog-editor/blocks/registry";
import type { BlockType } from "@/lib/blog-editor/types";

interface BlockToolbarProps {
  block: BlockNode;
  index: number;
}

export function BlockToolbar({ block, index }: BlockToolbarProps) {
  const {
    moveBlockUp, moveBlockDown, duplicateBlock, removeBlock, transformBlock, updateBlock,
  } = useEditorStore();

  const transforms = TRANSFORM_MAP[block.type] ?? [];

  return (
    <div
      className="absolute -top-10 left-0 right-0 flex items-center justify-center gap-0.5 z-20"
      role="toolbar"
      aria-label="Block actions"
    >
      <div
        className="flex items-center gap-0.5 px-1 py-1 rounded-xl border shadow-lg"
        style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
      >
        <ToolBtn label="Move up" onClick={() => moveBlockUp(block.id)}><ArrowUp className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn label="Move down" onClick={() => moveBlockDown(block.id)}><ArrowDown className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn label="Duplicate" onClick={() => duplicateBlock(block.id)}><Copy className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn label="Delete" onClick={() => removeBlock(block.id)}><Trash2 className="w-3.5 h-3.5" /></ToolBtn>
        <span className="w-px h-4 mx-0.5" style={{ background: "var(--c-border)" }} />
        <ToolBtn label="Align left" onClick={() => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, align: "left" } }))}><AlignLeft className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn label="Align center" onClick={() => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, align: "center" } }))}><AlignCenter className="w-3.5 h-3.5" /></ToolBtn>
        <ToolBtn label="Align right" onClick={() => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, align: "right" } }))}><AlignRight className="w-3.5 h-3.5" /></ToolBtn>
        {transforms.length > 0 && (
          <>
            <span className="w-px h-4 mx-0.5" style={{ background: "var(--c-border)" }} />
            <div className="relative group">
              <ToolBtn label="Transform"><RefreshCw className="w-3.5 h-3.5" /></ToolBtn>
              <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-col rounded-lg border shadow-lg py-1 min-w-[120px] z-30" style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}>
                {transforms.map(t => (
                  <button
                    key={t}
                    type="button"
                    className="px-3 py-1.5 text-left text-xs hover:bg-[var(--nav-active-bg)] capitalize"
                    onClick={() => transformBlock(block.id, t as BlockType)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ToolBtn({ label, onClick, children }: { label: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      style={{ color: "var(--c-text-sub)" }}
    >
      {children}
    </button>
  );
}
