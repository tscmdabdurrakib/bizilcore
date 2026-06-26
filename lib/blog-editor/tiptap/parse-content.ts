import { emptyDocContent } from "./extensions";

export function parseTipTapContent(content?: string): Record<string, unknown> {
  if (!content) {
    return JSON.parse(emptyDocContent()) as Record<string, unknown>;
  }
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return JSON.parse(emptyDocContent()) as Record<string, unknown>;
  }
}
