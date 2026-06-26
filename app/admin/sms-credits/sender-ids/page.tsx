"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, X, Loader2 } from "lucide-react";

const S = { primary: "#0F6E56", surface: "#FFFFFF", border: "#E8E6DF", text: "#1A1A18", textMuted: "#A8A69E" };

interface Request {
  id: string;
  userId: string;
  senderId: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export default function SmsSenderIdsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/sms/sender-ids");
    const d = await r.json();
    setRequests(d.requests ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAction(userId: string, action: "approve" | "reject") {
    setActing(userId);
    await fetch(`/api/admin/sms/sender-ids/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: notes[userId] || undefined }),
    });
    setActing(null);
    load();
  }

  const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#FEF3C7", color: "#92400E" },
    approved: { bg: "#DCFCE7", color: "#166534" },
    rejected: { bg: "#FEE2E2", color: "#991B1B" },
  };

  return (
    <div>
      <Link href="/admin/sms-credits" className="flex items-center gap-1 text-sm mb-4" style={{ color: S.textMuted }}>
        <ArrowLeft size={14} /> SMS Credits
      </Link>
      <h1 className="text-xl font-bold mb-4" style={{ color: S.text }}>Sender ID Approval</h1>
      <p className="text-sm mb-6" style={{ color: S.textMuted }}>
        Masking SMS-এর জন্য ইউজারদের Sender ID (ব্র্যান্ড নাম) approve করুন। sms.net.bd-তে register করার পর approve দিন।
      </p>

      {loading ? <p>লোড হচ্ছে...</p> : (
        <div className="rounded-2xl border overflow-x-auto" style={{ background: S.surface, borderColor: S.border }}>
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr style={{ background: "#F7F6F2", color: S.textMuted }}>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Sender ID</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">তারিখ</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: S.textMuted }}>কোনো request নেই</td></tr>
              ) : requests.map((req) => {
                const st = STATUS_STYLE[req.status] ?? STATUS_STYLE.pending;
                return (
                  <tr key={req.id} style={{ borderTop: `1px solid ${S.border}` }}>
                    <td className="px-4 py-3">
                      <p className="font-bold">{req.user.name}</p>
                      <p style={{ color: S.textMuted }}>{req.user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">{req.senderId}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: st.bg, color: st.color }}>
                        {req.status}
                      </span>
                      {req.adminNote && <p className="mt-1" style={{ color: S.textMuted }}>{req.adminNote}</p>}
                    </td>
                    <td className="px-4 py-3">{new Date(req.createdAt).toLocaleDateString("bn-BD")}</td>
                    <td className="px-4 py-3">
                      {req.status === "pending" && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Admin note (optional)"
                            value={notes[req.userId] ?? ""}
                            onChange={(e) => setNotes((n) => ({ ...n, [req.userId]: e.target.value }))}
                            className="w-full px-2 py-1 rounded border text-xs"
                            style={{ borderColor: S.border }}
                          />
                          <div className="flex gap-1">
                            <button disabled={acting === req.userId} onClick={() => handleAction(req.userId, "approve")}
                              className="p-1.5 rounded flex items-center gap-1 text-xs font-bold" style={{ background: "#DCFCE7", color: "#166534" }}>
                              {acting === req.userId ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                              Approve
                            </button>
                            <button disabled={acting === req.userId} onClick={() => handleAction(req.userId, "reject")}
                              className="p-1.5 rounded flex items-center gap-1 text-xs font-bold" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                              <X size={12} /> Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
