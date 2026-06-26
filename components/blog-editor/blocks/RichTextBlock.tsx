"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useCallback, useEffect, useRef } from "react";
import { createTipTapExtensions } from "@/lib/blog-editor/tiptap/extensions";
import { parseTipTapContent } from "@/lib/blog-editor/tiptap/parse-content";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { useEditorUIStore } from "@/lib/blog-editor/store/ui-store";
import { cn } from "@/lib/utils";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  Italic,
  Link2,
  RemoveFormatting,
  Strikethrough,
  Subscript,
  Superscript,
  Underline as UnderlineIcon,
} from "lucide-react";

interface RichTextBlockProps {
  blockId: string;
  blockIndex: number;
  content?: string;
  onChange: (json: string) => void;
  onSlash?: (query: string) => void;
  placeholder?: string;
  className?: string;
  headingLevel?: number;
  enableBlockKeys?: boolean;
}

const TEXT_COLORS = ["#1A1A18", "#0F6E56", "#E24B4A", "#378ADD", "#EF9F27"];

export function RichTextBlock({
  blockId,
  blockIndex,
  content,
  onChange,
  onSlash,
  placeholder,
  className,
  headingLevel,
  enableBlockKeys = true,
}: RichTextBlockProps) {
  const contentVersion = useEditorStore(s => s.contentVersion);
  const focusBlockId = useEditorStore(s => s.focusBlockId);
  const setFocusBlockId = useEditorStore(s => s.setFocusBlockId);
  const readOnly = useEditorStore(s => s.readOnly);
  const addBlock = useEditorStore(s => s.addBlock);
  const removeBlock = useEditorStore(s => s.removeBlock);
  const slashMenuOpen = useEditorUIStore(s => s.slashMenuOpen);
  const slashMenuBlockId = useEditorUIStore(s => s.slashMenuBlockId);
  const setSlashMenuQuery = useEditorUIStore(s => s.setSlashMenuQuery);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastExternalContent = useRef(content);
  const skipSyncRef = useRef(false);

  const debouncedOnChange = useCallback(
    (json: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(json), 300);
    },
    [onChange]
  );

  const editor = useEditor({
    extensions: createTipTapExtensions({ placeholder }),
    content: parseTipTapContent(content),
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn("outline-none min-h-[1.5em] prose-editor", className),
        "data-placeholder": placeholder ?? "Type / for blocks…",
      },
      handleKeyDown: (view, event) => {
        if (readOnly) return false;

        if (event.key === "/" && onSlash) {
          onSlash("");
          return false;
        }

        if (!enableBlockKeys) return false;

        const ed = view.state;
        const { $from } = ed.selection;
        const atEnd = $from.pos >= ed.doc.content.size - 1;
        const isEmpty = view.state.doc.textContent.trim().length === 0;

        if (event.key === "Enter" && !event.shiftKey) {
          if (event.metaKey || event.ctrlKey) {
            addBlock("paragraph", blockIndex + 1);
            return true;
          }
          if (isEmpty) return false;
          if (atEnd) {
            addBlock("paragraph", blockIndex + 1);
            return true;
          }
        }

        if (event.key === "Backspace" && isEmpty && $from.parentOffset === 0) {
          const blockCount = useEditorStore.getState().blocks.length;
          if (blockCount > 1) {
            removeBlock(blockId);
            return true;
          }
        }

        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON());
      skipSyncRef.current = true;
      lastExternalContent.current = json;
      debouncedOnChange(json);

      if (slashMenuOpen && slashMenuBlockId === blockId) {
        const text = ed.state.doc.textContent;
        const slashIdx = text.lastIndexOf("/");
        if (slashIdx >= 0) {
          setSlashMenuQuery(text.slice(slashIdx + 1));
        }
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor || headingLevel === undefined) return;
    editor.chain().focus().setHeading({ level: headingLevel as 1 | 2 | 3 | 4 | 5 | 6 }).run();
  }, [editor, headingLevel]);

  useEffect(() => {
    if (!editor || skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    if (content === lastExternalContent.current) return;
    lastExternalContent.current = content;
    editor.commands.setContent(parseTipTapContent(content), { emitUpdate: false });
  }, [editor, content, contentVersion]);

  useEffect(() => {
    if (!editor || focusBlockId !== blockId) return;
    editor.commands.focus("end");
    setFocusBlockId(null);
  }, [editor, focusBlockId, blockId, setFocusBlockId]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (!editor) {
    return <div className="prose-editor-loading" aria-hidden="true" />;
  }

  return (
    <div className="relative">
      {editor && !readOnly && (
        <BubbleMenu
          editor={editor}
          className="flex flex-wrap items-center gap-0.5 p-1 rounded-xl border shadow-lg max-w-[90vw]"
          style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }}
        >
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="Bold">
            <Bold className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="Italic">
            <Italic className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} label="Underline">
            <UnderlineIcon className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} label="Strikethrough">
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => {
              const url = window.prompt("URL");
              if (url) editor.chain().focus().setLink({ href: url }).run();
            }}
            active={editor.isActive("link")}
            label="Link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} label="Highlight">
            <Highlighter className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive("superscript")} label="Superscript">
            <Superscript className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive("subscript")} label="Subscript">
            <Subscript className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <span className="w-px h-5 mx-0.5" style={{ background: "var(--c-border)" }} />
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} label="Align left">
            <AlignLeft className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} label="Align center">
            <AlignCenter className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} label="Align right">
            <AlignRight className="w-3.5 h-3.5" />
          </ToolbarBtn>
          <span className="w-px h-5 mx-0.5" style={{ background: "var(--c-border)" }} />
          {TEXT_COLORS.map(color => (
            <button
              key={color}
              type="button"
              aria-label={`Text color ${color}`}
              onClick={() => editor.chain().focus().setColor(color).run()}
              className="w-5 h-5 rounded-full border shrink-0"
              style={{ background: color, borderColor: "var(--c-border)" }}
            />
          ))}
          <ToolbarBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} label="Clear">
            <RemoveFormatting className="w-3.5 h-3.5" />
          </ToolbarBtn>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarBtn({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        active ? "bg-[var(--nav-active-bg)] text-[var(--c-primary)]" : "hover:bg-black/5 dark:hover:bg-white/5"
      )}
      style={{ color: active ? "var(--c-primary)" : "var(--c-text-sub)" }}
    >
      {children}
    </button>
  );
}
