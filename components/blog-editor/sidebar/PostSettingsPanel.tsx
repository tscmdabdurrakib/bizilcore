"use client";

import { useState } from "react";
import { useEditorStore } from "@/lib/blog-editor/store/editor-store";
import { useUpdateBlogPost, useBlogCategories } from "@/hooks/blog-editor/useBlogPost";
import { generateExcerpt } from "@/lib/blog-editor/utils/blocks";
import { slugify as slugifyText } from "@/lib/blog-editor/utils/slugify";
import { useEditorUIStore } from "@/lib/blog-editor/store/ui-store";
import toast from "react-hot-toast";

export function PostSettingsPanel({ postId }: { postId: string }) {
  const { postMeta, setPostMeta, blocks, title } = useEditorStore();
  const updatePost = useUpdateBlogPost(postId);
  const { data: categories = [] } = useBlogCategories();
  const [tagInput, setTagInput] = useState("");
  const openMediaLibrary = useEditorUIStore(s => s.openMediaLibrary);

  const meta = postMeta;

  async function saveField(data: Record<string, unknown>) {
    try {
      const updated = await updatePost.mutateAsync(data);
      setPostMeta(updated);
    } catch {
      toast.error("Failed to save settings");
    }
  }

  return (
    <div className="p-4 space-y-5 text-sm">
      <Field label="Status">
        <select
          value={meta.status ?? "draft"}
          onChange={e => saveField({ status: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border"
          style={{ borderColor: "var(--c-border)", background: "var(--c-bg)" }}
        >
          {["draft", "published", "scheduled", "private"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <Field label="Visibility">
        <select
          value={meta.visibility ?? "public"}
          onChange={e => saveField({ visibility: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border"
          style={{ borderColor: "var(--c-border)", background: "var(--c-bg)" }}
        >
          {["public", "private", "password"].map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </Field>

      {meta.visibility === "password" && (
        <Field label="Password">
          <input
            type="password"
            value={meta.password ?? ""}
            onChange={e => setPostMeta({ password: e.target.value })}
            onBlur={() => saveField({ password: meta.password })}
            className="w-full px-3 py-2 rounded-lg border"
            style={{ borderColor: "var(--c-border)" }}
          />
        </Field>
      )}

      <Field label="Schedule publish">
        <input
          type="datetime-local"
          value={meta.scheduledAt ? meta.scheduledAt.slice(0, 16) : ""}
          onChange={e => saveField({ scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null, status: "scheduled" })}
          className="w-full px-3 py-2 rounded-lg border"
          style={{ borderColor: "var(--c-border)" }}
        />
      </Field>

      <Field label="Categories">
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {categories.map((c: { id: string; name: string }) => {
            const selected = meta.categories?.some(cat => cat.id === c.id);
            return (
              <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {
                    const ids = selected
                      ? (meta.categories ?? []).filter(cat => cat.id !== c.id).map(cat => cat.id)
                      : [...(meta.categories ?? []).map(cat => cat.id), c.id];
                    saveField({ categoryIds: ids });
                  }}
                />
                <span style={{ color: "var(--c-text-sub)" }}>{c.name}</span>
              </label>
            );
          })}
        </div>
      </Field>

      <Field label="Tags">
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && tagInput.trim()) {
              saveField({ tagNames: [tagInput.trim()] });
              setTagInput("");
            }
          }}
          placeholder="Type and press Enter"
          className="w-full px-3 py-2 rounded-lg border"
          style={{ borderColor: "var(--c-border)" }}
        />
        <div className="flex flex-wrap gap-1 mt-2">
          {meta.tags?.map(t => (
            <span key={t.id} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--nav-active-bg)", color: "var(--c-primary)" }}>
              {t.name}
            </span>
          ))}
        </div>
      </Field>

      <Field label="Featured image">
        {meta.featuredImageUrl ? (
          <img src={meta.featuredImageUrl} alt="" className="w-full rounded-lg mb-2 aspect-video object-cover" />
        ) : null}
        <button
          type="button"
          onClick={() => openMediaLibrary(url => saveField({ featuredImageUrl: url }))}
          className="w-full py-2 rounded-lg border text-xs"
          style={{ borderColor: "var(--c-border)" }}
        >
          {meta.featuredImageUrl ? "Replace image" : "Set featured image"}
        </button>
      </Field>

      <Field label="Excerpt">
        <textarea
          value={meta.excerpt ?? ""}
          onChange={e => setPostMeta({ excerpt: e.target.value })}
          onBlur={() => saveField({ excerpt: meta.excerpt })}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border resize-none"
          style={{ borderColor: "var(--c-border)" }}
        />
        <button
          type="button"
          onClick={() => {
            const ex = generateExcerpt(blocks);
            setPostMeta({ excerpt: ex });
            saveField({ excerpt: ex });
          }}
          className="mt-1 text-xs underline"
          style={{ color: "var(--c-primary)" }}
        >
          Generate from content
        </button>
      </Field>

      <Field label="Slug">
        <input
          type="text"
          value={meta.slug ?? ""}
          onChange={e => setPostMeta({ slug: e.target.value })}
          onBlur={() => saveField({ slug: slugifyText(meta.slug ?? title) })}
          className="w-full px-3 py-2 rounded-lg border font-mono text-xs"
          style={{ borderColor: "var(--c-border)" }}
        />
        <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>/blog/{meta.slug}</p>
      </Field>

      <Field label="Template">
        <select
          value={meta.template ?? "default"}
          onChange={e => saveField({ template: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border"
          style={{ borderColor: "var(--c-border)" }}
        >
          {["default", "full-width", "sidebar", "hero"].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
