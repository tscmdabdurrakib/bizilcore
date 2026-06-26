import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Placeholder from "@tiptap/extension-placeholder";
import { common, createLowlight } from "lowlight";
import type { Extensions } from "@tiptap/react";

const lowlight = createLowlight(common);

export function createCodeExtensions(language = "javascript"): Extensions {
  return [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      bulletList: false,
      orderedList: false,
      listItem: false,
      horizontalRule: false,
      link: false,
      underline: false,
      codeBlock: false,
    }),
    CodeBlockLowlight.configure({ lowlight, defaultLanguage: language }),
    Placeholder.configure({ placeholder: "// Code…" }),
  ];
}

export function emptyCodeContent(language = "javascript"): string {
  return JSON.stringify({
    type: "doc",
    content: [{ type: "codeBlock", attrs: { language } }],
  });
}
