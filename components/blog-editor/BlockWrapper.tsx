"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockNode } from "@/lib/blog-editor/types";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { BlockToolbar } from "./toolbars/BlockToolbar";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";

interface BlockWrapperProps {
  block: BlockNode;
  index: number;
}

export function BlockWrapper({ block, index }: BlockWrapperProps) {
  const selectedBlockId = useEditorStore(s => s.selectedBlockId);
  const setSelectedBlockId = useEditorStore(s => s.setSelectedBlockId);
  const focusMode = useEditorStore(s => s.focusMode);
  const isSelected = selectedBlockId === block.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(block.design?.padding && { padding: block.design.padding }),
    ...(block.design?.margin && { margin: block.design.margin }),
    ...(block.design?.background && { background: block.design.background }),
    ...(block.design?.borderRadius && { borderRadius: block.design.borderRadius }),
    ...(block.design?.border && { border: block.design.border }),
    ...(block.design?.shadow && { boxShadow: block.design.shadow }),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-xl transition-all duration-200",
        isDragging && "opacity-50 z-10",
        focusMode && !isSelected && "opacity-30 hover:opacity-60",
        isSelected && "ring-2 ring-[var(--c-primary)] ring-offset-2 ring-offset-[var(--c-bg)]"
      )}
      onClick={e => {
        const target = e.target as HTMLElement;
        if (target.closest(".ProseMirror")) return;
        setSelectedBlockId(block.id);
      }}
      data-block-id={block.id}
      role="group"
      aria-label={`${block.type} block`}
      aria-selected={isSelected}
    >
      <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          className="p-1 rounded cursor-grab active:cursor-grabbing hover:bg-black/5"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" style={{ color: "var(--c-text-muted)" }} />
        </button>
      </div>

      {isSelected && <BlockToolbar block={block} index={index} />}

      <div className="px-2 py-1">
        <BlockRenderer block={block} blockIndex={index} isSelected={isSelected} isFocused={isSelected} />
      </div>

      {block.design?.customCss && (
        <style>{`.block-${block.id} { ${block.design.customCss} }`}</style>
      )}
    </div>
  );
}
