"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2, FileText } from "lucide-react";
import AdminCard from "../components/AdminCard";
import type { BlogPostDTO } from "@/lib/blog-editor/types";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "var(--c-primary)",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#6B7280",
  published: "#1D9E75",
  scheduled: "#378ADD",
  private: "#EF9F27",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPostDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/admin/blog")
      .then(r => r.json())
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createPost() {
    setCreating(true);
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled" }),
    });
    const post = await res.json();
    setCreating(false);
    if (post.id) window.location.href = `/admin/blog/${post.id}/edit`;
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: S.text }}>Blog</h1>
          <p className="text-sm mt-1" style={{ color: S.muted }}>Manage blog posts and content</p>
        </div>
        <button
          type="button"
          onClick={createPost}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: S.primary }}
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          New Post
        </button>
      </div>

      <AdminCard>
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" style={{ color: S.primary }} /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p style={{ color: S.muted }}>No posts yet. Create your first blog post.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: S.border }}>
                  {["Title", "Status", "Author", "Updated", "Actions"].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-medium" style={{ color: S.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id} className="border-b hover:bg-black/[0.02]" style={{ borderColor: S.border }}>
                    <td className="py-3 px-4">
                      <Link href={`/admin/blog/${post.id}/edit`} className="font-medium hover:underline" style={{ color: S.text }}>
                        {post.title}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: S.muted }}>/blog/{post.slug}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs capitalize"
                        style={{ background: `${STATUS_COLORS[post.status]}20`, color: STATUS_COLORS[post.status] }}
                      >
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 px-4" style={{ color: S.muted }}>{post.author?.name ?? "—"}</td>
                    <td className="py-3 px-4" style={{ color: S.muted }}>{new Date(post.updatedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/blog/${post.id}/edit`} className="p-1.5 rounded-lg hover:bg-black/5" aria-label="Edit">
                          <Pencil className="w-4 h-4" style={{ color: S.muted }} />
                        </Link>
                        <button type="button" onClick={() => deletePost(post.id)} className="p-1.5 rounded-lg hover:bg-red-50" aria-label="Delete">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
