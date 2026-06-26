"use client";

import type { BlockNode } from "@/lib/blog-editor/types";
import { PublicBlockViews } from "./PublicBlockViews";

export function PublicBlockRenderer({ blocks }: { blocks: BlockNode[] }) {
  return <PublicBlockViews blocks={blocks} />;
}
