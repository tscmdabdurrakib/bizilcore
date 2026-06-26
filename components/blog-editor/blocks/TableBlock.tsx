"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect, useRef } from "react";
import { createTableExtensions, emptyTableContent } from "@/lib/blog-editor/tiptap/table-extensions";
import { parseTipTapContent } from "@/lib/blog-editor/tiptap/parse-content";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { Plus, Trash2 } from "lucide-react";

interface TableBlockProps {
  content?: string;
  rows?: number;
  cols?: number;
  onChange: (json: string) => void;
}

export function TableBlock({ content, rows = 3, cols = 3, onChange }: TableBlockProps) {
  const contentVersion = useEditorStore(s => s.contentVersion);
  const readOnly = useEditorStore(s => s.readOnly);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContent = useRef(content);

  const editor = useEditor({
    extensions: createTableExtensions(),
    content: content ? parseTipTapContent(content) : JSON.parse(emptyTableContent(rows, cols)),
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "outline-none prose-editor" },
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
      content ? parseTipTapContent(content) : JSON.parse(emptyTableContent(rows, cols)),
      { emitUpdate: false }
    );
  }, [editor, content, contentVersion, rows, cols]);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  if (!editor) return <div className="prose-editor-loading" aria-hidden="true" />;

  return (
    <div>
      {!readOnly && (
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border"
            style={{ borderColor: "var(--c-border)" }}
          >
            <Plus className="w-3 h-3" /> Row
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border"
            style={{ borderColor: "var(--c-border)" }}
          >
            <Plus className="w-3 h-3" /> Column
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border"
            style={{ borderColor: "var(--c-border)" }}
          >
            <Trash2 className="w-3 h-3" /> Row
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border"
            style={{ borderColor: "var(--c-border)" }}
          >
            <Trash2 className="w-3 h-3" /> Column
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
