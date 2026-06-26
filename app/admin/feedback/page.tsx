"use client";

import { useEffect, useState } from "react";
import { Bug, Lightbulb, Heart, MessageCircle, ExternalLink, Check, Eye } from "lucide-react";
import AdminCard from "../components/AdminCard";
import AdminPillTabs from "../components/AdminPillTabs";

interface FeedbackRow {
  id: string;
  type: string;
  message: string;
  pageUrl: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    shop: { id: string; name: string } | null;
  };
}

const TYPE_ICON: Record<string, typeof Bug> = {
  bug: Bug,
  suggestion: Lightbulb,
  compliment: Heart,
  other: MessageCircle,
};

const TYPE_LABEL: Record<string, string> = {
  bug: "Bug",
  suggestion: "Suggestion",
  compliment: "Compliment",
  other: "Other",
};

const STATUS_TABS = [
  { key: "all", label: "সব" },
  { key: "new", label: "নতুন" },
  { key: "seen", label: "দেখা হয়েছে" },
  { key: "resolved", label: "সমাধান" },
];

export default function AdminFeedbackPage() {
  const [filter, setFilter] = useState("new");
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/feedback?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setCounts(data.counts ?? {});
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">User Feedback Inbox</h2>
        <p className="text-sm text-gray-500">ব্যবহারকারীদের feedback ও bug report</p>
      </div>

      <AdminPillTabs
        tabs={STATUS_TABS.map((t) => ({
          key: t.key,
          label: t.key === "new" && counts.new ? `${t.label} (${counts.new})` : t.label,
        }))}
        active={filter}
        onChange={setFilter}
      />

      {loading ? (
        <p className="text-sm text-gray-500">লোড হচ্ছে...</p>
      ) : items.length === 0 ? (
        <AdminCard hover={false}>
          <p className="py-12 text-center text-gray-500">কোনো feedback নেই</p>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {items.map((f) => {
            const Icon = TYPE_ICON[f.type] ?? MessageCircle;
            return (
              <AdminCard key={f.id} hover={false} className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        <Icon size={12} /> {TYPE_LABEL[f.type] ?? f.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        f.status === "new" ? "bg-blue-100 text-blue-700"
                          : f.status === "seen" ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {f.status}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(f.createdAt).toLocaleString("bn-BD")}
                      </span>
                    </div>
                    <p className="font-semibold text-sm">{f.user.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{f.user.email}</p>
                    {f.user.shop && (
                      <p className="text-xs text-gray-500 mb-2">Shop: {f.user.shop.name}</p>
                    )}
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{f.message}</p>
                    {f.pageUrl && (
                      <a href={f.pageUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 mt-2 hover:underline">
                        <ExternalLink size={12} /> {f.pageUrl}
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {f.status !== "seen" && (
                      <button onClick={() => setStatus(f.id, "seen")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-amber-200 bg-amber-50 text-amber-700">
                        <Eye size={12} /> Seen
                      </button>
                    )}
                    {f.status !== "resolved" && (
                      <button onClick={() => setStatus(f.id, "resolved")}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white">
                        <Check size={12} /> Resolved
                      </button>
                    )}
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
