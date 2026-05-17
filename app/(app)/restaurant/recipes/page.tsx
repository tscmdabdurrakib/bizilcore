"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Package, Plus, Trash2, ChevronDown, ChevronUp, Edit2, Check,
  X, Loader2, AlertTriangle, TrendingUp, ShoppingCart
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  costPerUnit: number;
  isLowStock: boolean;
  _count: { recipes: number };
}

interface RecipeItem {
  id: string;
  materialId: string;
  quantity: number;
  material: { id: string; name: string; unit: string };
}

interface MenuItemWithRecipes {
  id: string;
  name: string;
  category: string;
  price: number;
  recipes: RecipeItem[];
}

interface PurchaseEntry {
  id: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  note?: string;
  purchasedAt: string;
  material: { id: string; name: string; unit: string };
}

const UNIT_OPTIONS = ["kg", "g", "L", "ml", "pcs", "dozen", "packet", "bottle", "can", "cup", "tbsp", "tsp"];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#EA580C",
  bg: "var(--c-bg)",
};

type ActiveTab = "materials" | "recipes" | "purchases";

export default function RecipesPage() {
  const [tab, setTab] = useState<ActiveTab>("materials");
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemWithRecipes[]>([]);
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const showToast = (type: "success" | "error", msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<string | null>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<{ materialId: string; quantity: string }[]>([]);

  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: "", unit: "kg", currentStock: "", reorderLevel: "1", costPerUnit: "" });
  const [editingMat, setEditingMat] = useState<string | null>(null);
  const [editMat, setEditMat] = useState({ name: "", unit: "kg", currentStock: "", reorderLevel: "", costPerUnit: "" });

  const [showPurchase, setShowPurchase] = useState(false);
  const [newPurchase, setNewPurchase] = useState({ materialId: "", quantity: "", unitCost: "", note: "", purchasedAt: "" });

  const loadAll = useCallback(async () => {
    try {
      const [mRes, miRes, pRes] = await Promise.all([
        fetch("/api/restaurant/materials"),
        fetch("/api/restaurant/recipes"),
        fetch("/api/restaurant/purchases"),
      ]);
      if (mRes.ok) setMaterials(await mRes.json());
      if (miRes.ok) setMenuItems(await miRes.json());
      if (pRes.ok) setPurchases(await pRes.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addMaterial = async () => {
    if (!newMaterial.name) { showToast("error", "নাম দিন"); return; }
    const res = await fetch("/api/restaurant/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newMaterial.name, unit: newMaterial.unit,
        currentStock: Number(newMaterial.currentStock || 0),
        reorderLevel: Number(newMaterial.reorderLevel || 1),
        costPerUnit: Number(newMaterial.costPerUnit || 0),
      }),
    });
    if (res.ok) { showToast("success", "যোগ হয়েছে"); setNewMaterial({ name: "", unit: "kg", currentStock: "", reorderLevel: "1", costPerUnit: "" }); setShowAddMaterial(false); loadAll(); }
    else showToast("error", "Error");
  };

  const saveMaterial = async (id: string) => {
    const res = await fetch(`/api/restaurant/materials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editMat.name, unit: editMat.unit,
        currentStock: Number(editMat.currentStock),
        reorderLevel: Number(editMat.reorderLevel),
        costPerUnit: Number(editMat.costPerUnit),
      }),
    });
    if (res.ok) { showToast("success", "আপডেট হয়েছে"); setEditingMat(null); loadAll(); }
    else showToast("error", "Error");
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm("এই কাঁচামাল মুছে ফেলবেন?")) return;
    const res = await fetch(`/api/restaurant/materials/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("success", "মুছে ফেলা হয়েছে"); loadAll(); }
    else showToast("error", "Error");
  };

  const startEditRecipe = (item: MenuItemWithRecipes) => {
    setEditingRecipe(item.id);
    setRecipeIngredients(item.recipes.map(r => ({ materialId: r.materialId, quantity: String(r.quantity) })));
  };

  const saveRecipe = async (menuItemId: string) => {
    const res = await fetch("/api/restaurant/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menuItemId,
        ingredients: recipeIngredients.filter(i => i.materialId && Number(i.quantity) > 0).map(i => ({
          materialId: i.materialId,
          quantity: Number(i.quantity),
        })),
      }),
    });
    if (res.ok) { showToast("success", "রেসিপি সেভ হয়েছে"); setEditingRecipe(null); loadAll(); }
    else showToast("error", "Error");
  };

  const addPurchase = async () => {
    if (!newPurchase.materialId || !newPurchase.quantity || !newPurchase.unitCost) {
      showToast("error", "সব ফিল্ড পূরণ করুন"); return;
    }
    const res = await fetch("/api/restaurant/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        materialId: newPurchase.materialId,
        quantity: Number(newPurchase.quantity),
        unitCost: Number(newPurchase.unitCost),
        note: newPurchase.note || null,
        purchasedAt: newPurchase.purchasedAt || null,
      }),
    });
    if (res.ok) {
      showToast("success", "ক্রয় রেকর্ড হয়েছে ও স্টক আপডেট হয়েছে");
      setShowPurchase(false);
      setNewPurchase({ materialId: "", quantity: "", unitCost: "", note: "", purchasedAt: "" });
      loadAll();
    } else showToast("error", "Error");
  };

  const lowStockMaterials = materials.filter(m => m.isLowStock);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 size={28} className="animate-spin" style={{ color: S.primary }} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>রেসিপি ও স্টক ম্যানেজমেন্ট</h1>
          <p className="text-sm mt-0.5" style={{ color: S.muted }}>কাঁচামাল ও রেসিপি পরিচালনা করুন</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPurchase(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#3B82F6" }}>
            <ShoppingCart size={15} />ক্রয় রেকর্ড
          </button>
          <button onClick={() => setShowAddMaterial(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: S.primary }}>
            <Plus size={15} />কাঁচামাল যোগ
          </button>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockMaterials.length > 0 && (
        <div className="rounded-2xl border border-red-200 p-4 flex items-start gap-3" style={{ backgroundColor: "#FEF2F2" }}>
          <AlertTriangle size={18} style={{ color: "#EF4444", marginTop: 1 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#991B1B" }}>স্টক সতর্কতা</p>
            <p className="text-xs mt-0.5" style={{ color: "#B91C1C" }}>
              {lowStockMaterials.map(m => `${m.name} (${m.currentStock} ${m.unit})`).join(", ")} — রি-অর্ডার করুন
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
        {([
          { value: "materials", label: "কাঁচামাল", icon: Package },
          { value: "recipes",   label: "রেসিপি",   icon: TrendingUp },
          { value: "purchases", label: "ক্রয় লগ", icon: ShoppingCart },
        ] as { value: ActiveTab; label: string; icon: React.ElementType }[]).map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              backgroundColor: tab === t.value ? S.primary : "transparent",
              color: tab === t.value ? "#fff" : S.muted,
            }}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Materials Tab */}
      {tab === "materials" && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }}>
                <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>নাম</th>
                <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>ইউনিট</th>
                <th className="text-right px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>বর্তমান স্টক</th>
                <th className="text-right px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>রি-অর্ডার পয়েন্ট</th>
                <th className="text-right px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>প্রতি ইউনিট দাম</th>
                <th className="text-center px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: S.muted }}>কোনো কাঁচামাল নেই</td></tr>
              )}
              {materials.map(m => (
                <tr key={m.id} style={{ borderBottom: `1px solid ${S.border}`, backgroundColor: m.isLowStock ? "#FEF2F2" : "transparent" }}>
                  {editingMat === m.id ? (
                    <>
                      <td className="px-4 py-2.5">
                        <input value={editMat.name} onChange={e => setEditMat(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none"
                          style={{ borderColor: S.border, color: S.text }} />
                      </td>
                      <td className="px-4 py-2.5">
                        <select value={editMat.unit} onChange={e => setEditMat(p => ({ ...p, unit: e.target.value }))}
                          className="px-2 py-1.5 rounded-lg border text-xs outline-none"
                          style={{ borderColor: S.border, color: S.text }}>
                          {UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <input type="number" value={editMat.currentStock} onChange={e => setEditMat(p => ({ ...p, currentStock: e.target.value }))}
                          className="w-24 px-2 py-1.5 rounded-lg border text-xs text-right outline-none"
                          style={{ borderColor: S.border, color: S.text }} />
                      </td>
                      <td className="px-4 py-2.5">
                        <input type="number" value={editMat.reorderLevel} onChange={e => setEditMat(p => ({ ...p, reorderLevel: e.target.value }))}
                          className="w-24 px-2 py-1.5 rounded-lg border text-xs text-right outline-none"
                          style={{ borderColor: S.border, color: S.text }} />
                      </td>
                      <td className="px-4 py-2.5">
                        <input type="number" value={editMat.costPerUnit} onChange={e => setEditMat(p => ({ ...p, costPerUnit: e.target.value }))}
                          className="w-24 px-2 py-1.5 rounded-lg border text-xs text-right outline-none"
                          style={{ borderColor: S.border, color: S.text }} />
                      </td>
                      <td className="px-4 py-2.5 flex items-center justify-center gap-1.5">
                        <button onClick={() => saveMaterial(m.id)} className="p-1.5 rounded-lg bg-green-100"><Check size={13} className="text-green-600" /></button>
                        <button onClick={() => setEditingMat(null)} className="p-1.5 rounded-lg bg-gray-100"><X size={13} style={{ color: S.muted }} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-xs" style={{ color: S.text }}>{m.name}</p>
                        {m._count.recipes > 0 && <p className="text-[10px]" style={{ color: S.muted }}>{m._count.recipes}টি রেসিপিতে</p>}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>{m.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-bold ${m.isLowStock ? "text-red-600" : ""}`} style={m.isLowStock ? {} : { color: S.text }}>
                          {m.currentStock} {m.unit}
                        </span>
                        {m.isLowStock && <AlertTriangle size={12} className="inline ml-1 text-red-500" />}
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: S.muted }}>{m.reorderLevel} {m.unit}</td>
                      <td className="px-4 py-3 text-right text-xs font-medium" style={{ color: S.text }}>{formatBDT(m.costPerUnit)}/{m.unit}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => { setEditingMat(m.id); setEditMat({ name: m.name, unit: m.unit, currentStock: String(m.currentStock), reorderLevel: String(m.reorderLevel), costPerUnit: String(m.costPerUnit) }); }}
                            className="p-1.5 rounded-lg" style={{ backgroundColor: "#FFF7ED" }}>
                            <Edit2 size={13} style={{ color: S.primary }} />
                          </button>
                          <button onClick={() => deleteMaterial(m.id)}
                            className="p-1.5 rounded-lg bg-red-50">
                            <Trash2 size={13} className="text-red-500" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recipes Tab */}
      {tab === "recipes" && (
        <div className="space-y-2">
          {menuItems.map(item => (
            <div key={item.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <button
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                className="w-full flex items-center justify-between p-4 transition-all hover:bg-opacity-80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: S.primary }}>
                    {item.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold" style={{ color: S.text }}>{item.name}</p>
                    <p className="text-xs" style={{ color: S.muted }}>
                      {item.recipes.length > 0 ? `${item.recipes.length}টি উপাদান` : "রেসিপি যোগ করুন"} · {formatBDT(item.price)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.recipes.length > 0 && (
                    <span className="text-[10px] px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
                      রেসিপি আছে
                    </span>
                  )}
                  {expandedItem === item.id ? <ChevronUp size={16} style={{ color: S.muted }} /> : <ChevronDown size={16} style={{ color: S.muted }} />}
                </div>
              </button>

              {expandedItem === item.id && (
                <div className="border-t p-4" style={{ borderColor: S.border }}>
                  {editingRecipe === item.id ? (
                    <div className="space-y-3">
                      {recipeIngredients.map((ing, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <select value={ing.materialId}
                            onChange={e => setRecipeIngredients(prev => prev.map((r, i) => i === idx ? { ...r, materialId: e.target.value } : r))}
                            className="flex-1 px-3 py-2 rounded-xl border text-xs outline-none"
                            style={{ borderColor: S.border, color: S.text }}>
                            <option value="">— কাঁচামাল বেছে নিন —</option>
                            {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                          </select>
                          <input type="number" step="0.01" value={ing.quantity}
                            onChange={e => setRecipeIngredients(prev => prev.map((r, i) => i === idx ? { ...r, quantity: e.target.value } : r))}
                            placeholder="পরিমাণ"
                            className="w-24 px-3 py-2 rounded-xl border text-xs text-right outline-none"
                            style={{ borderColor: S.border, color: S.text }} />
                          <button onClick={() => setRecipeIngredients(prev => prev.filter((_, i) => i !== idx))}
                            className="p-2 rounded-lg bg-red-50"><X size={13} className="text-red-500" /></button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <button onClick={() => setRecipeIngredients(prev => [...prev, { materialId: "", quantity: "" }])}
                          className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl border"
                          style={{ borderColor: S.border, color: S.muted }}>
                          <Plus size={12} />উপাদান যোগ
                        </button>
                        <button onClick={() => saveRecipe(item.id)}
                          className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl text-white font-semibold"
                          style={{ backgroundColor: S.primary }}>
                          <Check size={12} />সেভ করুন
                        </button>
                        <button onClick={() => setEditingRecipe(null)}
                          className="text-xs px-3 py-2 rounded-xl border" style={{ borderColor: S.border, color: S.muted }}>
                          বাতিল
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {item.recipes.length === 0 ? (
                        <p className="text-xs mb-3" style={{ color: S.muted }}>এই মেনু আইটেমের কোনো রেসিপি নেই।</p>
                      ) : (
                        <div className="space-y-1.5 mb-3">
                          {item.recipes.map(r => (
                            <div key={r.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-xl"
                              style={{ backgroundColor: "#FFF7ED" }}>
                              <span style={{ color: S.text }}>{r.material.name}</span>
                              <span className="font-semibold" style={{ color: S.primary }}>{r.quantity} {r.material.unit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={() => startEditRecipe(item)}
                        className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl"
                        style={{ backgroundColor: "#FFF7ED", color: S.primary }}>
                        <Edit2 size={12} />রেসিপি {item.recipes.length > 0 ? "সম্পাদনা" : "যোগ"} করুন
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Purchases Tab */}
      {tab === "purchases" && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }}>
                <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>কাঁচামাল</th>
                <th className="text-right px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>পরিমাণ</th>
                <th className="text-right px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>প্রতি ইউনিট</th>
                <th className="text-right px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>মোট খরচ</th>
                <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>তারিখ</th>
                <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: S.muted }}>নোট</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: S.muted }}>কোনো ক্রয় রেকর্ড নেই</td></tr>
              )}
              {purchases.map(p => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${S.border}` }}>
                  <td className="px-4 py-3 text-xs font-semibold" style={{ color: S.text }}>{p.material.name}</td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: S.text }}>{p.quantity} {p.material.unit}</td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: S.muted }}>{formatBDT(p.unitCost)}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold" style={{ color: S.primary }}>{formatBDT(p.totalCost)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>{new Date(p.purchasedAt).toLocaleDateString("bn-BD")}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: S.muted }}>{p.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Material Modal */}
      {showAddMaterial && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowAddMaterial(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: S.surface }}>
            <h3 className="font-bold text-base mb-4" style={{ color: S.text }}>নতুন কাঁচামাল যোগ করুন</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>নাম *</label>
                <input value={newMaterial.name} onChange={e => setNewMaterial(p => ({ ...p, name: e.target.value }))}
                  placeholder="যেমন: চাল, আটা, তেল..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>ইউনিট</label>
                  <select value={newMaterial.unit} onChange={e => setNewMaterial(p => ({ ...p, unit: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}>
                    {UNIT_OPTIONS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>প্রতি ইউনিট দাম (৳)</label>
                  <input type="number" value={newMaterial.costPerUnit} onChange={e => setNewMaterial(p => ({ ...p, costPerUnit: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>বর্তমান স্টক</label>
                  <input type="number" value={newMaterial.currentStock} onChange={e => setNewMaterial(p => ({ ...p, currentStock: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>রি-অর্ডার পয়েন্ট</label>
                  <input type="number" value={newMaterial.reorderLevel} onChange={e => setNewMaterial(p => ({ ...p, reorderLevel: e.target.value }))}
                    placeholder="1"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={addMaterial}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: S.primary }}>যোগ করুন</button>
              <button onClick={() => setShowAddMaterial(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Purchase Modal */}
      {showPurchase && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && setShowPurchase(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: S.surface }}>
            <h3 className="font-bold text-base mb-4" style={{ color: S.text }}>নতুন ক্রয় রেকর্ড</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>কাঁচামাল *</label>
                <select value={newPurchase.materialId} onChange={e => setNewPurchase(p => ({ ...p, materialId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}>
                  <option value="">— বেছে নিন —</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>পরিমাণ *</label>
                  <input type="number" step="0.01" value={newPurchase.quantity} onChange={e => setNewPurchase(p => ({ ...p, quantity: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>প্রতি ইউনিট দাম (৳) *</label>
                  <input type="number" step="0.01" value={newPurchase.unitCost} onChange={e => setNewPurchase(p => ({ ...p, unitCost: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
              </div>
              {newPurchase.quantity && newPurchase.unitCost && (
                <p className="text-xs font-semibold" style={{ color: S.primary }}>
                  মোট: {formatBDT(Number(newPurchase.quantity) * Number(newPurchase.unitCost))}
                </p>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>তারিখ</label>
                <DatePicker
  value={newPurchase.purchasedAt}
  onChange={v => setNewPurchase(p => ({ ...p, purchasedAt: v }))}
  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }}
/>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>নোট</label>
                <input value={newPurchase.note} onChange={e => setNewPurchase(p => ({ ...p, note: e.target.value }))}
                  placeholder="ঐচ্ছিক"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={addPurchase}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#3B82F6" }}>রেকর্ড করুন</button>
              <button onClick={() => setShowPurchase(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
