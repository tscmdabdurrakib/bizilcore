"use client";

import { useEffect, useState } from "react";
import { Star, Check, X, Globe, Trash2 } from "lucide-react";
import AdminCard from "../components/AdminCard";
import AdminPillTabs from "../components/AdminPillTabs";

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  improvementNote: string | null;
  businessType: string | null;
  isApproved: boolean;
  showOnSite: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "সব" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "onsite", label: "Site-এ দেখাচ্ছে" },
];

const BIZ_LABEL: Record<string, string> = {
  fcommerce: "ফেসবুক কমার্স",
  retail: "রিটেইল",
  restaurant: "রেস্টুরেন্ট",
  pharmacy: "ফার্মেসি",
  salon: "সেলুন",
  tailor: "টেইলর",
  hotel: "হোটেল",
};

function Stars({ n }: { n: number }) {
  return (
    <div className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          fill={i <= n ? "#F5B400" : "transparent"}
          stroke={i <= n ? "#F5B400" : "#9CA3AF"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<ReviewRow[]>([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?filter=${filter}`);
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) load();
  }

  async function remove(id: string) {
    if (!confirm("এই রিভিউ ডিলিট করবেন?")) return;
    const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="space-y-5">
      <AdminPillTabs tabs={FILTERS.map((f) => ({ key: f.key, label: f.label }))} active={filter} onChange={setFilter} />

      {loading ? (
        <p className="text-sm text-gray-500">লোড হচ্ছে...</p>
      ) : items.length === 0 ? (
        <AdminCard hover={false}>
          <p className="py-12 text-center text-gray-500">কোনো রিভিউ নেই</p>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <AdminCard key={r.id} hover={false} className="!p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold">{r.user.name}</span>
                    <span className="text-xs text-gray-500">·</span>
                    <Stars n={r.rating} />
                    {r.businessType && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F0F0F0", color: "#555" }}>
                        {BIZ_LABEL[r.businessType] ?? r.businessType}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">{new Date(r.createdAt).toLocaleDateString("bn-BD")}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{r.user.email}</p>
                  {r.title && <p className="font-medium mb-1">{r.title}</p>}
                  {r.body && <p className="text-sm" style={{ color: "#374151" }}>{r.body}</p>}
                  {r.improvementNote && (
                    <div className="mt-2 p-2 rounded-lg text-sm" style={{ background: "#FEF3C7", color: "#854D0E" }}>
                      <strong>উন্নতির পরামর্শ:</strong> {r.improvementNote}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium text-center"
                    style={{
                      background: r.isApproved ? "#ECFDF5" : "#FEF3C7",
                      color: r.isApproved ? "#059669" : "#D97706",
                    }}
                  >
                    {r.isApproved ? "Approved" : "Pending"}
                  </span>
                  {r.showOnSite && (
                    <span className="text-xs px-2 py-1 rounded-full font-medium text-center" style={{ background: "#DBEAFE", color: "#1D4ED8" }}>
                      Site-এ
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: "#F3F4F6" }}>
                {!r.isApproved && (
                  <button
                    onClick={() => patch(r.id, { isApproved: true })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                    style={{ background: "#0F6E56" }}
                  >
                    <Check size={14} /> Approve
                  </button>
                )}
                {r.isApproved && (
                  <button
                    onClick={() => patch(r.id, { showOnSite: !r.showOnSite })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border"
                    style={{
                      background: r.showOnSite ? "#fff" : "#0F6E56",
                      color: r.showOnSite ? "#374151" : "#fff",
                      borderColor: r.showOnSite ? "#E5E7EB" : "#0F6E56",
                    }}
                  >
                    <Globe size={14} /> {r.showOnSite ? "Site থেকে hide" : "Site-এ দেখান"}
                  </button>
                )}
                {r.isApproved && (
                  <button
                    onClick={() => patch(r.id, { isApproved: false, showOnSite: false })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border"
                    style={{ background: "#fff", color: "#374151", borderColor: "#E5E7EB" }}
                  >
                    <X size={14} /> Un-approve
                  </button>
                )}
                <button
                  onClick={() => remove(r.id)}
                  className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border"
                  style={{ background: "#fff", color: "#DC2626", borderColor: "#FCA5A5" }}
                >
                  <Trash2 size={14} /> Reject
                </button>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
