"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Microscope, X, AlertTriangle, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";

interface LabTest {
  id: string; name: string; banglaName: string | null; unit: string | null;
  normalRangeMale: string | null; normalRangeFemale: string | null;
}

interface OrderItem {
  id: string; testId: string; resultEntered: boolean;
  test: LabTest & { shortCode: string };
}

interface TestOrder {
  id: string; orderNumber: string; status: string; urgency: string;
  createdAt: string; refDoctorName: string | null;
  patient: { id: string; name: string; phone: string | null; address: string | null };
  items: OrderItem[];
  results: { testId: string; value: string; unit: string | null; normalRange: string | null; flag: string | null; note: string | null }[];
}

interface ResultEntry { value: string; note: string; flag: string; }

const FLAG_MAP: Record<string, { label: string; color: string; bg: string }> = {
  normal:   { label: "Normal",   color: "#16A34A", bg: "#DCFCE7" },
  high:     { label: "High ↑",   color: "#D97706", bg: "#FFFBEB" },
  low:      { label: "Low ↓",    color: "#0369A1", bg: "#E0F2FE" },
  critical: { label: "Critical", color: "#DC2626", bg: "#FEF2F2" },
};

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", primary: "var(--c-primary)", bg: "var(--c-bg)",
};

const inp = (focused: boolean) => ({
  height: "36px", border: `1px solid ${focused ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "6px", color: S.text, backgroundColor: S.surface,
  padding: "0 10px", fontSize: "14px", outline: "none", width: "100%",
  boxSizing: "border-box" as const,
});

function autoFlag(value: string, rangeStr: string | null): string {
  if (!rangeStr || !value.trim()) return "normal";
  const num = parseFloat(value);
  if (isNaN(num)) return "normal";
  const match = rangeStr.match(/^([\d.]+)\s*[-–]\s*([\d.]+)$/);
  if (!match) return "normal";
  const [, minS, maxS] = match;
  const min = parseFloat(minS), max = parseFloat(maxS);
  if (num < min) return num < min * 0.7 ? "critical" : "low";
  if (num > max) return num > max * 1.5 ? "critical" : "high";
  return "normal";
}

function ResultEntryPanel({ order, onSave, onClose }: {
  order: TestOrder;
  onSave: () => void;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<Record<string, ResultEntry>>(() => {
    const init: Record<string, ResultEntry> = {};
    order.items.forEach(item => {
      const existing = order.results.find(r => r.testId === item.testId);
      init[item.testId] = { value: existing?.value ?? "", note: existing?.note ?? "", flag: existing?.flag ?? "normal" };
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  function handleValue(testId: string, value: string, normalRange: string | null) {
    const flag = autoFlag(value, normalRange);
    setEntries(p => ({ ...p, [testId]: { ...p[testId], value, flag } }));
  }

  const hasCritical = Object.values(entries).some(e => e.flag === "critical");
  const criticalTests = order.items.filter(item => entries[item.testId]?.flag === "critical").map(it => it.test.name);

  async function save() {
    setLoading(true);
    setErr("");
    try {
      const results = order.items.map(item => {
        const entry = entries[item.testId] ?? { value: "", note: "", flag: "normal" };
        const normalRange = item.test.normalRangeMale; // simplified
        return {
          testId: item.testId,
          value: entry.value,
          unit: item.test.unit,
          normalRange,
          flag: entry.flag,
          note: entry.note,
        };
      });
      const res = await fetch("/api/lab/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testOrderId: order.id, results }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Error"); return; }
      onSave();
    } catch { setErr("নেটওয়ার্ক সমস্যা"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: S.surface, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: "780px", maxHeight: "90vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, background: S.surface, padding: "18px 24px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "17px", color: S.text }}>{order.orderNumber} — Result এন্ট্রি</div>
            <div style={{ fontSize: "13px", color: S.muted, marginTop: "2px" }}>
              {order.patient.name} · {order.patient.phone ?? "—"}
              {order.refDoctorName && ` · Dr. ${order.refDoctorName}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={20} /></button>
        </div>

        {/* Critical Alert */}
        {hasCritical && (
          <div style={{ margin: "16px 24px 0", padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <AlertTriangle size={18} style={{ color: "#DC2626", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: "#DC2626", fontSize: "14px" }}>সতর্কতা: অত্যন্ত অস্বাভাবিক মান</div>
              <div style={{ fontSize: "13px", color: "#DC2626", marginTop: "2px" }}>{criticalTests.join(", ")} — অবিলম্বে রোগীকে জানান।</div>
            </div>
          </div>
        )}

        {err && <div style={{ margin: "12px 24px 0", padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#EF4444", fontSize: "14px" }}>{err}</div>}

        {/* Test rows */}
        <div style={{ padding: "20px 24px" }}>
          {order.items.map((item, i) => {
            const entry = entries[item.testId] ?? { value: "", note: "", flag: "normal" };
            const flagInfo = FLAG_MAP[entry.flag] ?? FLAG_MAP.normal;
            const normalRange = item.test.normalRangeMale;
            return (
              <div key={item.testId} style={{ border: `1px solid ${entry.flag === "critical" ? "#FECACA" : S.border}`, borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", background: entry.flag === "critical" ? "#FEF2F2" : S.surface }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: S.text }}>{item.test.name}</div>
                    {item.test.banglaName && <div style={{ fontSize: "12px", color: S.muted }}>{item.test.banglaName}</div>}
                    {normalRange && <div style={{ fontSize: "12px", color: S.muted }}>Normal: {normalRange} {item.test.unit ?? ""}</div>}
                  </div>
                  {entry.value && (
                    <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, color: flagInfo.color, background: flagInfo.bg }}>{flagInfo.label}</span>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                  <div>
                    <input
                      value={entry.value}
                      onChange={e => handleValue(item.testId, e.target.value, normalRange ?? null)}
                      onFocus={() => setFocused(`v_${item.testId}`)}
                      onBlur={() => setFocused(null)}
                      style={inp(focused === `v_${item.testId}`)}
                      placeholder="মান লিখুন (যেমন: 4.8, Positive)"
                    />
                  </div>
                  <div>
                    <select value={entry.flag} onChange={e => setEntries(p => ({ ...p, [item.testId]: { ...p[item.testId], flag: e.target.value } }))} style={{ ...inp(false), height: "36px", appearance: "none", color: FLAG_MAP[entry.flag]?.color ?? S.muted }}>
                      {Object.entries(FLAG_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: "8px" }}>
                  <input
                    value={entry.note}
                    onChange={e => setEntries(p => ({ ...p, [item.testId]: { ...p[item.testId], note: e.target.value } }))}
                    onFocus={() => setFocused(`n_${item.testId}`)}
                    onBlur={() => setFocused(null)}
                    style={{ ...inp(focused === `n_${item.testId}`), fontSize: "13px" }}
                    placeholder="মন্তব্য (ঐচ্ছিক)"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ position: "sticky", bottom: 0, background: S.surface, padding: "14px 24px", borderTop: `1px solid ${S.border}`, display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 18px", borderRadius: "8px", border: `1px solid ${S.border}`, background: S.surface, color: S.text, cursor: "pointer", fontSize: "14px" }}>বাতিল</button>
          <button onClick={save} disabled={loading} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#16A34A", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
            {loading ? "সেভ হচ্ছে..." : "Result সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultsPageInner() {
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get("order");

  const [orders, setOrders] = useState<TestOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<TestOrder | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lab/results");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        if (preselectedOrderId) {
          const found = data.find((o: TestOrder) => o.id === preselectedOrderId);
          if (found) setSelectedOrder(found);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [preselectedOrderId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      {selectedOrder && (
        <ResultEntryPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSave={() => { setSelectedOrder(null); load(); }}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: S.text, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Microscope size={24} style={{ color: "#0891B2" }} /> Result এন্ট্রি
          </h1>
          <p style={{ color: S.muted, fontSize: "14px", margin: "4px 0 0" }}>Sample সংগৃহীত অর্ডার — Result প্রবেশের অপেক্ষায়</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: S.muted }}>লোড হচ্ছে...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px", color: S.muted }}>
          <CheckCircle size={40} style={{ margin: "0 auto 12px", display: "block", color: "#16A34A", opacity: 0.5 }} />
          <p>সকল result এন্ট্রি সম্পন্ন!</p>
          <Link href="/lab/testorders" style={{ display: "inline-block", marginTop: "12px", padding: "10px 20px", borderRadius: "8px", background: S.primary, color: "#fff", textDecoration: "none", fontWeight: 600 }}>
            Test Orders দেখুন
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {orders.map(order => (
            <div key={order.id} style={{ border: `1px solid ${expanded === order.id ? S.primary : S.border}`, borderRadius: "12px", overflow: "hidden", background: S.surface }}>
              <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpanded(p => p === order.id ? null : order.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#ECFEFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Microscope size={20} style={{ color: "#0891B2" }} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 700, color: "#0891B2" }}>{order.orderNumber}</span>
                      {order.urgency === "urgent" && <span style={{ fontSize: "11px", padding: "1px 8px", borderRadius: "10px", background: "#FEF2F2", color: "#EF4444", fontWeight: 600 }}>🔴 Urgent</span>}
                    </div>
                    <div style={{ fontSize: "13px", color: S.text, marginTop: "2px" }}>{order.patient.name} · {order.patient.phone}</div>
                    <div style={{ fontSize: "12px", color: S.muted }}>{order.items.map(it => it.test.shortCode).join(", ")}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ fontSize: "12px", color: S.muted, textAlign: "right" }}>
                    {new Date(order.createdAt).toLocaleDateString("bn-BD")}
                  </div>
                  {expanded === order.id ? <ChevronUp size={18} style={{ color: S.muted }} /> : <ChevronDown size={18} style={{ color: S.muted }} />}
                </div>
              </div>

              {expanded === order.id && (
                <div style={{ padding: "12px 18px 16px", borderTop: `1px solid ${S.border}` }}>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button onClick={() => setSelectedOrder(order)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 18px", borderRadius: "8px", border: "none", background: "#16A34A", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
                      <Microscope size={15} /> Result এন্ট্রি করুন
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LabResultsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "var(--c-text-muted)" }}>লোড হচ্ছে...</div>}>
      <ResultsPageInner />
    </Suspense>
  );
}
