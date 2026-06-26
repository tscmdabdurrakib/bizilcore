import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import type { Extensions } from "@tiptap/react";

const lowlight = createLowlight(common);

export function createTipTapExtensions(options?: { placeholder?: string }): Extensions {
  return [
    StarterKit.configure({
      codeBlock: false,
      link: false,
      underline: false,
      heading: { levels: [1, 2, 3, 4, 5, 6] },
    }),
    Link.configure({ openOnClick: false, HTMLAttributes: { class: "editor-link" } }),
    Underline,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Placeholder.configure({ placeholder: options?.placeholder ?? "Type / for blocks…" }),
    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,
    TextStyle,
    Color,
    CodeBlockLowlight.configure({ lowlight }),
  ];
}

export function emptyDocContent(): string {
  return JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
}

export function htmlToTipTapContent(html: string): string {
  return JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: html ? [{ type: "text", text: html.replace(/<[^>]+>/g, "") }] : [] }],
  });
}
