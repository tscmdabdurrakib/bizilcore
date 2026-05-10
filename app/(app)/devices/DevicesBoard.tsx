"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Smartphone, Search, Plus, Loader2, X, RefreshCw,
} from "lucide-react";

const PRIMARY = "#3B82F6";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

const DEVICE_TYPES = [
  { value: "smartphone",     label: "Smartphone",      icon: "📱" },
  { value: "laptop",         label: "Laptop",           icon: "💻" },
  { value: "tablet",         label: "Tablet",           icon: "📱" },
  { value: "tv",             label: "TV",               icon: "📺" },
  { value: "ac",             label: "AC",               icon: "❄️" },
  { value: "fridge",         label: "Fridge",           icon: "🧊" },
  { value: "washing_machine",label: "Washing Machine",  icon: "🫧" },
  { value: "microwave",      label: "Microwave",        icon: "📦" },
  { value: "router",         label: "Router",           icon: "📡" },
  { value: "other",          label: "Other",            icon: "🔧" },
];

const CONDITIONS = ["Excellent", "Good", "Fair", "Damaged", "Cracked Screen"];

type Device = {
  id: string;
  type: string;
  brand: string;
  model: string;
  imei?: string | null;
  serialNumber?: string | null;
  color?: string | null;
  customer: { id: string; name: string; phone?: string | null };
  jobCards: { id: string; status: string; totalAmount: number; advancePaid: number; dueAmount: number }[];
  createdAt: string;
};

const getDeviceIcon = (type: string) => DEVICE_TYPES.find(d => d.value === type)?.icon || "🔧";
const getDeviceLabel = (type: string) => DEVICE_TYPES.find(d => d.value === type)?.label || type;

export default function DevicesBoard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    deviceType: "smartphone",
    brand: "",
    model: "",
    imei: "",
    serialNumber: "",
    color: "",
    storageGB: "",
    condition: "Good",
    customerName: "",
    customerPhone: "",
    notes: "",
  });

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/devices?";
      if (search) url += `search=${encodeURIComponent(search)}&`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) setDevices(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const handleSubmit = async () => {
    if (!form.brand || !form.model || !form.customerName || !form.customerPhone) {
      setError("ব্র্যান্ড, মডেল, মালিকের নাম ও ফোন আবশ্যক");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.deviceType,
          brand: form.brand,
          model: form.model,
          imei: form.imei || null,
          serialNumber: form.serialNumber || null,
          color: form.color || null,
          storageGB: form.storageGB || null,
          condition: form.condition,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "সমস্যা হয়েছে"); return; }
      setShowModal(false);
      setForm({ deviceType: "smartphone", brand: "", model: "", imei: "", serialNumber: "", color: "", storageGB: "", condition: "Good", customerName: "", customerPhone: "", notes: "" });
      fetchDevices();
    } catch { setError("সমস্যা হয়েছে"); }
    finally { setSaving(false); }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone size={20} style={{ color: PRIMARY }} />
          <h1 className="text-lg font-bold" style={{ color: S.text }}>ডিভাইস তালিকা</h1>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#EFF6FF", color: PRIMARY }}>
            {devices.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchDevices} className="p-2 rounded-lg border" style={{ borderColor: S.border }}>
            <RefreshCw size={14} style={{ color: S.muted }} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium"
            style={{ background: PRIMARY }}
          >
            <Plus size={14} />
            নতুন ডিভাইস
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2 border" style={{ borderColor: S.border, background: S.surface }}>
        <Search size={14} style={{ color: S.muted }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="IMEI, সিরিয়াল, কাস্টমার ফোন বা নাম খুঁজুন..."
          className="flex-1 text-sm bg-transparent outline-none"
          style={{ color: S.text }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" style={{ color: PRIMARY }} size={28} />
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Smartphone size={40} className="mx-auto mb-2 opacity-30" />
          <p>কোনো ডিভাইস নেই</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {devices.map(device => {
            const jobCount = device.jobCards.length;
            const totalSpent = device.jobCards.reduce((s, j) => s + j.totalAmount, 0);
            const maskedImei = device.imei ? `••••${device.imei.slice(-6)}` : null;
            return (
              <div
                key={device.id}
                className="rounded-2xl p-4 space-y-3"
                style={{ background: S.surface, border: `1px solid ${S.border}` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getDeviceIcon(device.type)}</span>
                    <div>
                      <p className="font-bold text-sm" style={{ color: S.text }}>
                        {device.brand} {device.model}
                      </p>
                      <p className="text-xs" style={{ color: S.muted }}>{getDeviceLabel(device.type)}</p>
                    </div>
                  </div>
                </div>

                {maskedImei && (
                  <p className="text-xs font-mono" style={{ color: S.muted }}>IMEI: {maskedImei}</p>
                )}
                {device.serialNumber && (
                  <p className="text-xs font-mono" style={{ color: S.muted }}>S/N: {device.serialNumber.slice(0, 12)}</p>
                )}

                <div className="border-t pt-2" style={{ borderColor: S.border }}>
                  <p className="text-sm font-medium" style={{ color: S.text }}>{device.customer.name}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{device.customer.phone}</p>
                </div>

                <div className="flex items-center justify-between text-xs" style={{ color: S.muted }}>
                  <span>{jobCount} বার মেরামত হয়েছে</span>
                  {totalSpent > 0 && (
                    <span className="font-medium" style={{ color: "#0F6E56" }}>
                      মোট ৳{totalSpent.toLocaleString("bn-BD")}
                    </span>
                  )}
                </div>

                <Link
                  href={`/jobcards?new=1&deviceId=${device.id}`}
                  className="block w-full text-center py-2 rounded-lg text-xs font-medium"
                  style={{ background: "#EFF6FF", color: PRIMARY }}
                >
                  নতুন Job Card
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* New Device Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl" style={{ background: S.surface }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>নতুন ডিভাইস যোগ করুন</h2>
              <button onClick={() => setShowModal(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-4 space-y-3">
              {error && <div className="text-sm p-3 rounded-lg bg-red-50 text-red-600">{error}</div>}

              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ডিভাইসের ধরন *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {DEVICE_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setForm(f => ({ ...f, deviceType: t.value }))}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition"
                      style={{
                        borderColor: form.deviceType === t.value ? PRIMARY : S.border,
                        background: form.deviceType === t.value ? "#EFF6FF" : S.surface,
                        color: form.deviceType === t.value ? PRIMARY : S.muted,
                      }}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-[10px] leading-tight text-center">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ব্র্যান্ড *</label>
                  <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="Samsung, Apple..." className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>মডেল *</label>
                  <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="Galaxy A54..." className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                </div>
              </div>

              {["smartphone", "tablet", "laptop"].includes(form.deviceType) && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>IMEI</label>
                    <input value={form.imei} onChange={e => setForm(f => ({ ...f, imei: e.target.value }))} placeholder="15-digit IMEI" className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>Storage</label>
                    <input value={form.storageGB} onChange={e => setForm(f => ({ ...f, storageGB: e.target.value }))} placeholder="128GB, 256GB..." className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>রং</label>
                  <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="Black, White..." className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>অবস্থা</label>
                  <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-1 border-t" style={{ borderColor: S.border }}>
                <p className="text-xs font-medium mb-2" style={{ color: S.muted }}>মালিকের তথ্য</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>নাম *</label>
                    <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="গ্রাহকের নাম" className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: S.muted }}>ফোন *</label>
                    <input value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="01XXXXXXXXX" className="w-full border rounded-lg px-3 py-2 text-sm outline-none" style={{ borderColor: S.border, color: S.text, background: S.surface }} />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: PRIMARY }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                ডিভাইস যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
