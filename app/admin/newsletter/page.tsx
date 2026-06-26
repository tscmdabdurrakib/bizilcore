"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Send, Mail } from "lucide-react";
import AdminCard from "../components/AdminCard";
import AdminPillTabs from "../components/AdminPillTabs";
import AdminTable, { AdminTableRow, AdminTableCell } from "../components/AdminTable";
import { NewsletterSub } from "../components/constants";

interface Campaign {
  id: string;
  subject: string;
  recipientCount: number;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

export default function AdminNewsletterPage() {
  const [tab, setTab] = useState("subscribers");
  const [newsletter, setNewsletter] = useState<{ subscribers: NewsletterSub[]; total: number; active: number } | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  async function loadSubscribers() {
    setLoading(true);
    const r = await fetch("/api/admin/newsletter?status=all");
    if (r.ok) setNewsletter(await r.json());
    setLoading(false);
  }

  async function loadCampaigns() {
    const r = await fetch("/api/admin/newsletter/campaigns");
    if (r.ok) {
      const d = await r.json();
      setCampaigns(d.campaigns ?? []);
    }
  }

  useEffect(() => {
    if (tab === "subscribers") loadSubscribers();
    else loadCampaigns();
  }, [tab]);

  async function handleBroadcast() {
    if (!subject.trim() || !htmlBody.trim()) return;
    setSending(true);
    setSendResult(null);
    const r = await fetch("/api/admin/newsletter/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, htmlBody }),
    });
    const d = await r.json();
    setSending(false);
    if (r.ok) {
      setSendResult(`✓ ${d.sent} subscribers-কে পাঠানো হয়েছে`);
      setSubject("");
      setHtmlBody("");
      loadCampaigns();
    } else {
      setSendResult(`✗ ${d.error ?? "Failed"}`);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPillTabs
        tabs={[
          { key: "subscribers", label: "Subscribers" },
          { key: "broadcast", label: "Broadcast" },
          { key: "campaigns", label: "Campaign History" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "subscribers" && (
        <AdminCard
          title="Newsletter Subscribers"
          subtitle={newsletter ? `মোট: ${newsletter.total} · সক্রিয়: ${newsletter.active}` : undefined}
          action={
            <button onClick={loadSubscribers} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
              <RefreshCw size={14} />
            </button>
          }
          hover={false}
        >
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">লোড হচ্ছে...</p>
          ) : !newsletter || newsletter.subscribers.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">এখনো কোনো subscriber নেই।</p>
          ) : (
            <AdminTable headers={["ইমেইল", "তারিখ", "Status"]}>
              {newsletter.subscribers.map((sub) => (
                <AdminTableRow key={sub.id}>
                  <AdminTableCell className="font-medium text-gray-900">{sub.email}</AdminTableCell>
                  <AdminTableCell className="text-xs text-gray-500">
                    {new Date(sub.subscribedAt).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" })}
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sub.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {sub.status === "active" ? "সক্রিয়" : "Unsubscribed"}
                    </span>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
          )}
        </AdminCard>
      )}

      {tab === "broadcast" && (
        <AdminCard title="Newsletter Broadcast" subtitle="সক্রিয় subscribers-দের ইমেইল পাঠান" hover={false}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                placeholder="Newsletter subject"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">HTML Body</label>
              <textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                rows={8}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                placeholder="<h1>Hello!</h1><p>Your message here...</p>"
              />
            </div>
            <button
              onClick={handleBroadcast}
              disabled={sending || !subject.trim() || !htmlBody.trim()}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
            >
              <Send size={14} />
              {sending ? "পাঠানো হচ্ছে..." : "Broadcast পাঠান"}
            </button>
            {sendResult && <p className={`text-sm ${sendResult.startsWith("✓") ? "text-emerald-600" : "text-red-500"}`}>{sendResult}</p>}
          </div>
        </AdminCard>
      )}

      {tab === "campaigns" && (
        <AdminCard title="Campaign History" hover={false}>
          {campaigns.length === 0 ? (
            <div className="py-10 text-center">
              <Mail size={28} className="mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">কোনো campaign নেই</p>
            </div>
          ) : (
            <AdminTable headers={["Subject", "Recipients", "Status", "Sent At"]}>
              {campaigns.map((c) => (
                <AdminTableRow key={c.id}>
                  <AdminTableCell className="font-medium">{c.subject}</AdminTableCell>
                  <AdminTableCell>{c.recipientCount}</AdminTableCell>
                  <AdminTableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.status === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {c.status}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell className="text-xs text-gray-500">
                    {c.sentAt ? new Date(c.sentAt).toLocaleString("bn-BD") : "—"}
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTable>
          )}
        </AdminCard>
      )}
    </div>
  );
}
