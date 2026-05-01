"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import {
  FlaskConical, Users, Clock, CheckCircle, TrendingUp,
  RefreshCw, Loader2, Plus, AlertCircle, MapPin, Home,
} from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
}

interface QueueItem {
  id: string;
  orderNumber: string;
  urgency: string;
  status: string;
  createdAt: string;
  sampleCollected: boolean;
  patient: { name: string; phone: string };
  items: { test: { name: string; shortCode: string } }[];
}

interface HomeCollection {
  id: string;
  orderNumber: string;
  homeAddress: string | null;
  homeTime: string | null;
  collectorName: string | null;
  patient: { name: string; phone: string };
}

interface DashStats {
  todayPatients: number;
  samplePending: number;
  resultsReady: number;
  todayRevenue: number;
  todayQueue: QueueItem[];
  homeCollections: HomeCollection[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  registered:       { label: "নিবন্ধিত",     color: "#0C447C", bg: "#E6F1FB" },
  sample_collected: { label: "Sample নেওয়া", color: "#B45309", bg: "#FEF3C7" },
  processing:       { label: "Processing",   color: "#7C3AED", bg: "#EDE9FE" },
  ready:            { label: "রিপোর্ট Ready", color: "#166534", bg: "#DCFCE7" },
  delivered:        { label: "ডেলিভারি হয়েছে", color: "#6B7280", bg: "#F3F4F6" },
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "var(--c-primary)",
  bg: "var(--c-bg)",
};

export default function DashboardLab({ shopName, userName }: Props) {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lab/dashboard");
      if (res.ok) setStats(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function collectSample(orderId: string) {
    await fetch(`/api/lab/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "collect_sample" }),
    });
    load();
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Loader2 size={28} style={{ color: S.primary, animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const statCards = [
    { label: "আজকের রোগী", value: stats?.todayPatients ?? 0, icon: Users, color: "#0891B2", bg: "#ECFEFF" },
    { label: "Sample বাকি", value: stats?.samplePending ?? 0, icon: Clock, color: "#D97706", bg: "#FFFBEB" },
    { label: "Result Ready", value: stats?.resultsReady ?? 0, icon: CheckCircle, color: "#16A34A", bg: "#DCFCE7" },
    { label: "আজকের আয়", value: formatBDT(stats?.todayRevenue ?? 0), icon: TrendingUp, color: "#7C3AED", bg: "#EDE9FE", isAmount: true },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: S.text, margin: 0 }}>
            স্বাগতম, {userName}! 👋
          </h1>
          <p style={{ color: S.muted, fontSize: "14px", margin: "4px 0 0" }}>{shopName} — ল্যাব ড্যাশবোর্ড</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", border: `1px solid ${S.border}`, borderRadius: "8px", background: S.surface, color: S.text, cursor: "pointer", fontSize: "13px" }}>
            <RefreshCw size={14} /> রিফ্রেশ
          </button>
          <Link href="/lab/testorders" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", background: S.primary, color: "#fff", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
            <Plus size={14} /> নতুন রোগী
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {statCards.map((card) => (
          <div key={card.label} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "12px", padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: card.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <card.icon size={22} style={{ color: card.color }} />
            </div>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: S.text }}>{card.isAmount ? card.value : card.value}</div>
              <div style={{ fontSize: "12px", color: S.muted }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
        {/* Today's Queue */}
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FlaskConical size={18} style={{ color: "#0891B2" }} />
              <span style={{ fontWeight: 600, color: S.text }}>আজকের Queue</span>
            </div>
            <Link href="/lab/testorders" style={{ fontSize: "13px", color: S.primary, textDecoration: "none" }}>সব দেখুন →</Link>
          </div>
          {!stats?.todayQueue?.length ? (
            <div style={{ padding: "40px", textAlign: "center", color: S.muted }}>
              <FlaskConical size={32} style={{ marginBottom: "8px", opacity: 0.3 }} />
              <p style={{ margin: 0 }}>আজ কোনো রোগী নেই</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ background: S.bg }}>
                    {["অর্ডার নং", "রোগীর নাম", "পরীক্ষা", "Status", "সময়", "অগ্রাধিকার", "Action"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: S.muted, fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.todayQueue.map((order, i) => {
                    const st = STATUS_MAP[order.status] ?? { label: order.status, color: "#6B7280", bg: "#F3F4F6" };
                    return (
                      <tr key={order.id} style={{ borderTop: i > 0 ? `1px solid ${S.border}` : undefined }}>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0891B2" }}>{order.orderNumber}</td>
                        <td style={{ padding: "12px 16px", color: S.text }}>
                          <div>{order.patient.name}</div>
                          <div style={{ fontSize: "12px", color: S.muted }}>{order.patient.phone}</div>
                        </td>
                        <td style={{ padding: "12px 16px", color: S.muted, maxWidth: "200px" }}>
                          {order.items.map(i => i.test.shortCode).join(", ")}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, color: st.color, background: st.bg }}>{st.label}</span>
                        </td>
                        <td style={{ padding: "12px 16px", color: S.muted, fontSize: "13px", whiteSpace: "nowrap" }}>
                          {new Date(order.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {order.urgency === "urgent"
                            ? <span style={{ color: "#EF4444", fontWeight: 600, fontSize: "13px" }}>🔴 Urgent</span>
                            : <span style={{ color: S.muted, fontSize: "13px" }}>⚪ Normal</span>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {!order.sampleCollected && (
                              <button onClick={() => collectSample(order.id)} style={{ padding: "5px 10px", borderRadius: "6px", border: `1px solid #0891B2`, background: "#ECFEFF", color: "#0891B2", cursor: "pointer", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>
                                Sample নিন
                              </button>
                            )}
                            {order.sampleCollected && order.status !== "ready" && order.status !== "delivered" && (
                              <Link href={`/lab/results?order=${order.id}`} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #16A34A", background: "#DCFCE7", color: "#16A34A", fontSize: "12px", fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}>
                                Result দিন
                              </Link>
                            )}
                            {order.status === "ready" && (
                              <Link href={`/lab/results/${order.orderNumber}`} target="_blank" style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #7C3AED", background: "#EDE9FE", color: "#7C3AED", fontSize: "12px", fontWeight: 500, textDecoration: "none", whiteSpace: "nowrap" }}>
                                রিপোর্ট দেখুন
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Home Collections */}
        {(stats?.homeCollections?.length ?? 0) > 0 && (
          <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", gap: "10px" }}>
              <Home size={18} style={{ color: "#D97706" }} />
              <span style={{ fontWeight: 600, color: S.text }}>Home Collection — আজকের</span>
            </div>
            <div style={{ padding: "16px" }}>
              {stats!.homeCollections.map(hc => (
                <div key={hc.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: `1px solid ${S.border}`, borderRadius: "8px", marginBottom: "8px", background: S.bg }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MapPin size={18} style={{ color: "#D97706" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: S.text }}>{hc.patient.name}</div>
                      <div style={{ fontSize: "12px", color: S.muted }}>{hc.patient.phone} · {hc.homeAddress}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {hc.homeTime && <div style={{ fontSize: "13px", color: S.text }}>{new Date(hc.homeTime).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}</div>}
                    {hc.collectorName && <div style={{ fontSize: "12px", color: S.muted }}>{hc.collectorName}</div>}
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "#FEF3C7", color: "#D97706" }}>Home</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <AlertCircle size={18} style={{ color: S.primary }} />
            <span style={{ fontWeight: 600, color: S.text }}>দ্রুত নেভিগেশন</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
            {[
              { href: "/lab/testorders", label: "নতুন রেজিস্ট্রেশন", color: "#0891B2", bg: "#ECFEFF" },
              { href: "/lab/results", label: "Result এন্ট্রি", color: "#16A34A", bg: "#DCFCE7" },
              { href: "/lab/tests", label: "পরীক্ষার তালিকা", color: "#7C3AED", bg: "#EDE9FE" },
              { href: "/customers", label: "রোগীর তালিকা", color: "#D97706", bg: "#FFFBEB" },
              { href: "/reports", label: "রিপোর্ট", color: "#EF4444", bg: "#FEF2F2" },
              { href: "/hisab", label: "হিসাব", color: "#0F6E56", bg: "#E1F5EE" },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{ padding: "12px 16px", borderRadius: "8px", background: link.bg, color: link.color, textDecoration: "none", fontWeight: 500, fontSize: "14px", textAlign: "center", border: `1px solid ${link.color}20` }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
