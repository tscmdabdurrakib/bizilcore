"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gift, Save, Loader2, Search, User } from "lucide-react";

const S = {
  primary: "#0F6E56", surface: "#FFFFFF", border: "#E8E6DF",
  text: "#1A1A18", textMuted: "#A8A69E", bg: "#F7F6F2",
};

interface UserResult {
  id: string;
  name: string;
  email: string;
}

export default function SmsGiftsPage() {
  const [loading, setLoading] = useState(true);
  const [savingBonus, setSavingBonus] = useState(false);
  const [gifting, setGifting] = useState(false);
  const [bonusForm, setBonusForm] = useState({
    signupBonusEnabled: false,
    signupBonusMasking: 0,
    signupBonusNonMasking: 5,
  });
  const [maskingEnabled, setMaskingEnabled] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkGifting, setBulkGifting] = useState(false);
  const [giftForm, setGiftForm] = useState({
    creditsAmount: "",
    smsType: "non_masking" as "masking" | "non_masking",
    reason: "",
  });
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/sms/settings")
      .then((r) => r.json())
      .then((d) => {
        setMaskingEnabled(d.maskingEnabled ?? false);
        setBonusForm({
          signupBonusEnabled: d.signupBonusEnabled ?? false,
          signupBonusMasking: d.signupBonusMasking ?? 0,
          signupBonusNonMasking: d.signupBonusNonMasking ?? 5,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (search.trim().length < 2) {
      setUsers([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/admin/users?search=${encodeURIComponent(search.trim())}`)
        .then((r) => r.json())
        .then((list) => setUsers(Array.isArray(list) ? list.slice(0, 8) : []))
        .catch(() => setUsers([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function saveSignupBonus() {
    setSavingBonus(true);
    const r = await fetch("/api/admin/sms/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bonusForm),
    });
    setSavingBonus(false);
    setToast({
      type: r.ok ? "success" : "error",
      msg: r.ok ? "Signup bonus সেটিংস সংরক্ষিত" : "সংরক্ষণ ব্যর্থ",
    });
    setTimeout(() => setToast(null), 3000);
  }

  async function sendGift() {
    if (!selectedUser) {
      setToast({ type: "error", msg: "ইউজার নির্বাচন করুন" });
      return;
    }
    const amount = parseInt(giftForm.creditsAmount, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      setToast({ type: "error", msg: "সঠিক credit পরিমাণ দিন" });
      return;
    }
    if (!giftForm.reason.trim()) {
      setToast({ type: "error", msg: "কারণ লিখুন" });
      return;
    }

    setGifting(true);
    const r = await fetch("/api/admin/sms/credits/gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUser.id,
        creditsAmount: amount,
        smsType: giftForm.smsType,
        reason: giftForm.reason.trim(),
      }),
    });
    const data = await r.json();
    setGifting(false);

    if (r.ok) {
      setToast({
        type: "success",
        msg: `${selectedUser.name}-কে ${amount}টি ${giftForm.smsType === "masking" ? "Masking" : "Non-Masking"} credit দেওয়া হয়েছে`,
      });
      setGiftForm({ creditsAmount: "", smsType: giftForm.smsType, reason: "" });
      setSelectedUser(null);
      setSearch("");
    } else {
      setToast({ type: "error", msg: data.error ?? "Gift ব্যর্থ" });
    }
    setTimeout(() => setToast(null), 4000);
  }

  async function sendBulkGift() {
    const amount = parseInt(giftForm.creditsAmount, 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      setToast({ type: "error", msg: "সঠিক credit পরিমাণ দিন" });
      return;
    }
    if (!giftForm.reason.trim()) {
      setToast({ type: "error", msg: "কারণ লিখুন" });
      return;
    }

    let userIds = selectedUsers.map((u) => u.id);
    if (bulkEmails.trim()) {
      const emails = bulkEmails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
      for (const email of emails) {
        const r = await fetch(`/api/admin/users?search=${encodeURIComponent(email)}`);
        if (r.ok) {
          const list = await r.json();
          const match = Array.isArray(list) ? list.find((u: UserResult) => u.email === email) : null;
          if (match && !userIds.includes(match.id)) userIds.push(match.id);
        }
      }
    }

    if (userIds.length === 0) {
      setToast({ type: "error", msg: "কমপক্ষে একজন user নির্বাচন করুন" });
      return;
    }

    setBulkGifting(true);
    const r = await fetch("/api/admin/sms/credits/bulk-gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIds,
        creditsAmount: amount,
        smsType: giftForm.smsType,
        reason: giftForm.reason.trim(),
      }),
    });
    const data = await r.json();
    setBulkGifting(false);

    if (r.ok) {
      setToast({
        type: "success",
        msg: `${data.succeeded?.length ?? 0} user-কে credit দেওয়া হয়েছে${data.failed?.length ? `, ${data.failed.length} failed` : ""}`,
      });
      setSelectedUsers([]);
      setBulkEmails("");
    } else {
      setToast({ type: "error", msg: data.error ?? "Bulk gift ব্যর্থ" });
    }
    setTimeout(() => setToast(null), 4000);
  }

  function toggleBulkUser(user: UserResult) {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user]
    );
  }

  if (loading) return <p>লোড হচ্ছে...</p>;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/sms-credits" className="flex items-center gap-1 text-sm mb-4" style={{ color: S.textMuted }}>
        <ArrowLeft size={14} /> SMS Credits
      </Link>
      <h1 className="text-xl font-bold mb-2" style={{ color: S.text }}>Signup Bonus & Gifts</h1>
      <p className="text-sm mb-6" style={{ color: S.textMuted }}>
        Signup bonus নতুন ইউজারের account-এ auto যোগ হবে। Manual gift দিলে সাথে সাথে user dashboard/header balance-এ reflect হবে।
      </p>

      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {toast.msg}
        </div>
      )}

      {/* Signup Bonus */}
      <div className="rounded-2xl border p-6 space-y-4 mb-6" style={{ background: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2">
          <Gift size={18} style={{ color: S.primary }} />
          <h2 className="font-bold" style={{ color: S.text }}>Signup Bonus</h2>
        </div>
        <p className="text-xs" style={{ color: S.textMuted }}>
          নতুন signup-এ প্রতিটি ইউজার একবারই পাবে (duplicate হবে না)।
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm">Signup bonus সক্রিয়</span>
          <input
            type="checkbox"
            checked={bonusForm.signupBonusEnabled}
            onChange={(e) => setBonusForm((f) => ({ ...f, signupBonusEnabled: e.target.checked }))}
          />
        </div>

        <label className="block text-sm">
          Non-Masking SMS bonus (credit)
          <input
            type="number"
            min={0}
            value={bonusForm.signupBonusNonMasking}
            onChange={(e) => setBonusForm((f) => ({ ...f, signupBonusNonMasking: parseInt(e.target.value) || 0 }))}
            className="w-full mt-1 px-3 py-2 rounded-xl border"
            style={{ borderColor: S.border }}
          />
        </label>

        {maskingEnabled && (
        <label className="block text-sm">
          Masking SMS bonus (credit)
          <input
            type="number"
            min={0}
            value={bonusForm.signupBonusMasking}
            onChange={(e) => setBonusForm((f) => ({ ...f, signupBonusMasking: parseInt(e.target.value) || 0 }))}
            className="w-full mt-1 px-3 py-2 rounded-xl border"
            style={{ borderColor: S.border }}
          />
        </label>
        )}

        <button
          type="button"
          onClick={saveSignupBonus}
          disabled={savingBonus}
          className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2"
          style={{ background: S.primary }}
        >
          {savingBonus ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Signup Bonus সেভ করুন
        </button>
      </div>

      {/* Manual Gift */}
      <div className="rounded-2xl border p-6 space-y-4" style={{ background: S.surface, borderColor: S.border }}>
        <h2 className="font-bold" style={{ color: S.text }}>Manual Gift Credit</h2>
        <p className="text-xs" style={{ color: S.textMuted }}>
          Promotion, compensation, বা যেকোনো কারণে ইউজারকে SMS credit gift দিন।
        </p>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-3" style={{ color: S.textMuted }} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedUser(null);
            }}
            placeholder="ইউজার খুঁজুন (নাম বা email)"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm"
            style={{ borderColor: S.border }}
          />
          {users.length > 0 && !selectedUser && (
            <div className="absolute z-10 w-full mt-1 rounded-xl border shadow-lg overflow-hidden" style={{ background: S.surface, borderColor: S.border }}>
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(u);
                    setSearch(u.email);
                    setUsers([]);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"
                >
                  <p className="font-bold" style={{ color: S.text }}>{u.name}</p>
                  <p style={{ color: S.textMuted }}>{u.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: S.bg }}>
            <User size={14} style={{ color: S.primary }} />
            <span className="font-bold">{selectedUser.name}</span>
            <span style={{ color: S.textMuted }}>({selectedUser.email})</span>
          </div>
        )}

        <div className={maskingEnabled ? "flex gap-2" : ""}>
          {maskingEnabled && (
          <button
            type="button"
            onClick={() => setGiftForm((f) => ({ ...f, smsType: "masking" }))}
            className="flex-1 py-2 rounded-xl text-xs font-bold border"
            style={{
              borderColor: giftForm.smsType === "masking" ? S.primary : S.border,
              background: giftForm.smsType === "masking" ? "#E1F5EE" : S.bg,
              color: giftForm.smsType === "masking" ? S.primary : S.textMuted,
            }}
          >
            Masking
          </button>
          )}
          <button
            type="button"
            onClick={() => setGiftForm((f) => ({ ...f, smsType: "non_masking" }))}
            className={`${maskingEnabled ? "flex-1" : "w-full"} py-2 rounded-xl text-xs font-bold border`}
            style={{
              borderColor: giftForm.smsType === "non_masking" ? S.primary : S.border,
              background: giftForm.smsType === "non_masking" ? "#E1F5EE" : S.bg,
              color: giftForm.smsType === "non_masking" ? S.primary : S.textMuted,
            }}
          >
            Non-Masking
          </button>
        </div>

        <input
          type="number"
          min={1}
          value={giftForm.creditsAmount}
          onChange={(e) => setGiftForm((f) => ({ ...f, creditsAmount: e.target.value }))}
          placeholder="Credit পরিমাণ (যেমন 50)"
          className="w-full px-3 py-2 rounded-xl border text-sm"
          style={{ borderColor: S.border }}
        />

        <input
          type="text"
          value={giftForm.reason}
          onChange={(e) => setGiftForm((f) => ({ ...f, reason: e.target.value }))}
          placeholder="কারণ (যেমন: Ramadan promotion, Support compensation)"
          className="w-full px-3 py-2 rounded-xl border text-sm"
          style={{ borderColor: S.border }}
        />

        <button
          type="button"
          onClick={sendGift}
          disabled={gifting || !selectedUser}
          className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: S.primary }}
        >
          {gifting ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
          Gift Credit দিন
        </button>
      </div>

      {/* Bulk Gift */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="font-bold text-gray-900">Bulk Credit Gift</h2>
        <p className="text-xs text-gray-500">একাধিক user-কে একসাথে credit দিন (max 100)</p>

        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedUsers.map((u) => (
              <span key={u.id} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {u.name} ×
              </span>
            ))}
          </div>
        )}

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="User খুঁজুন (multi-select)..."
            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"
          />
          {users.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleBulkUser(u)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${selectedUsers.some((s) => s.id === u.id) ? "bg-emerald-50" : ""}`}
                >
                  <User size={14} className="text-gray-400" />
                  {u.name} — {u.email}
                </button>
              ))}
            </div>
          )}
        </div>

        <textarea
          value={bulkEmails}
          onChange={(e) => setBulkEmails(e.target.value)}
          placeholder="অথবা emails (comma/newline separated)"
          rows={2}
          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />

        <button
          type="button"
          onClick={sendBulkGift}
          disabled={bulkGifting}
          className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white disabled:opacity-50 active:scale-95"
        >
          {bulkGifting ? "Processing..." : `Bulk Gift (${selectedUsers.length} selected)`}
        </button>
      </div>
    </div>
  );
}
