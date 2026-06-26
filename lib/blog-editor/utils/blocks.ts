import { nanoid } from "nanoid";
import type { BlockNode, BlockType } from "../types";

export function createBlock(type: BlockType, attrs?: Record<string, unknown>): BlockNode {
  const defaults: Partial<Record<BlockType, Record<string, unknown>>> = {
    heading: { level: 2 },
    list: { ordered: false },
    columns: { count: 2 },
    spacer: { height: 48 },
    divider: { style: "solid" },
    code: { language: "javascript" },
    button: { label: "Click here", url: "#", variant: "primary" },
    embed: { provider: "youtube", url: "" },
    image: { url: "", alt: "" },
    video: { url: "", autoplay: false },
    gallery: { images: [] },
    table: { rows: 3, cols: 3 },
    group: {},
    quote: { citation: "" },
    fileDownload: { url: "", label: "Download" },
    customHtml: { html: "" },
  };

  const block: BlockNode = {
    id: nanoid(10),
    type,
    attrs: { ...defaults[type], ...attrs },
  };

  if (type === "columns") {
    const count = (block.attrs?.count as number) ?? 2;
    block.innerBlocks = Array.from({ length: count }, () => ({
      id: nanoid(10),
      type: "group" as BlockType,
      innerBlocks: [createBlock("paragraph")],
    }));
  }

  if (type === "group") {
    block.innerBlocks = block.innerBlocks ?? [createBlock("paragraph")];
  }

  return block;
}

export function createEmptyDocument(): BlockNode[] {
  return [createBlock("paragraph")];
}

export function cloneBlocks(blocks: BlockNode[]): BlockNode[] {
  try {
    return JSON.parse(JSON.stringify(blocks)) as BlockNode[];
  } catch {
    return blocks.map(b => ({
      ...b,
      attrs: b.attrs ? { ...b.attrs } : undefined,
      innerBlocks: b.innerBlocks ? cloneBlocks(b.innerBlocks) : undefined,
    }));
  }
}

export function findBlock(blocks: BlockNode[], id: string): BlockNode | null {
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.innerBlocks) {
      const found = findBlock(block.innerBlocks, id);
      if (found) return found;
    }
  }
  return null;
}

export function updateBlockTree(
  blocks: BlockNode[],
  id: string,
  updater: (block: BlockNode) => BlockNode
): BlockNode[] {
  return blocks.map(block => {
    if (block.id === id) return updater(block);
    if (block.innerBlocks) {
      return { ...block, innerBlocks: updateBlockTree(block.innerBlocks, id, updater) };
    }
    return block;
  });
}

export function removeBlockFromTree(blocks: BlockNode[], id: string): BlockNode[] {
  return blocks
    .filter(b => b.id !== id)
    .map(b =>
      b.innerBlocks
        ? { ...b, innerBlocks: removeBlockFromTree(b.innerBlocks, id) }
        : b
    );
}

export function insertBlockAt(
  blocks: BlockNode[],
  index: number,
  block: BlockNode
): BlockNode[] {
  const next = [...blocks];
  next.splice(index, 0, block);
  return next;
}

export function moveBlock(blocks: BlockNode[], from: number, to: number): BlockNode[] {
  const next = [...blocks];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function flattenBlocks(blocks: BlockNode[]): BlockNode[] {
  const result: BlockNode[] = [];
  for (const block of blocks) {
    result.push(block);
    if (block.innerBlocks) result.push(...flattenBlocks(block.innerBlocks));
  }
  return result;
}

export function extractPlainText(blocks: BlockNode[]): string {
  return flattenBlocks(blocks)
    .map(b => {
      if (b.content) {
        try {
          const json = JSON.parse(b.content);
          return extractTextFromTipTap(json);
        } catch {
          return b.content.replace(/<[^>]+>/g, " ");
        }
      }
      if (b.type === "heading" && b.attrs?.text) return String(b.attrs.text);
      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTextFromTipTap(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; content?: unknown[] };
  if (n.text) return n.text;
  if (n.content) return n.content.map(extractTextFromTipTap).join(" ");
  return "";
}

export function wordCount(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

export function readingTimeMinutes(text: string, wpm = 200): number {
  return Math.max(1, Math.ceil(wordCount(text) / wpm));
}

export function generateExcerpt(blocks: BlockNode[], maxLen = 160): string {
  const text = extractPlainText(blocks);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}
