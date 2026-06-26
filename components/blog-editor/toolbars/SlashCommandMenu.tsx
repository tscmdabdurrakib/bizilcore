"use client";

import { useMemo } from "react";
import { CommandMenu } from "@/components/ui/CommandMenu";
import { BLOCK_DEFINITIONS, filterBlocks } from "@/lib/blog-editor/blocks/registry";
import { BLOCK_PATTERNS } from "@/lib/blog-editor/patterns";
import { useEditorUIStore } from "@/lib/blog-editor/store/ui-store";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import type { BlockType } from "@/lib/blog-editor/types";

export function SlashCommandMenu() {
  const { slashMenuOpen, slashMenuQuery, slashMenuBlockId, closeSlashMenu } = useEditorUIStore();
  const { addBlock, blocks, setBlocks, pushHistory } = useEditorStore();

  const items = useMemo(() => {
    const blockItems = filterBlocks(slashMenuQuery).map(b => {
      const Icon = b.icon;
      return {
        id: `block:${b.type}`,
        label: b.label,
        description: b.description,
        icon: <Icon className="w-4 h-4" style={{ color: "var(--c-primary)" }} />,
        group: b.category,
      };
    });

    const patternItems = BLOCK_PATTERNS
      .filter(p => !slashMenuQuery || p.name.toLowerCase().includes(slashMenuQuery.toLowerCase()))
      .map(p => ({
        id: `pattern:${p.id}`,
        label: p.name,
        description: p.description,
        group: "Patterns",
      }));

    return [...blockItems, ...patternItems];
  }, [slashMenuQuery]);

  function handleSelect(id: string) {
    if (id.startsWith("block:")) {
      const type = id.replace("block:", "") as BlockType;
      const idx = slashMenuBlockId ? blocks.findIndex(b => b.id === slashMenuBlockId) + 1 : blocks.length;
      addBlock(type, idx);
    } else if (id.startsWith("pattern:")) {
      const patternId = id.replace("pattern:", "");
      const pattern = BLOCK_PATTERNS.find(p => p.id === patternId);
      if (pattern) {
        pushHistory();
        setBlocks([...blocks, ...pattern.blocks]);
      }
    }
    closeSlashMenu();
  }

  if (!slashMenuOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[30vh]">
      <div className="absolute inset-0" onClick={closeSlashMenu} aria-hidden="true" />
      <CommandMenu
        open={slashMenuOpen}
        query={slashMenuQuery}
        onSelect={handleSelect}
        onClose={closeSlashMenu}
        items={items}
        className="relative shadow-2xl w-80"
      />
    </div>
  );
}
