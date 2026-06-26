"use client";

import { useEffect, useState } from "react";
import { Trash2, ShieldOff, Search, Loader2 } from "lucide-react";
import AdminCard from "../components/AdminCard";

interface PostRow {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    accountStatus: string;
    subscription: { plan: string } | null;
  };
  _count: { comments: number; likes: number };
}

export default function AdminCommunityPostsPage() {
  const [items, setItems] = useState<PostRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load(q = search) {
    setLoading(true);
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : "";
      const res = await fetch(`/api/admin/community-posts${params}`);
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  async function deletePost(id: string) {
    if (!confirm("এই post মুছে ফেলবেন?")) return;
    setBusy(id);
    const res = await fetch(`/api/admin/community-posts/${id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) setItems((prev) => prev.filter((p) => p.id !== id));
  }

  async function banUser(userId: string, name: string) {
    if (!confirm(`${name} কে community থেকে ban (suspend) করবেন?`)) return;
    setBusy(userId);
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountStatus: "suspended", statusReason: "Community guidelines violation" }),
    });
    setBusy(null);
    if (res.ok) load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Community Moderation</h2>
        <p className="text-sm text-gray-500">User-generated posts moderate করুন</p>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Post content দিয়ে খুঁজুন..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-emerald-500" />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">লোড হচ্ছে...</p>
      ) : items.length === 0 ? (
        <AdminCard hover={false}>
          <p className="py-12 text-center text-gray-500">কোনো post নেই</p>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <AdminCard key={p.id} hover={false} className="!p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm">{p.user.name}</span>
                    <span className="text-xs text-gray-500">{p.user.email}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                      {p.user.subscription?.plan ?? "free"}
                    </span>
                    {p.user.accountStatus !== "active" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        {p.user.accountStatus}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(p.createdAt).toLocaleString("bn-BD")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{p.content}</p>
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="mt-2 max-h-40 rounded-lg object-cover" />
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {p._count.likes} likes · {p._count.comments} comments
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => deletePost(p.id)} disabled={busy === p.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-700 disabled:opacity-50">
                    {busy === p.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    Delete
                  </button>
                  {p.user.accountStatus === "active" && (
                    <button onClick={() => banUser(p.user.id, p.user.name)} disabled={busy === p.user.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white disabled:opacity-50">
                      <ShieldOff size={12} /> Ban User
                    </button>
                  )}
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
