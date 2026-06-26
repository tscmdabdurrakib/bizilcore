import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import type { Extensions } from "@tiptap/react";

export function createTableExtensions(options?: { placeholder?: string }): Extensions {
  return [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      codeBlock: false,
      horizontalRule: false,
      link: false,
      underline: false,
    }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Placeholder.configure({
      placeholder: options?.placeholder ?? "Cell…",
    }),
  ];
}

export function emptyTableContent(rows = 3, cols = 3): string {
  const headerRow = {
    type: "tableRow",
    content: Array.from({ length: cols }, () => ({
      type: "tableHeader",
      content: [{ type: "paragraph" }],
    })),
  };
  const bodyRow = {
    type: "tableRow",
    content: Array.from({ length: cols }, () => ({
      type: "tableCell",
      content: [{ type: "paragraph" }],
    })),
  };

  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "table",
        content: [headerRow, ...Array.from({ length: rows - 1 }, () => ({ ...bodyRow, content: [...bodyRow.content] }))],
      },
    ],
  });
}
