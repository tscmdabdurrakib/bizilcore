"use client";

import type { BlockNode } from "@/lib/blog-editor/types";
import { renderBlockToHtml } from "@/lib/blog-editor/export/serializers";

export function PublicBlockViews({ blocks }: { blocks: BlockNode[] }) {
  return (
    <article className="blog-content">
      {blocks.map(block => (
        <PublicBlockView key={block.id} block={block} />
      ))}
    </article>
  );
}

function PublicBlockView({ block }: { block: BlockNode }) {
  if (block.type === "columns" || block.type === "group") {
    return (
      <div className="mb-6">
        {(block.innerBlocks ?? []).map(col => (
          <div key={col.id} className="mb-4">
            {(col.innerBlocks ?? [col]).map(inner => (
              <PublicBlockView key={inner.id} block={inner} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const html = renderBlockToHtml(block);
  if (!html) return null;

  return (
    <div
      className="mb-6 blog-block-view"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
