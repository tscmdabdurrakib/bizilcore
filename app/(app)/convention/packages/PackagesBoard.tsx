"use client";

import { useEffect, useState, useCallback } from "react";
import {
  GalleryHorizontalEnd, Plus, X, Loader2, Pencil, Trash2, CheckCircle2, Circle,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface PackageItem {
  item: string;
  value: string;
}

interface EventPackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  includes: PackageItem[];
  isActive: boolean;
}

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

const PACKAGE_COLORS = ["#7C3AED", "#0F6E56", "#EF9F27", "#EF4444", "#3B82F6"];
const PACKAGE_BG = ["#F5F3FF", "#E1F5EE", "#FFF3DC", "#FEE2E2", "#EFF6FF"];

const SAMPLE_PACKAGES = [
  { name: "Basic Package", price: 50000, description: "হল ভাড়া ও মৌলিক সুবিধা", includes: [{ item: "Hall Rental", value: "Full Day" }, { item: "Chairs", value: "200টি" }, { item: "Tables", value: "20টি" }, { item: "Basic Lighting", value: "included" }] },
  { name: "Silver Package", price: 80000, description: "হল + ক্যাটারিং + সাউন্ড", includes: [{ item: "Hall Rental", value: "Full Day" }, { item: "Catering", value: "200 pax" }, { item: "Basic Decoration", value: "included" }, { item: "Sound System", value: "included" }] },
  { name: "Gold Package", price: 120000, description: "সম্পূর্ণ ইভেন্ট ব্যবস্থাপনা", includes: [{ item: "Hall Rental", value: "Full Day" }, { item: "Catering", value: "300 pax" }, { item: "Full Decoration", value: "included" }, { item: "Stage", value: "included" }, { item: "Sound System", value: "included" }, { item: "Photography", value: "included" }] },
  { name: "Royal Package", price: 200000, description: "সর্বোচ্চ প্যাকেজ - সব কিছু অন্তর্ভুক্ত", includes: [{ item: "Hall Rental", value: "Full Day" }, { item: "Catering", value: "300 pax" }, { item: "Full Decoration", value: "included" }, { item: "DJ Music", value: "included" }, { item: "Wedding Car", value: "included" }, { item: "Cake", value: "included" }, { item: "Professional Photography", value: "included" }] },
];

const emptyForm = () => ({
  name: "", price: "", description: "",
  includes: [{ item: "", value: "" }] as PackageItem[],
});

export default function PackagesBoard() {
  const [packages, setPackages] = useState<EventPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const fetchPackages = useCallback(async () => {
    const res = await fetch("/api/convention/packages");
    if (res.ok) setPackages(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const handleAddInclude = () => {
    setForm((f) => ({ ...f, includes: [...f.includes, { item: "", value: "" }] }));
  };

  const handleRemoveInclude = (idx: number) => {
    setForm((f) => ({ ...f, includes: f.includes.filter((_, i) => i !== idx) }));
  };

  const handleIncludeChange = (idx: number, field: "item" | "value", val: string) => {
    setForm((f) => ({
      ...f,
      includes: f.includes.map((x, i) => i === idx ? { ...x, [field]: val } : x),
    }));
  };

  const openEdit = (pkg: EventPackage) => {
    setForm({
      name: pkg.name,
      price: String(pkg.price),
      description: pkg.description ?? "",
      includes: pkg.includes.length ? pkg.includes : [{ item: "", value: "" }],
    });
    setEditId(pkg.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const url = editId ? `/api/convention/packages/${editId}` : "/api/convention/packages";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          includes: form.includes.filter((x) => x.item),
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(emptyForm());
        setEditId(null);
        fetchPackages();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই প্যাকেজটি মুছে দিতে চান?")) return;
    await fetch(`/api/convention/packages/${id}`, { method: "DELETE" });
    fetchPackages();
  };

  const handleToggleActive = async (pkg: EventPackage) => {
    await fetch(`/api/convention/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !pkg.isActive }),
    });
    fetchPackages();
  };

  const handleSeedSamples = async () => {
    setSeeding(true);
    for (const pkg of SAMPLE_PACKAGES) {
      await fetch("/api/convention/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pkg),
      });
    }
    fetchPackages();
    setSeeding(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>প্যাকেজ ম্যানেজমেন্ট</h1>
          <p className="text-xs" style={{ color: S.muted }}>{packages.length}টি প্যাকেজ</p>
        </div>
        <div className="flex gap-2">
          {packages.length === 0 && (
            <button
              onClick={handleSeedSamples}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border"
              style={{ borderColor: S.border, color: S.muted }}
            >
              {seeding ? <Loader2 size={13} className="animate-spin" /> : null}
              Sample লোড করুন
            </button>
          )}
          <button
            onClick={() => { setForm(emptyForm()); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#7C3AED" }}
          >
            <Plus size={15} /> নতুন প্যাকেজ
          </button>
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <GalleryHorizontalEnd size={40} className="mx-auto mb-3 opacity-30" style={{ color: S.muted }} />
          <p className="text-sm font-medium" style={{ color: S.muted }}>কোনো প্যাকেজ তৈরি করা হয়নি</p>
          <div className="flex gap-2 justify-center mt-4">
            <button
              onClick={handleSeedSamples}
              disabled={seeding}
              className="px-4 py-2 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "#7C3AED", color: "#7C3AED" }}
            >
              Sample প্যাকেজ যোগ করুন
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#7C3AED" }}
            >
              নতুন তৈরি করুন
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {packages.map((pkg, idx) => {
            const color = PACKAGE_COLORS[idx % PACKAGE_COLORS.length];
            const bg = PACKAGE_BG[idx % PACKAGE_BG.length];
            return (
              <div
                key={pkg.id}
                className="rounded-2xl p-4 border"
                style={{ backgroundColor: S.surface, borderColor: S.border, opacity: pkg.isActive ? 1 : 0.6 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: S.text }}>{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-[11px] mt-0.5" style={{ color: S.muted }}>{pkg.description}</p>
                    )}
                    <p className="text-xl font-bold mt-1" style={{ color }}>{formatBDT(pkg.price)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleActive(pkg)}
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: S.border }}
                    >
                      {pkg.isActive
                        ? <CheckCircle2 size={14} style={{ color: "#0F6E56" }} />
                        : <Circle size={14} style={{ color: S.muted }} />}
                    </button>
                    <button onClick={() => openEdit(pkg)} className="p-1.5 rounded-lg" style={{ backgroundColor: S.border }}>
                      <Pencil size={14} style={{ color: S.muted }} />
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} className="p-1.5 rounded-lg" style={{ backgroundColor: "#FEE2E2" }}>
                      <Trash2 size={14} style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {pkg.includes.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ backgroundColor: bg }}>
                      <p className="text-[11px] font-medium" style={{ color }}>{item.item}</p>
                      <p className="text-[11px]" style={{ color }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base" style={{ color: S.text }}>
                {editId ? "প্যাকেজ সম্পাদনা" : "নতুন প্যাকেজ তৈরি করুন"}
              </h2>
              <button onClick={() => { setShowForm(false); setEditId(null); }}>
                <X size={20} style={{ color: S.muted }} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>প্যাকেজের নাম *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="যেমন: Gold Package"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>মূল্য (৳) *</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="120000"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>বিবরণ</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="প্যাকেজের সংক্ষিপ্ত বিবরণ"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: S.text }}>অন্তর্ভুক্ত সেবাসমূহ</label>
                <div className="space-y-2">
                  {form.includes.map((inc, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        value={inc.item}
                        onChange={(e) => handleIncludeChange(idx, "item", e.target.value)}
                        placeholder="সেবার নাম"
                        className="flex-1 px-2.5 py-2 rounded-xl border text-xs"
                        style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                      />
                      <input
                        value={inc.value}
                        onChange={(e) => handleIncludeChange(idx, "value", e.target.value)}
                        placeholder="পরিমাণ / বিস্তারিত"
                        className="flex-1 px-2.5 py-2 rounded-xl border text-xs"
                        style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                      />
                      {form.includes.length > 1 && (
                        <button onClick={() => handleRemoveInclude(idx)} className="p-2 rounded-xl" style={{ backgroundColor: "#FEE2E2" }}>
                          <X size={12} style={{ color: "#EF4444" }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddInclude}
                  className="mt-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}
                >
                  <Plus size={12} /> আরো সেবা যোগ করুন
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving || !form.name || !form.price}
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#7C3AED" }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
