"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, ScrollText, X, Loader2, Pencil, Trash2, Leaf, ToggleLeft, ToggleRight,
  Upload, FolderPlus, Layers, Tag,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface MenuCategory {
  id: string; name: string; nameEn?: string; icon?: string; sortOrder: number; isActive: boolean;
  _count?: { items: number };
}

interface MenuItem {
  id: string; name: string; nameEn?: string; category: string;
  price: number; costPrice?: number; imageUrl?: string;
  isAvailable: boolean; isVeg: boolean; prepMinutes: number;
  menuCategoryId?: string | null;
  variants: { name: string; price: number }[] | null;
  addons:   { name: string; price: number }[] | null;
  createdAt: string;
}

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", bg: "var(--c-bg)",
};

const ORANGE = "#EA580C";

const CATEGORIES = [
  { key: "all",     label: "সব"          },
  { key: "starter", label: "স্টার্টার"  },
  { key: "main",    label: "মেইন কোর্স" },
  { key: "drinks",  label: "পানীয়"      },
  { key: "dessert", label: "ডেজার্ট"    },
  { key: "rice",    label: "ভাত/বিরিয়ানি" },
  { key: "bread",   label: "রুটি/নান"   },
  { key: "soup",    label: "স্যুপ"       },
  { key: "snack",   label: "স্ন্যাকস"   },
  { key: "other",   label: "অন্যান্য"   },
];

type VarRow = { name: string; price: string };

const EMPTY_FORM = {
  name: "", nameEn: "", category: "main", price: "",
  costPrice: "", imageUrl: "", isAvailable: true, isVeg: false, prepMinutes: "15",
  menuCategoryId: "",
};

export default function MenuBoard() {
  const [tab, setTab]               = useState<"items" | "categories">("items");
  const [items, setItems]           = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [catFilter, setCatFilter]   = useState("all");
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState<MenuItem | null>(null);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [variants, setVariants]     = useState<VarRow[]>([]);
  const [addons, setAddons]         = useState<VarRow[]>([]);
  const [saving, setSaving]         = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat]           = useState<MenuCategory | null>(null);
  const [catForm, setCatForm]           = useState({ name: "", nameEn: "", icon: "" });
  const [savingCat, setSavingCat]       = useState(false);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ir, cr] = await Promise.all([
        fetch("/api/restaurant/menu-items"),
        fetch("/api/restaurant/menu/categories"),
      ]);
      if (ir.ok) setItems(await ir.json());
      if (cr.ok) setCategories(await cr.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function openAdd() {
    setEditItem(null);
    setForm({ ...EMPTY_FORM });
    setVariants([]);
    setAddons([]);
    setShowModal(true);
  }

  function openEdit(item: MenuItem) {
    setEditItem(item);
    setForm({
      name: item.name, nameEn: item.nameEn ?? "", category: item.category,
      price: String(item.price), costPrice: String(item.costPrice ?? ""),
      imageUrl: item.imageUrl ?? "", isAvailable: item.isAvailable,
      isVeg: item.isVeg, prepMinutes: String(item.prepMinutes),
      menuCategoryId: item.menuCategoryId ?? "",
    });
    setVariants((item.variants ?? []).map(v => ({ name: v.name, price: String(v.price) })));
    setAddons((item.addons ?? []).map(a => ({ name: a.name, price: String(a.price) })));
    setShowModal(true);
  }

  async function saveItem() {
    if (!form.name || !form.price) return;
    setSaving(true);
    const parsedVariants = variants.filter(v => v.name && v.price).map(v => ({ name: v.name, price: parseFloat(v.price) }));
    const parsedAddons   = addons.filter(a => a.name && a.price).map(a => ({ name: a.name, price: parseFloat(a.price) }));
    const body = {
      name: form.name, nameEn: form.nameEn || null, category: form.category,
      price: parseFloat(form.price),
      costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
      imageUrl: form.imageUrl || null,
      isAvailable: form.isAvailable, isVeg: form.isVeg,
      prepMinutes: parseInt(form.prepMinutes) || 15,
      menuCategoryId: form.menuCategoryId || null,
      variants: parsedVariants.length > 0 ? parsedVariants : null,
      addons:   parsedAddons.length   > 0 ? parsedAddons   : null,
    };
    const url = editItem ? `/api/restaurant/menu-items/${editItem.id}` : "/api/restaurant/menu-items";
    const method = editItem ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (r.ok) {
      showToast("success", editItem ? "আপডেট হয়েছে ✓" : "মেনু আইটেম যোগ হয়েছে ✓");
      setShowModal(false);
      loadAll();
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "সংরক্ষণ করা যায়নি");
    }
  }

  async function toggleAvailable(item: MenuItem) {
    const r = await fetch(`/api/restaurant/menu-items/${item.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    if (r.ok) {
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, isAvailable: !it.isAvailable } : it));
    }
  }

  async function batchToggle(makeAvailable: boolean) {
    const targetItems = catFilter === "all" ? items : items.filter(it => it.category === catFilter);
    const toUpdate = targetItems.filter(it => it.isAvailable !== makeAvailable);
    if (!toUpdate.length) return;
    setBatchLoading(true);
    await Promise.all(toUpdate.map(it =>
      fetch(`/api/restaurant/menu-items/${it.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: makeAvailable }),
      })
    ));
    setBatchLoading(false);
    setItems(prev => prev.map(it => {
      if (catFilter !== "all" && it.category !== catFilter) return it;
      return { ...it, isAvailable: makeAvailable };
    }));
    showToast("success", `${toUpdate.length}টি আইটেম ${makeAvailable ? "উপলব্ধ" : "অনুপলব্ধ"} করা হয়েছে ✓`);
  }

  async function handleImageUpload(file: File) {
    if (!file) return;
    if (file.size > 800 * 1024) { showToast("error", "ছবির সাইজ ৮০০KB এর বেশি হওয়া যাবে না"); return; }
    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/restaurant/menu-items/upload-image", { method: "POST", body: fd });
    setUploadingImage(false);
    if (r.ok) {
      const { url } = await r.json();
      setForm(f => ({ ...f, imageUrl: url }));
      showToast("success", "ছবি আপলোড হয়েছে ✓");
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "আপলোড ব্যর্থ হয়েছে");
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("এই আইটেম মুছে ফেলবেন?")) return;
    const r = await fetch(`/api/restaurant/menu-items/${id}`, { method: "DELETE" });
    if (r.ok) {
      const d = await r.json();
      if (d.deactivated) {
        setItems(prev => prev.map(it => it.id === id ? { ...it, isAvailable: false } : it));
        showToast("success", "অর্ডার থাকায় নিষ্ক্রিয় করা হয়েছে");
      } else {
        setItems(prev => prev.filter(it => it.id !== id));
        showToast("success", "মুছে ফেলা হয়েছে");
      }
    } else {
      showToast("error", "মুছে ফেলা যায়নি");
    }
  }

  function openAddCat() {
    setEditCat(null);
    setCatForm({ name: "", nameEn: "", icon: "" });
    setShowCatModal(true);
  }

  function openEditCat(cat: MenuCategory) {
    setEditCat(cat);
    setCatForm({ name: cat.name, nameEn: cat.nameEn ?? "", icon: cat.icon ?? "" });
    setShowCatModal(true);
  }

  async function saveCat() {
    if (!catForm.name) return;
    setSavingCat(true);
    const url = editCat ? `/api/restaurant/menu/categories/${editCat.id}` : "/api/restaurant/menu/categories";
    const method = editCat ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(catForm) });
    setSavingCat(false);
    if (r.ok) {
      showToast("success", editCat ? "ক্যাটাগরি আপডেট হয়েছে ✓" : "ক্যাটাগরি যোগ হয়েছে ✓");
      setShowCatModal(false); loadAll();
    } else {
      const d = await r.json(); showToast("error", d.error ?? "সংরক্ষণ করা যায়নি");
    }
  }

  async function deleteCat(id: string) {
    if (!confirm("এই ক্যাটাগরি মুছে ফেলবেন? আইটেমগুলো আনক্যাটাগরাইজড হবে।")) return;
    const r = await fetch(`/api/restaurant/menu/categories/${id}`, { method: "DELETE" });
    if (r.ok) { showToast("success", "ক্যাটাগরি মুছে ফেলা হয়েছে"); loadAll(); }
    else showToast("error", "মুছে ফেলা যায়নি");
  }

  const addVariantRow = () => setVariants(p => [...p, { name: "", price: "" }]);
  const updateVariant = (i: number, k: keyof VarRow, v: string) => setVariants(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const removeVariant = (i: number) => setVariants(p => p.filter((_, idx) => idx !== i));

  const addAddonRow = () => setAddons(p => [...p, { name: "", price: "" }]);
  const updateAddon = (i: number, k: keyof VarRow, v: string) => setAddons(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const removeAddon = (i: number) => setAddons(p => p.filter((_, idx) => idx !== i));

  const displayItems = catFilter === "all" ? items : items.filter(it => it.category === catFilter);
  const availableInDisplay = displayItems.filter(it => it.isAvailable).length;
  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c.key] = c.key === "all" ? items.length : items.filter(it => it.category === c.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #C2410C 100%)` }}>
            <ScrollText size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>মেনু ব্যবস্থাপনা</h1>
            <p className="text-xs" style={{ color: S.muted }}>
              {items.length}টি আইটেম · {items.filter(i => i.isAvailable).length}টি পাওয়া যাচ্ছে · {categories.length}টি ক্যাটাগরি
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tab === "categories" ? (
            <button onClick={openAddCat}
              className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold"
              style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #C2410C 100%)` }}>
              <FolderPlus size={16} /> নতুন ক্যাটাগরি
            </button>
          ) : (
            <button onClick={openAdd}
              className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold"
              style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #C2410C 100%)` }}>
              <Plus size={16} /> নতুন আইটেম
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
        {([["items", "আইটেম", Layers], ["categories", "ক্যাটাগরি", Tag]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key as "items" | "categories")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: tab === key ? ORANGE : "transparent",
              color: tab === key ? "#fff" : S.secondary,
            }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === "categories" ? (
        /* ── Category Management ── */
        loading ? (
          <div className="flex items-center justify-center py-16" style={{ color: S.muted }}>
            <Loader2 size={24} className="animate-spin mr-2" /> লোড হচ্ছে...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
            <Tag size={40} className="mx-auto mb-3" style={{ color: S.muted }} />
            <p className="text-sm mb-2" style={{ color: S.text }}>এখনো কোনো কাস্টম ক্যাটাগরি নেই</p>
            <button onClick={openAddCat} className="text-sm font-semibold" style={{ color: ORANGE }}>
              + প্রথম ক্যাটাগরি যোগ করুন
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-4 px-4 py-4 rounded-2xl border"
                style={{ borderColor: S.border, backgroundColor: S.surface }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: "#FFF7ED" }}>
                  {cat.icon ?? "📂"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{cat.name}</p>
                  {cat.nameEn && <p className="text-xs" style={{ color: S.muted }}>{cat.nameEn}</p>}
                  <p className="text-xs mt-0.5" style={{ color: S.muted }}>{cat._count?.items ?? 0}টি আইটেম</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEditCat(cat)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <Pencil size={14} style={{ color: S.muted }} />
                  </button>
                  <button onClick={() => deleteCat(cat.id)} className="p-2 rounded-xl hover:bg-red-50 transition-colors">
                    <Trash2 size={14} style={{ color: "#EF4444" }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Items Tab ── */
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setCatFilter(cat.key)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium border flex-shrink-0 transition-colors"
                style={{
                  backgroundColor: catFilter === cat.key ? ORANGE : S.surface,
                  color: catFilter === cat.key ? "#fff" : S.secondary,
                  borderColor: catFilter === cat.key ? ORANGE : S.border,
                }}>
                {cat.label}
                {catCounts[cat.key] > 0 && (
                  <span className="text-[10px] px-1 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: catFilter === cat.key ? "rgba(255,255,255,0.25)" : "var(--c-bg)",
                      color: catFilter === cat.key ? "#fff" : S.muted,
                    }}>
                    {catCounts[cat.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {displayItems.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <span className="text-xs font-semibold flex-1" style={{ color: S.muted }}>
                আজকের মেনু — {availableInDisplay}/{displayItems.length} পাওয়া যাচ্ছে
              </span>
              <div className="flex gap-2">
                <button onClick={() => batchToggle(true)} disabled={batchLoading || availableInDisplay === displayItems.length}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-opacity"
                  style={{ backgroundColor: "#059669" }}>
                  {batchLoading ? <Loader2 size={11} className="animate-spin" /> : <ToggleRight size={14} />}
                  সব চালু
                </button>
                <button onClick={() => batchToggle(false)} disabled={batchLoading || availableInDisplay === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 border transition-opacity"
                  style={{ borderColor: S.border, color: S.secondary }}>
                  {batchLoading ? <Loader2 size={11} className="animate-spin" /> : <ToggleLeft size={14} />}
                  সব বন্ধ
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ color: S.muted }}>
              <Loader2 size={24} className="animate-spin mr-2" /> লোড হচ্ছে...
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <ScrollText size={40} className="mx-auto mb-3" style={{ color: S.muted }} />
              <p className="text-sm mb-2" style={{ color: S.text }}>
                {catFilter === "all" ? "এখনো কোনো মেনু আইটেম নেই" : "এই ক্যাটাগরিতে কোনো আইটেম নেই"}
              </p>
              {catFilter === "all" && (
                <button onClick={openAdd} className="text-sm font-semibold" style={{ color: ORANGE }}>
                  + প্রথম আইটেম যোগ করুন
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              {displayItems.map((item, idx) => (
                <div key={item.id}
                  className="flex items-center gap-4 px-4 py-4"
                  style={{
                    borderBottom: idx < displayItems.length - 1 ? `1px solid ${S.border}` : "none",
                    opacity: item.isAvailable ? 1 : 0.6,
                  }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl" style={{ backgroundColor: "#FFF7ED" }}>
                      🍽️
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: S.text }}>{item.name}</p>
                      {item.isVeg && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#DCFCE7", color: "#166534" }}>
                          <Leaf size={9} /> নিরামিষ
                        </span>
                      )}
                      {item.variants && item.variants.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#FFF7ED", color: ORANGE }}>
                          {item.variants.length}টি ভ্যারিয়েন্ট
                        </span>
                      )}
                      {item.addons && item.addons.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}>
                          {item.addons.length}টি অ্যাডঅন
                        </span>
                      )}
                      {!item.isAvailable && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ backgroundColor: "#FFF7ED", color: ORANGE }}>
                          অনুপলব্ধ
                        </span>
                      )}
                    </div>
                    {item.nameEn && <p className="text-xs" style={{ color: S.muted }}>{item.nameEn}</p>}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-sm font-bold font-mono" style={{ color: ORANGE }}>{formatBDT(item.price)}</span>
                      {item.costPrice && (
                        <span className="text-xs" style={{ color: S.muted }}>খরচ: {formatBDT(item.costPrice)}</span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: S.bg, color: S.muted }}>
                        {CATEGORIES.find(c => c.key === item.category)?.label ?? item.category}
                      </span>
                      <span className="text-xs" style={{ color: S.muted }}>{item.prepMinutes}মিনিট</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleAvailable(item)}
                      className="relative w-10 h-6 rounded-full transition-colors flex-shrink-0"
                      style={{ backgroundColor: item.isAvailable ? "#0F6E56" : "#D1D5DB" }}
                      title={item.isAvailable ? "অনুপলব্ধ করুন" : "উপলব্ধ করুন"}>
                      <div className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm"
                        style={{ left: item.isAvailable ? "calc(100% - 20px)" : "4px" }} />
                    </button>
                    <button onClick={() => openEdit(item)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                      <Pencil size={14} style={{ color: S.muted }} />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="p-2 rounded-xl hover:bg-red-50 transition-colors">
                      <Trash2 size={14} style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Item Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-t-3xl md:rounded-2xl flex flex-col"
            style={{ backgroundColor: S.surface, maxHeight: "92vh" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: S.border }}>
              <h3 className="font-bold text-base" style={{ color: S.text }}>
                {editItem ? "আইটেম সম্পাদনা" : "নতুন মেনু আইটেম"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} style={{ color: S.muted }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>নাম (বাংলা) *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="যেমন: মুরগির কারি"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>নাম (ইংরেজি)</label>
                  <input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))}
                    placeholder="e.g. Chicken Curry"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>দাম (৳) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>খরচের দাম (৳)</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>ক্যাটাগরি</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }}>
                    {CATEGORIES.filter(c => c.key !== "all").map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>কাস্টম ক্যাটাগরি</label>
                  <select value={form.menuCategoryId} onChange={e => setForm(f => ({ ...f, menuCategoryId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }}>
                    <option value="">— নির্বাচন করুন —</option>
                    {categories.filter(c => c.isActive).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>তৈরির সময় (মিনিট)</label>
                  <input type="number" value={form.prepMinutes} onChange={e => setForm(f => ({ ...f, prepMinutes: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>ছবি (ঐচ্ছিক)</label>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                  <div className="flex gap-2 items-start">
                    {form.imageUrl ? (
                      <div className="relative flex-shrink-0">
                        <img src={form.imageUrl} alt="প্রিভিউ" className="w-16 h-16 rounded-xl object-cover border" style={{ borderColor: S.border }} />
                        <button onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                          style={{ backgroundColor: "#EF4444" }}>×</button>
                      </div>
                    ) : null}
                    <div className="flex-1 space-y-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
                        style={{ borderColor: S.border, color: S.muted }}>
                        {uploadingImage ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                        {uploadingImage ? "আপলোড হচ্ছে..." : "ছবি আপলোড করুন"}
                      </button>
                      <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                        style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isVeg} onChange={e => setForm(f => ({ ...f, isVeg: e.target.checked }))}
                    className="w-4 h-4 accent-green-600" />
                  <span className="text-sm" style={{ color: S.text }}>ভেজ আইটেম</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))}
                    className="w-4 h-4 accent-green-600" />
                  <span className="text-sm" style={{ color: S.text }}>এখন পাওয়া যাচ্ছে</span>
                </label>
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: S.text }}>ভ্যারিয়েন্ট (যেমন: Small/Large)</p>
                  <button onClick={addVariantRow} className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{ backgroundColor: "#FFF7ED", color: ORANGE }}>
                    <Plus size={11} /> যোগ করুন
                  </button>
                </div>
                {variants.length === 0 ? (
                  <p className="text-[11px] italic" style={{ color: S.muted }}>কোনো ভ্যারিয়েন্ট নেই — বেস দাম ব্যবহার হবে</p>
                ) : (
                  <div className="space-y-2">
                    {variants.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input value={v.name} onChange={e => updateVariant(i, "name", e.target.value)}
                          placeholder="নাম (যেমন: Small)"
                          className="flex-1 px-3 py-2 rounded-xl border text-xs outline-none"
                          style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                        <input type="number" value={v.price} onChange={e => updateVariant(i, "price", e.target.value)}
                          placeholder="দাম"
                          className="w-24 px-3 py-2 rounded-xl border text-xs outline-none"
                          style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                        <button onClick={() => removeVariant(i)} className="p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0">
                          <X size={13} style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Addons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold" style={{ color: S.text }}>অ্যাডঅন / মডিফায়ার</p>
                  <button onClick={addAddonRow} className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}>
                    <Plus size={11} /> যোগ করুন
                  </button>
                </div>
                {addons.length === 0 ? (
                  <p className="text-[11px] italic" style={{ color: S.muted }}>কোনো অ্যাডঅন নেই</p>
                ) : (
                  <div className="space-y-2">
                    {addons.map((a, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input value={a.name} onChange={e => updateAddon(i, "name", e.target.value)}
                          placeholder="নাম (যেমন: Extra Cheese)"
                          className="flex-1 px-3 py-2 rounded-xl border text-xs outline-none"
                          style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                        <input type="number" value={a.price} onChange={e => updateAddon(i, "price", e.target.value)}
                          placeholder="দাম"
                          className="w-24 px-3 py-2 rounded-xl border text-xs outline-none"
                          style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                        <button onClick={() => removeAddon(i)} className="p-1.5 rounded-lg hover:bg-red-50 flex-shrink-0">
                          <X size={13} style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: S.border }}>
              <button onClick={saveItem} disabled={!form.name || !form.price || saving}
                className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                style={{ backgroundColor: ORANGE }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editItem ? "আপডেট করুন" : "যোগ করুন")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Add/Edit Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowCatModal(false)}>
          <div className="w-full max-w-sm rounded-t-3xl md:rounded-2xl flex flex-col"
            style={{ backgroundColor: S.surface, maxHeight: "90vh" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: S.border }}>
              <h3 className="font-bold text-base" style={{ color: S.text }}>
                {editCat ? "ক্যাটাগরি সম্পাদনা" : "নতুন ক্যাটাগরি"}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} style={{ color: S.muted }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>নাম *</label>
                <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="যেমন: স্পেশাল মেনু"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>নাম (ইংরেজি)</label>
                <input value={catForm.nameEn} onChange={e => setCatForm(f => ({ ...f, nameEn: e.target.value }))}
                  placeholder="e.g. Special Menu"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>আইকন (ইমোজি)</label>
                <input value={catForm.icon} onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="🍖"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
            </div>
            <div className="px-5 py-4 border-t flex-shrink-0" style={{ borderColor: S.border }}>
              <button onClick={saveCat} disabled={!catForm.name || savingCat}
                className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                style={{ backgroundColor: ORANGE }}>
                {savingCat ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editCat ? "আপডেট করুন" : "যোগ করুন")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
