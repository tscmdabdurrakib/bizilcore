import type { BlockNode } from "../types";
import { extractPlainText, wordCount, readingTimeMinutes } from "../utils/blocks";

export interface SEOAnalysis {
  readabilityScore: number;
  keywordDensity: number;
  metaDescriptionLength: number;
  metaDescriptionOk: boolean;
  wordCount: number;
  readingTimeMinutes: number;
  suggestions: string[];
}

export function analyzeSEO(
  blocks: BlockNode[],
  metaDescription: string | null,
  focusKeyword?: string
): SEOAnalysis {
  const text = extractPlainText(blocks);
  const words = wordCount(text);
  const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const syllables = estimateSyllables(text);
  const readabilityScore = Math.round(
    Math.max(0, Math.min(100, 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)))
  );

  let keywordDensity = 0;
  if (focusKeyword && words > 0) {
    const matches = (text.toLowerCase().match(new RegExp(focusKeyword.toLowerCase(), "g")) ?? []).length;
    keywordDensity = Math.round((matches / words) * 1000) / 10;
  }

  const metaLen = metaDescription?.length ?? 0;
  const suggestions: string[] = [];
  if (words < 300) suggestions.push("Content is short — aim for 300+ words for better SEO.");
  if (metaLen < 120) suggestions.push("Meta description is too short (120–160 chars ideal).");
  if (metaLen > 160) suggestions.push("Meta description may be truncated in search results.");
  if (readabilityScore < 50) suggestions.push("Readability is low — use shorter sentences.");

  return {
    readabilityScore,
    keywordDensity,
    metaDescriptionLength: metaLen,
    metaDescriptionOk: metaLen >= 120 && metaLen <= 160,
    wordCount: words,
    readingTimeMinutes: readingTimeMinutes(text),
    suggestions,
  };
}

function estimateSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  return words.reduce((sum, w) => sum + Math.max(1, (w.match(/[aeiouy\u0980-\u09FF]/gi) ?? []).length), 0);
}

export function buildOgPreview(post: {
  title: string;
  metaTitle: string | null;
  metaDescription: string | null;
  excerpt: string | null;
  featuredImageUrl: string | null;
  ogImageUrl: string | null;
  slug: string;
}) {
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || "";
  const image = post.ogImageUrl || post.featuredImageUrl || "";
  return { title, description, image, url: `/blog/${post.slug}` };
}
