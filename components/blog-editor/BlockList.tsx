"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import type { BlockNode } from "@/lib/blog-editor/types";
import { createEmptyDocument } from "@/lib/blog-editor/utils/blocks";
import { BlockWrapper } from "./BlockWrapper";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";

interface BlockListProps {
  blocks: BlockNode[];
}

export function BlockList({ blocks }: BlockListProps) {
  const reorderBlocks = useEditorStore(s => s.reorderBlocks);
  const setBlocks = useEditorStore(s => s.setBlocks);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (blocks.length === 0) {
      setBlocks(createEmptyDocument());
    }
  }, [blocks.length, setBlocks]);

  const displayBlocks = blocks.length > 0 ? blocks : createEmptyDocument();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const useVirtual = displayBlocks.length > 30;
  const virtualizer = useVirtualizer({
    count: displayBlocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    enabled: useVirtual,
  });

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = displayBlocks.findIndex(b => b.id === active.id);
    const newIndex = displayBlocks.findIndex(b => b.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) reorderBlocks(oldIndex, newIndex);
  }

  if (displayBlocks.length === 0) return null;

  const content = useVirtual ? (
    <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
      {virtualizer.getVirtualItems().map(vItem => {
        const block = displayBlocks[vItem.index];
        return (
          <div
            key={block.id}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vItem.start}px)`,
            }}
          >
            <BlockWrapper block={block} index={vItem.index} />
          </div>
        );
      })}
    </div>
  ) : (
    displayBlocks.map((block, index) => (
      <BlockWrapper key={block.id} block={block} index={index} />
    ))
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={displayBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div ref={parentRef} className="space-y-2 pl-10" role="document" aria-label="Post content">
          {content}
        </div>
      </SortableContext>
    </DndContext>
  );
}
