import type { LucideIcon } from "lucide-react";
import {
  Type, Heading1, Image, Video, Images, Quote, Code, List, Table,
  Globe, MousePointerClick, Columns, Space, Minus, Download, Code2, Group,
} from "lucide-react";
import type { BlockType } from "../types";

export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  icon: LucideIcon;
  category: "text" | "media" | "layout" | "embed" | "other";
  keywords: string[];
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  { type: "paragraph", label: "Paragraph", description: "Plain text block", icon: Type, category: "text", keywords: ["text", "p"] },
  { type: "heading", label: "Heading", description: "Section heading", icon: Heading1, category: "text", keywords: ["h1", "h2", "title"] },
  { type: "list", label: "List", description: "Bullet or numbered list", icon: List, category: "text", keywords: ["ul", "ol", "bullet"] },
  { type: "quote", label: "Quote", description: "Blockquote with citation", icon: Quote, category: "text", keywords: ["blockquote"] },
  { type: "code", label: "Code", description: "Syntax highlighted code", icon: Code, category: "text", keywords: ["pre", "snippet"] },
  { type: "image", label: "Image", description: "Single image with caption", icon: Image, category: "media", keywords: ["photo", "picture"] },
  { type: "video", label: "Video", description: "Video embed or upload", icon: Video, category: "media", keywords: ["mp4", "youtube"] },
  { type: "gallery", label: "Gallery", description: "Image grid gallery", icon: Images, category: "media", keywords: ["photos", "grid"] },
  { type: "embed", label: "Embed", description: "YouTube, Twitter, etc.", icon: Globe, category: "embed", keywords: ["iframe", "social"] },
  { type: "button", label: "Button", description: "Call-to-action button", icon: MousePointerClick, category: "layout", keywords: ["cta", "link"] },
  { type: "columns", label: "Columns", description: "Multi-column layout", icon: Columns, category: "layout", keywords: ["grid", "layout"] },
  { type: "group", label: "Group", description: "Container for nested blocks", icon: Group, category: "layout", keywords: ["container", "wrapper"] },
  { type: "table", label: "Table", description: "Data table", icon: Table, category: "layout", keywords: ["rows", "cells"] },
  { type: "spacer", label: "Spacer", description: "Vertical spacing", icon: Space, category: "layout", keywords: ["gap", "margin"] },
  { type: "divider", label: "Divider", description: "Horizontal rule", icon: Minus, category: "layout", keywords: ["hr", "line"] },
  { type: "fileDownload", label: "File Download", description: "Downloadable file link", icon: Download, category: "media", keywords: ["pdf", "attachment"] },
  { type: "customHtml", label: "Custom HTML", description: "Raw HTML block", icon: Code2, category: "other", keywords: ["html", "embed"] },
];

export const TRANSFORM_MAP: Partial<Record<BlockType, BlockType[]>> = {
  paragraph: ["heading", "quote", "list"],
  heading: ["paragraph", "quote"],
  quote: ["paragraph", "heading"],
  list: ["paragraph"],
};

export function filterBlocks(query: string): BlockDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return BLOCK_DEFINITIONS;
  return BLOCK_DEFINITIONS.filter(
    b =>
      b.label.toLowerCase().includes(q) ||
      b.type.includes(q) ||
      b.keywords.some(k => k.includes(q))
  );
}
