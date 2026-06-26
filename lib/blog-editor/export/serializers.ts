import type { BlockNode } from "../types";
import { flattenBlocks } from "../utils/blocks";

export function blocksToHtml(blocks: BlockNode[]): string {
  return flattenBlocks(blocks)
    .map(blockToHtml)
    .filter(Boolean)
    .join("\n");
}

export function renderBlockToHtml(block: BlockNode): string {
  return blockToHtml(block);
}

function blockToHtml(block: BlockNode): string {
  const style = block.design?.customCss ? ` style="${escapeAttr(block.design.customCss)}"` : "";
  const cls = block.design?.customCss ? ` class="block-${block.id}"` : "";

  switch (block.type) {
    case "paragraph":
      return `<p${cls}${style}>${contentToHtml(block.content)}</p>`;
    case "heading": {
      const level = (block.attrs?.level as number) ?? 2;
      return `<h${level}${cls}${style}>${contentToHtml(block.content)}</h${level}>`;
    }
    case "quote":
      return `<blockquote${cls}${style}>${contentToHtml(block.content)}${block.attrs?.citation ? `<cite>${escapeHtml(String(block.attrs.citation))}</cite>` : ""}</blockquote>`;
    case "code":
      return `<pre${cls}${style}><code class="language-${block.attrs?.language ?? "text"}">${escapeHtml(contentToPlain(block.content))}</code></pre>`;
    case "image":
      return `<figure${cls}${style}><img src="${escapeAttr(String(block.attrs?.url ?? ""))}" alt="${escapeAttr(String(block.attrs?.alt ?? ""))}" loading="lazy" />${block.attrs?.caption ? `<figcaption>${escapeHtml(String(block.attrs.caption))}</figcaption>` : ""}</figure>`;
    case "video":
      return `<video${cls}${style} src="${escapeAttr(String(block.attrs?.url ?? ""))}" controls${block.attrs?.autoplay ? " autoplay" : ""}></video>`;
    case "divider":
      return `<hr${cls}${style} />`;
    case "spacer":
      return `<div${cls} style="height:${block.attrs?.height ?? 48}px"${style} aria-hidden="true"></div>`;
    case "button":
      return `<a href="${escapeAttr(String(block.attrs?.url ?? "#"))}" class="btn btn-${block.attrs?.variant ?? "primary"}"${cls}${style}>${escapeHtml(String(block.attrs?.label ?? "Click"))}</a>`;
    case "embed": {
      const url = String(block.attrs?.url ?? "");
      const embed = url.includes("youtube") || url.includes("youtu.be")
        ? `<iframe src="${escapeAttr(embedUrl(url))}" allowfullscreen loading="lazy"></iframe>`
        : String(block.attrs?.embedHtml ?? "");
      return `<div class="embed"${cls}${style}>${embed}</div>`;
    }
    case "customHtml":
      return String(block.attrs?.html ?? "");
    case "fileDownload":
      return `<a href="${escapeAttr(String(block.attrs?.url ?? ""))}" download${cls}${style}>${escapeHtml(String(block.attrs?.label ?? "Download"))}</a>`;
    case "list":
    case "table":
      return `<div${cls}${style}>${contentToHtml(block.content)}</div>`;
    case "gallery": {
      const images = (block.attrs?.images as { url: string; alt?: string }[]) ?? [];
      const imgs = images
        .map(img => `<img src="${escapeAttr(img.url)}" alt="${escapeAttr(img.alt ?? "")}" loading="lazy" />`)
        .join("");
      return `<div class="gallery grid"${cls}${style}>${imgs}</div>`;
    }
    case "columns":
    case "group":
      return (block.innerBlocks ?? [])
        .flatMap(inner => (inner.innerBlocks ?? [inner]).map(child => blockToHtml(child)))
        .join("\n");
    default:
      return contentToHtml(block.content);
  }
}

function contentToHtml(content?: string): string {
  if (!content) return "";
  try {
    const json = JSON.parse(content);
    return tipTapToHtml(json);
  } catch {
    return content;
  }
}

function contentToPlain(content?: string): string {
  if (!content) return "";
  try {
    return extractText(JSON.parse(content));
  } catch {
    return content.replace(/<[^>]+>/g, "");
  }
}

function tipTapToHtml(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; marks?: { type: string; attrs?: Record<string, unknown> }[]; content?: unknown[]; attrs?: Record<string, unknown> };
  if (n.type === "text" && n.text) {
    let t = escapeHtml(n.text);
    for (const mark of n.marks ?? []) {
      if (mark.type === "bold") t = `<strong>${t}</strong>`;
      if (mark.type === "italic") t = `<em>${t}</em>`;
      if (mark.type === "underline") t = `<u>${t}</u>`;
      if (mark.type === "strike") t = `<s>${t}</s>`;
      if (mark.type === "link") t = `<a href="${escapeAttr(String(mark.attrs?.href ?? ""))}">${t}</a>`;
      if (mark.type === "highlight") t = `<mark>${t}</mark>`;
      if (mark.type === "textStyle" && mark.attrs?.color) {
        t = `<span style="color:${escapeAttr(String(mark.attrs.color))}">${t}</span>`;
      }
    }
    return t;
  }
  const inner = (n.content ?? []).map(tipTapToHtml).join("");
  switch (n.type) {
    case "doc":
    case "paragraph": {
      const align = n.attrs?.textAlign ? ` style="text-align:${escapeAttr(String(n.attrs.textAlign))}"` : "";
      return `<p${align}>${inner}</p>`;
    }
    case "heading": {
      const align = n.attrs?.textAlign ? ` style="text-align:${escapeAttr(String(n.attrs.textAlign))}"` : "";
      return `<h${n.attrs?.level ?? 2}${align}>${inner}</h${n.attrs?.level ?? 2}>`;
    }
    case "bulletList":
      return `<ul>${inner}</ul>`;
    case "orderedList":
      return `<ol>${inner}</ol>`;
    case "listItem":
      return `<li>${inner}</li>`;
    case "blockquote":
      return `<blockquote>${inner}</blockquote>`;
    case "codeBlock":
      return `<pre><code>${inner}</code></pre>`;
    case "table":
      return `<table>${inner}</table>`;
    case "tableRow":
      return `<tr>${inner}</tr>`;
    case "tableHeader":
      return `<th>${inner}</th>`;
    case "tableCell":
      return `<td>${inner}</td>`;
    case "hardBreak":
      return "<br />";
    default:
      return inner;
  }
}

function extractText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { text?: string; content?: unknown[] };
  if (n.text) return n.text;
  return (n.content ?? []).map(extractText).join("");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}

function embedUrl(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.match(/(?:v=|youtu\.be\/)([^&]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  return url;
}

export function blocksToMarkdown(blocks: BlockNode[]): string {
  return flattenBlocks(blocks)
    .map(b => {
      const plain = contentToPlain(b.content);
      switch (b.type) {
        case "heading": {
          const level = (b.attrs?.level as number) ?? 2;
          return `${"#".repeat(level)} ${plain}`;
        }
        case "quote":
          return `> ${plain}`;
        case "code":
          return "```" + (b.attrs?.language ?? "") + "\n" + plain + "\n```";
        case "divider":
          return "---";
        case "image":
          return `![${b.attrs?.alt ?? ""}](${b.attrs?.url ?? ""})`;
        default:
          return plain;
      }
    })
    .filter(Boolean)
    .join("\n\n");
}
