import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { Extensions } from "@tiptap/react";

export function createListExtensions(options?: { placeholder?: string; ordered?: boolean }): Extensions {
  return [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      codeBlock: false,
      horizontalRule: false,
      link: false,
      underline: false,
    }),
    Placeholder.configure({
      placeholder: options?.placeholder ?? "List item…",
    }),
  ];
}

export function emptyListContent(ordered = false): string {
  const listType = ordered ? "orderedList" : "bulletList";
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: listType,
        content: [{ type: "listItem", content: [{ type: "paragraph" }] }],
      },
    ],
  });
}
