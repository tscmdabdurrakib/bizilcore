import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "@/lib/blog-editor/utils/slugify";
import { createBlock, extractPlainText, wordCount, generateExcerpt } from "@/lib/blog-editor/utils/blocks";
import { analyzeSEO } from "@/lib/blog-editor/seo/analyzer";

describe("slugify", () => {
  it("creates URL-safe slugs", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("  Test Post  ")).toBe("test-post");
  });

  it("handles unique slugs", () => {
    expect(uniqueSlug("hello", ["hello"])).toBe("hello-2");
    expect(uniqueSlug("hello", ["hello", "hello-2"])).toBe("hello-3");
  });
});

describe("blocks utils", () => {
  it("creates blocks with ids", () => {
    const block = createBlock("paragraph");
    expect(block.type).toBe("paragraph");
    expect(block.id).toBeTruthy();
  });

  it("extracts plain text and word count", () => {
    const blocks = [createBlock("paragraph")];
    blocks[0].content = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello world test" }] }],
    });
    const text = extractPlainText(blocks);
    expect(wordCount(text)).toBe(3);
    expect(generateExcerpt(blocks, 10).length).toBeLessThanOrEqual(11);
  });
});

describe("SEO analyzer", () => {
  it("returns analysis scores", () => {
    const blocks = [createBlock("paragraph")];
    blocks[0].content = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "A ".repeat(100) }] }],
    });
    const result = analyzeSEO(blocks, "This is a meta description that is long enough for SEO purposes and testing.", "test");
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.readabilityScore).toBeGreaterThanOrEqual(0);
  });
});
