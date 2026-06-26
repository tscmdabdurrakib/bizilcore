"use client";

import type { BlockNode } from "@/lib/blog-editor/types";
import { RichTextBlock } from "./RichTextBlock";
import { ListBlock } from "./ListBlock";
import { TableBlock } from "./TableBlock";
import { CodeBlockEditor } from "./CodeBlockEditor";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { useEditorUIStore } from "@/lib/blog-editor/store/ui-store";
import Image from "next/image";
import { ImageIcon, Plus, Upload } from "lucide-react";

interface BlockRendererProps {
  block: BlockNode;
  blockIndex?: number;
  isSelected: boolean;
  isFocused: boolean;
  nested?: boolean;
}

export function BlockRenderer({
  block,
  blockIndex = 0,
  isSelected,
  isFocused,
  nested = false,
}: BlockRendererProps) {
  const updateBlock = useEditorStore(s => s.updateBlock);
  const addInnerBlock = useEditorStore(s => s.addInnerBlock);
  const blocks = useEditorStore(s => s.blocks);
  const readOnly = useEditorStore(s => s.readOnly);
  const openMediaLibrary = useEditorUIStore(s => s.openMediaLibrary);
  const openSlashMenu = useEditorUIStore(s => s.openSlashMenu);

  const resolvedIndex = nested ? blockIndex : blocks.findIndex(b => b.id === block.id);
  const index = resolvedIndex >= 0 ? resolvedIndex : blockIndex;

  const onContentChange = (content: string) => {
    updateBlock(block.id, b => ({ ...b, content }));
  };

  const richTextProps = {
    blockId: block.id,
    blockIndex: index,
    content: block.content,
    onChange: onContentChange,
    enableBlockKeys: !nested,
  };

  switch (block.type) {
    case "paragraph":
      return (
        <RichTextBlock
          {...richTextProps}
          onSlash={q => openSlashMenu(block.id, q)}
          placeholder="Start writing or type / for blocks…"
        />
      );

    case "heading": {
      const level = (block.attrs?.level as number) ?? 2;
      const sizes: Record<number, string> = {
        1: "text-4xl font-bold font-display",
        2: "text-3xl font-bold font-display",
        3: "text-2xl font-semibold font-display",
        4: "text-xl font-semibold",
        5: "text-lg font-medium",
        6: "text-base font-medium",
      };
      return (
        <RichTextBlock
          {...richTextProps}
          onSlash={q => openSlashMenu(block.id, q)}
          className={sizes[level] ?? sizes[2]}
          headingLevel={level}
          placeholder="Heading"
        />
      );
    }

    case "quote":
      return (
        <blockquote className="border-l-4 pl-4 italic" style={{ borderColor: "var(--c-primary)", color: "var(--c-text-sub)" }}>
          <RichTextBlock {...richTextProps} placeholder="Quote text…" enableBlockKeys={false} />
          {!readOnly && (
            <input
              type="text"
              value={String(block.attrs?.citation ?? "")}
              onChange={e => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, citation: e.target.value } }))}
              placeholder="— Citation"
              className="mt-2 w-full bg-transparent text-sm outline-none"
              style={{ color: "var(--c-text-muted)" }}
            />
          )}
          {readOnly && block.attrs?.citation && (
            <cite className="mt-2 block text-sm not-italic" style={{ color: "var(--c-text-muted)" }}>
              — {String(block.attrs.citation)}
            </cite>
          )}
        </blockquote>
      );

    case "code":
      return (
        <CodeBlockEditor
          content={block.content}
          language={String(block.attrs?.language ?? "javascript")}
          onChange={onContentChange}
          onLanguageChange={lang => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, language: lang } }))}
        />
      );

    case "list":
      return (
        <ListBlock
          content={block.content}
          ordered={Boolean(block.attrs?.ordered)}
          onChange={onContentChange}
          onToggleOrdered={ordered => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, ordered } }))}
        />
      );

    case "table":
      return (
        <TableBlock
          content={block.content}
          rows={Number(block.attrs?.rows ?? 3)}
          cols={Number(block.attrs?.cols ?? 3)}
          onChange={onContentChange}
        />
      );

    case "image":
      return (
        <figure>
          {block.attrs?.url ? (
            <div className="relative rounded-xl overflow-hidden">
              <Image
                src={String(block.attrs.url)}
                alt={String(block.attrs?.alt ?? "")}
                width={800}
                height={450}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            !readOnly && (
              <button
                type="button"
                onClick={() => openMediaLibrary(url => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, url } })))}
                className="w-full flex flex-col items-center justify-center gap-2 py-16 rounded-xl border-2 border-dashed transition-colors hover:border-[var(--c-primary)]"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}
              >
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm">Click or drag to upload image</span>
              </button>
            )
          )}
          {!readOnly && (
            <>
              <input
                type="text"
                value={String(block.attrs?.alt ?? "")}
                onChange={e => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, alt: e.target.value } }))}
                placeholder="Alt text (accessibility)"
                className="mt-2 w-full bg-transparent text-sm outline-none"
                style={{ color: "var(--c-text-muted)" }}
              />
              <input
                type="text"
                value={String(block.attrs?.caption ?? "")}
                onChange={e => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, caption: e.target.value } }))}
                placeholder="Caption"
                className="mt-1 w-full bg-transparent text-sm outline-none text-center italic"
                style={{ color: "var(--c-text-muted)" }}
              />
            </>
          )}
          {readOnly && block.attrs?.caption && (
            <figcaption className="mt-2 text-sm text-center italic" style={{ color: "var(--c-text-muted)" }}>
              {String(block.attrs.caption)}
            </figcaption>
          )}
        </figure>
      );

    case "video":
      return block.attrs?.url ? (
        <video src={String(block.attrs.url)} controls className="w-full rounded-xl" />
      ) : (
        !readOnly && (
          <button
            type="button"
            onClick={() => openMediaLibrary(url => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, url } })))}
            className="w-full flex items-center justify-center gap-2 py-12 rounded-xl border-2 border-dashed"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}
          >
            <Upload className="w-5 h-5" /> Add video
          </button>
        )
      );

    case "gallery": {
      const images = (block.attrs?.images as { url: string; alt?: string }[]) ?? [];
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
              <Image src={img.url} alt={img.alt ?? ""} fill className="object-cover" loading="lazy" />
            </div>
          ))}
          {!readOnly && (
            <button
              type="button"
              onClick={() => openMediaLibrary(url => {
                updateBlock(block.id, b => ({
                  ...b,
                  attrs: { ...b.attrs, images: [...images, { url, alt: "" }] },
                }));
              })}
              className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center"
              style={{ borderColor: "var(--c-border)" }}
            >
              <ImageIcon className="w-6 h-6" style={{ color: "var(--c-text-muted)" }} />
            </button>
          )}
        </div>
      );
    }

    case "embed":
      return (
        <div className="space-y-2">
          {!readOnly && (
            <input
              type="url"
              value={String(block.attrs?.url ?? "")}
              onChange={e => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, url: e.target.value } }))}
              placeholder="Paste YouTube or embed URL…"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--c-border)", background: "var(--c-bg)" }}
            />
          )}
          {Boolean(block.attrs?.url) && (
            <div className="aspect-video rounded-xl overflow-hidden bg-black/5">
              <iframe
                src={embedUrl(String(block.attrs.url))}
                className="w-full h-full"
                allowFullScreen
                title="Embed"
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            </div>
          )}
        </div>
      );

    case "button":
      return readOnly ? (
        <a
          href={String(block.attrs?.url ?? "#")}
          className="inline-flex px-5 py-2.5 rounded-xl font-medium text-sm text-white"
          style={{ background: "var(--c-primary)" }}
        >
          {String(block.attrs?.label ?? "Click here")}
        </a>
      ) : (
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="text"
            value={String(block.attrs?.label ?? "Click here")}
            onChange={e => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, label: e.target.value } }))}
            className="px-3 py-2 rounded-lg border text-sm flex-1"
            style={{ borderColor: "var(--c-border)" }}
          />
          <input
            type="url"
            value={String(block.attrs?.url ?? "#")}
            onChange={e => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, url: e.target.value } }))}
            className="px-3 py-2 rounded-lg border text-sm flex-1"
            style={{ borderColor: "var(--c-border)" }}
          />
          <span
            className="inline-flex px-5 py-2.5 rounded-xl font-medium text-sm text-white"
            style={{ background: "var(--c-primary)" }}
          >
            {String(block.attrs?.label ?? "Click here")}
          </span>
        </div>
      );

    case "columns":
      return (
        <div style={{ gridTemplateColumns: `repeat(${block.attrs?.count ?? 2}, 1fr)` }} className="grid gap-4">
          {(block.innerBlocks ?? []).map((col, colIdx) => (
            <div key={col.id} className="p-3 rounded-xl border min-h-[80px] space-y-2" style={{ borderColor: "var(--c-border)" }}>
              {(col.innerBlocks ?? []).map((inner, innerIdx) => (
                <BlockRenderer
                  key={inner.id}
                  block={inner}
                  blockIndex={innerIdx}
                  isSelected={false}
                  isFocused={false}
                  nested
                />
              ))}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => addInnerBlock(col.id, "paragraph")}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border w-full justify-center"
                  style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}
                >
                  <Plus className="w-3 h-3" /> Add block
                </button>
              )}
            </div>
          ))}
        </div>
      );

    case "spacer":
      return (
        <div
          className="flex items-center justify-center group"
          style={{ height: Number(block.attrs?.height ?? 48) }}
          aria-hidden="true"
        >
          {!readOnly && (
            <input
              type="range"
              min={16}
              max={200}
              value={Number(block.attrs?.height ?? 48)}
              onChange={e => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, height: Number(e.target.value) } }))}
              className="opacity-0 group-hover:opacity-100 w-full transition-opacity"
            />
          )}
        </div>
      );

    case "divider":
      return <hr className="border-t-2 my-2" style={{ borderColor: "var(--c-border)" }} />;

    case "fileDownload":
      return (
        <div className="flex gap-2 items-center">
          {!readOnly && (
            <input
              type="text"
              value={String(block.attrs?.label ?? "Download")}
              onChange={e => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, label: e.target.value } }))}
              className="flex-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--c-border)" }}
            />
          )}
          <a
            href={String(block.attrs?.url ?? "#")}
            download
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "var(--c-primary)" }}
          >
            {String(block.attrs?.label ?? "Download")}
          </a>
          {!readOnly && (
            <button
              type="button"
              onClick={() => openMediaLibrary(url => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, url } })))}
              className="px-3 py-2 rounded-lg border text-xs"
              style={{ borderColor: "var(--c-border)" }}
            >
              Choose file
            </button>
          )}
        </div>
      );

    case "customHtml":
      return readOnly ? (
        <div dangerouslySetInnerHTML={{ __html: String(block.attrs?.html ?? "") }} />
      ) : (
        <textarea
          value={String(block.attrs?.html ?? "")}
          onChange={e => updateBlock(block.id, b => ({ ...b, attrs: { ...b.attrs, html: e.target.value } }))}
          placeholder="<div>Custom HTML…</div>"
          className="w-full min-h-[120px] font-mono text-sm p-3 rounded-xl border"
          style={{ borderColor: "var(--c-border)", background: "var(--c-bg)" }}
          spellCheck={false}
        />
      );

    case "group":
      return (
        <div className="p-3 rounded-xl border border-dashed space-y-2" style={{ borderColor: "var(--c-border)" }}>
          {(block.innerBlocks ?? []).map((inner, innerIdx) => (
            <BlockRenderer
              key={inner.id}
              block={inner}
              blockIndex={innerIdx}
              isSelected={isSelected && isFocused}
              isFocused={isFocused}
              nested
            />
          ))}
          {!readOnly && (
            <button
              type="button"
              onClick={() => addInnerBlock(block.id, "paragraph")}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border w-full justify-center"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}
            >
              <Plus className="w-3 h-3" /> Add block
            </button>
          )}
        </div>
      );

    default:
      return (
        <RichTextBlock
          {...richTextProps}
          placeholder="Type something…"
        />
      );
  }
}

function embedUrl(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.match(/(?:v=|youtu\.be\/)([^&]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  }
  return url;
}
