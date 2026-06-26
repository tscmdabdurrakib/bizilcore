"use client";

import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { useUpdateBlogPost } from "@/hooks/blog-editor/useBlogPost";
import { analyzeSEO, buildOgPreview } from "@/lib/blog-editor/seo/analyzer";
import { useState } from "react";
import toast from "react-hot-toast";

export function SEOPanel({ postId }: { postId: string }) {
  const { blocks, postMeta, setPostMeta } = useEditorStore();
  const updatePost = useUpdateBlogPost(postId);
  const [focusKeyword, setFocusKeyword] = useState("");

  const analysis = analyzeSEO(blocks, postMeta.metaDescription ?? null, focusKeyword);
  const og = buildOgPreview({
    title: postMeta.title ?? "",
    metaTitle: postMeta.metaTitle ?? null,
    metaDescription: postMeta.metaDescription ?? null,
    excerpt: postMeta.excerpt ?? null,
    featuredImageUrl: postMeta.featuredImageUrl ?? null,
    ogImageUrl: postMeta.ogImageUrl ?? null,
    slug: postMeta.slug ?? "",
  });

  async function save(data: Record<string, unknown>) {
    try {
      const updated = await updatePost.mutateAsync(data);
      setPostMeta(updated);
    } catch {
      toast.error("Failed to save SEO settings");
    }
  }

  return (
    <div className="p-4 space-y-5 text-sm">
      <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--c-bg)" }}>
        <h4 className="font-medium" style={{ color: "var(--c-text)" }}>SEO Analysis</h4>
        <ScoreBar label="Readability" value={analysis.readabilityScore} />
        <ScoreBar label="Keyword density" value={Math.min(analysis.keywordDensity * 10, 100)} suffix="%" />
        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
          {analysis.wordCount} words · {analysis.readingTimeMinutes} min read
        </p>
        {analysis.suggestions.map((s, i) => (
          <p key={i} className="text-xs" style={{ color: "var(--c-text-sub)" }}>• {s}</p>
        ))}
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>Focus keyword</label>
        <input
          type="text"
          value={focusKeyword}
          onChange={e => setFocusKeyword(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-lg border"
          style={{ borderColor: "var(--c-border)" }}
        />
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>Meta title</label>
        <input
          type="text"
          value={postMeta.metaTitle ?? ""}
          onChange={e => setPostMeta({ metaTitle: e.target.value })}
          onBlur={() => save({ metaTitle: postMeta.metaTitle })}
          className="w-full mt-1 px-3 py-2 rounded-lg border"
          style={{ borderColor: "var(--c-border)" }}
        />
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>
          Meta description ({analysis.metaDescriptionLength}/160)
        </label>
        <textarea
          value={postMeta.metaDescription ?? ""}
          onChange={e => setPostMeta({ metaDescription: e.target.value })}
          onBlur={() => save({ metaDescription: postMeta.metaDescription })}
          rows={3}
          className="w-full mt-1 px-3 py-2 rounded-lg border resize-none"
          style={{ borderColor: "var(--c-border)" }}
        />
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>Canonical URL</label>
        <input
          type="url"
          value={postMeta.canonicalUrl ?? ""}
          onChange={e => setPostMeta({ canonicalUrl: e.target.value })}
          onBlur={() => save({ canonicalUrl: postMeta.canonicalUrl })}
          className="w-full mt-1 px-3 py-2 rounded-lg border"
          style={{ borderColor: "var(--c-border)" }}
        />
      </div>

      <div>
        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>Schema type</label>
        <select
          value={postMeta.schemaType ?? "BlogPosting"}
          onChange={e => save({ schemaType: e.target.value })}
          className="w-full mt-1 px-3 py-2 rounded-lg border"
          style={{ borderColor: "var(--c-border)" }}
        >
          {["Article", "BlogPosting", "NewsArticle"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--c-text-muted)" }}>Social preview</h4>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--c-border)" }}>
          {og.image && <img src={og.image} alt="" className="w-full aspect-[1.91/1] object-cover" />}
          <div className="p-3">
            <p className="text-xs uppercase" style={{ color: "var(--c-text-muted)" }}>bizilcore.com</p>
            <p className="font-medium text-sm mt-0.5 line-clamp-2" style={{ color: "var(--c-text)" }}>{og.title}</p>
            <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--c-text-sub)" }}>{og.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const color = value >= 70 ? "var(--c-primary)" : value >= 40 ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: "var(--c-text-sub)" }}>{label}</span>
        <span style={{ color: "var(--c-text)" }}>{value}{suffix}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--c-border)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
