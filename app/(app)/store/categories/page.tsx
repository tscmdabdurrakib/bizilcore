"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Package, Save, X, ChevronUp, ChevronDown } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  position: number;
  _count: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
    secondary: "var(--c-text-sub)",
    primary: "var(--c-primary)",
  };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function fetchCategories() {
    try {
      const r = await fetch("/api/categories");
      if (r.ok) {
        const data = await r.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("error", "ক্যাটাগরির নাম আবশ্যক");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/categories/${editingId}` : "/api/categories";
      const method = editingId ? "PATCH" : "POST";
      
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
        }),
      });

      const data = await r.json();
      if (r.ok) {
        showToast("success", editingId ? "ক্যাটাগরি আপডেট হয়েছে ✓" : "নতুন ক্যাটাগরি তৈরি হয়েছে ✓");
        setShowModal(false);
        setForm({ name: "", description: "" });
        setEditingId(null);
        await fetchCategories();
      } else {
        showToast("error", data.error || "সমস্যা হয়েছে");
      }
    } catch (error) {
      showToast("error", "সংযোগ সমস্যা");
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(category: Category) {
    setForm({ name: category.name, description: category.description || "" });
    setEditingId(category.id);
    setShowModal(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    
    setDeleting(true);
    try {
      const r = await fetch(`/api/categories/${deleteId}`, { method: "DELETE" });
      const data = await r.json();
      
      if (r.ok) {
        showToast("success", "ক্যাটাগরি মুছে ফেলা হয়েছে ✓");
        await fetchCategories();
      } else {
        showToast("error", data.error || "মুছে ফেলা যায়নি");
      }
    } catch (error) {
      showToast("error", "সংযোগ সমস্যা");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  async function moveCategory(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const updated = [...categories];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    // Optimistic update
    setCategories(updated);

    // Update positions on server
    try {
      await Promise.all([
        fetch(`/api/categories/${updated[index].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: index }),
        }),
        fetch(`/api/categories/${updated[newIndex].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: newIndex }),
        }),
      ]);
    } catch (error) {
      // Revert on error
      fetchCategories();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: S.primary }} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {toast && (
        <div 
          className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
            <Package size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>ক্যাটাগরি ব্যবস্থাপনা</h1>
            <p className="text-xs" style={{ color: S.muted }}>
              {categories.length}টি ক্যাটাগরি · পণ্যগুলো সাজানো থাকবে এই ক্যাটাগরিতে
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setForm({ name: "", description: "" });
            setEditingId(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: S.primary }}
        >
          <Plus size={16} /> নতুন ক্যাটাগরি
        </button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: S.border }}>
          <Package size={40} className="mx-auto mb-3 opacity-30" style={{ color: S.muted }} />
          <p className="text-sm font-medium" style={{ color: S.text }}>কোনো ক্যাটাগরি নেই</p>
          <p className="text-xs mt-1" style={{ color: S.muted }}>নতুন ক্যাটাগরি তৈরি করে পণ্য সাজান</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "var(--c-surface-raised)", borderBottom: `1px solid ${S.border}` }}>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>ক্রম</th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>নাম</th>
                <th className="text-left px-4 py-3 text-xs font-semibold hidden sm:table-cell" style={{ color: S.muted }}>বিবরণ</th>
                <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>পণ্য</th>
                <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: S.muted }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <tr 
                  key={category.id} 
                  className="border-b last:border-0"
                  style={{ 
                    borderColor: S.border, 
                    backgroundColor: index % 2 === 1 ? "var(--c-surface-raised)" : S.surface,
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveCategory(index, "up")}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                        style={{ color: S.secondary }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <span className="text-sm font-medium" style={{ color: S.text }}>{index + 1}</span>
                      <button
                        onClick={() => moveCategory(index, "down")}
                        disabled={index === categories.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                        style={{ color: S.secondary }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: S.text }}>{category.name}</span>
                      {category.isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${S.primary}20`, color: S.primary }}>
                          ডিফল্ট
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm" style={{ color: S.muted }}>{category.description || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium" style={{ color: S.primary }}>{category._count.products}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ color: S.secondary }}
                        title="এডিট করুন"
                      >
                        <Pencil size={14} />
                      </button>
                      {!category.isDefault && (
                        <button
                          onClick={() => setDeleteId(category.id)}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                          style={{ color: "#E24B4A" }}
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg" style={{ color: S.text }}>
                {editingId ? "ক্যাটাগরি এডিট করুন" : "নতুন ক্যাটাগরি তৈরি করুন"}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} style={{ color: S.muted }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>
                  ক্যাটাগরির নাম *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="যেমন: পোশাক, জুয়েলারি, খাবার..."
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ 
                    backgroundColor: S.surface, 
                    borderColor: S.border, 
                    color: S.text,
                    height: "40px",
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>
                  বিবরণ (ঐচ্ছিক)
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="এই ক্যাটাগরি সম্পর্কে বিস্তারিত..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ 
                    backgroundColor: S.surface, 
                    borderColor: S.border, 
                    color: S.text,
                    lineHeight: "1.5",
                  }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                  style={{ borderColor: S.border, color: S.text }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                  style={{ backgroundColor: S.primary }}
                >
                  {saving ? "সেভ হচ্ছে..." : (editingId ? "আপডেট" : "তৈরি করুন")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
                <Trash2 size={20} style={{ color: "#E24B4A" }} />
              </div>
              <h3 className="font-semibold text-base" style={{ color: S.text }}>ক্যাটাগরি মুছে ফেলুন</h3>
            </div>
            
            <p className="text-sm mb-5" style={{ color: S.muted }}>
              আপনি কি নিশ্চিত এই ক্যাটাগরিটি মুছে ফেলতে চান? এই ক্যাটাগরির সব পণ্য ডিফল্ট ক্যাটাগরিতে স্থানান্তরিত হবে।
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium disabled:opacity-60"
                style={{ borderColor: S.border, color: S.text }}
              >
                না
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: "#E24B4A" }}
              >
                {deleting ? "মুছে ফেলা হচ্ছে..." : "হ্যাঁ, মুছুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
