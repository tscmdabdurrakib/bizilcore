"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

interface InviteInfo {
  shopName: string;
  shopCategory: string | null;
  role: string;
  email: string;
  hasPassword: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  manager: "ম্যানেজার",
  staff: "স্টাফ",
};

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ name: "", password: "", confirmPassword: "" });

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setInfo(d);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    if (!info?.hasPassword && form.password !== form.confirmPassword) {
      setError("পাসওয়ার্ড মিলছে না।");
      return;
    }
    setSubmitting(true);
    const r = await fetch(`/api/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, password: form.password }),
    });
    const d = await r.json();
    setSubmitting(false);
    if (r.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setError(d.error ?? "কিছু একটা সমস্যা হয়েছে।");
    }
  }

  const S = { primary: "#0F6E56", bg: "#F7F6F2", surface: "#FFFFFF", border: "#E8E6DF", text: "#1A1A18", muted: "#A8A69E" };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: S.bg }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: S.primary }}>
            হ
          </div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>BizilCore</h1>
        </div>

        <div className="rounded-2xl border p-6" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin" style={{ color: S.primary }} />
            </div>
          ) : done ? (
            <div className="text-center py-6">
              <CheckCircle2 size={48} className="mx-auto mb-3" style={{ color: S.primary }} />
              <h2 className="font-bold text-lg mb-1" style={{ color: S.text }}>সফলভাবে যোগ দিয়েছেন!</h2>
              <p className="text-sm" style={{ color: S.muted }}>Login পেজে নিয়ে যাওয়া হচ্ছে...</p>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <p className="text-2xl mb-3">😕</p>
              <h2 className="font-bold text-lg mb-2" style={{ color: S.text }}>Invite পাওয়া যায়নি</h2>
              <p className="text-sm" style={{ color: S.muted }}>{error}</p>
            </div>
          ) : info ? (
            <>
              <div className="text-center mb-5">
                <p className="text-sm mb-1" style={{ color: S.muted }}>আপনাকে invite করা হয়েছে</p>
                <h2 className="font-bold text-xl" style={{ color: S.text }}>{info.shopName}</h2>
                <span className="inline-block mt-2 text-sm font-medium px-3 py-1 rounded-full" style={{ backgroundColor: "#E1F5EE", color: S.primary }}>
                  {ROLE_LABEL[info.role] ?? info.role} হিসেবে
                </span>
              </div>

              <form onSubmit={handleAccept} className="space-y-3">
                {!info.hasPassword && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>আপনার নাম</label>
                      <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="আপনার পূর্ণ নাম" required
                        className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: S.border, color: S.text }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>পাসওয়ার্ড তৈরি করুন</label>
                      <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••" required minLength={6}
                        className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: S.border, color: S.text }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>পাসওয়ার্ড নিশ্চিত করুন</label>
                      <input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                        placeholder="••••••••" required
                        className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: S.border, color: S.text }} />
                    </div>
                  </>
                )}
                <p className="text-xs" style={{ color: S.muted }}>Email: <strong>{info.email}</strong></p>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <button type="submit" disabled={submitting}
                  className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-60 mt-2"
                  style={{ backgroundColor: S.primary }}>
                  {submitting ? "যোগ হচ্ছে..." : "Invite গ্রহণ করুন"}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
