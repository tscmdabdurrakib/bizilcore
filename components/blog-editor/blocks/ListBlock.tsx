"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useRef } from "react";
import { createListExtensions, emptyListContent } from "@/lib/blog-editor/tiptap/list-extensions";
import { parseTipTapContent } from "@/lib/blog-editor/tiptap/parse-content";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { cn } from "@/lib/utils";

interface ListBlockProps {
  content?: string;
  ordered?: boolean;
  onChange: (json: string) => void;
  onToggleOrdered: (ordered: boolean) => void;
}

export function ListBlock(props: ListBlockProps) {
  return <ListBlockEditor key={String(props.ordered)} {...props} />;
}

function ListBlockEditor({ content, ordered = false, onChange, onToggleOrdered }: ListBlockProps) {
  const contentVersion = useEditorStore(s => s.contentVersion);
  const readOnly = useEditorStore(s => s.readOnly);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContent = useRef(content);

  const editor = useEditor({
    extensions: createListExtensions({ ordered }),
    content: content ? parseTipTapContent(content) : JSON.parse(emptyListContent(ordered)),
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "outline-none min-h-[1.5em] prose-editor" },
    },
    onUpdate: ({ editor: ed }) => {
      const json = JSON.stringify(ed.getJSON());
      lastContent.current = json;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(json), 300);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor || content === lastContent.current) return;
    lastContent.current = content;
    editor.commands.setContent(
      content ? parseTipTapContent(content) : JSON.parse(emptyListContent(ordered)),
      { emitUpdate: false }
    );
  }, [editor, content, contentVersion, ordered]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  if (!editor) return <div className="prose-editor-loading" aria-hidden="true" />;

  return (
    <div>
      {!readOnly && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => onToggleOrdered(false)}
            className={cn(
              "px-2 py-1 text-xs rounded-lg border",
              !ordered && "border-[var(--c-primary)] text-[var(--c-primary)]"
            )}
            style={{ borderColor: !ordered ? "var(--c-primary)" : "var(--c-border)" }}
          >
            Bullet
          </button>
          <button
            type="button"
            onClick={() => onToggleOrdered(true)}
            className={cn(
              "px-2 py-1 text-xs rounded-lg border",
              ordered && "border-[var(--c-primary)] text-[var(--c-primary)]"
            )}
            style={{ borderColor: ordered ? "var(--c-primary)" : "var(--c-border)" }}
          >
            Numbered
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
