"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Printer, Loader2 } from "lucide-react";

interface LabTest {
  id: string; name: string; banglaName: string | null;
  unit: string | null; normalRangeMale: string | null; normalRangeFemale: string | null;
  category: string;
}

interface TestResult {
  testId: string; value: string; unit: string | null; normalRange: string | null;
  flag: string | null; note: string | null;
  test: LabTest;
}

interface TestOrder {
  id: string; orderNumber: string; status: string; createdAt: string;
  refDoctorName: string | null; refDoctorPhone: string | null;
  patient: { name: string; phone: string | null; address: string | null };
  items: { testId: string; test: LabTest }[];
  results: TestResult[];
}

const FLAG_STYLE: Record<string, { color: string; label: string }> = {
  normal:   { color: "#111",    label: "" },
  high:     { color: "#D97706", label: "↑ High" },
  low:      { color: "#0369A1", label: "↓ Low" },
  critical: { color: "#DC2626", label: "⚠ Critical" },
};

export default function ResultReportPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<TestOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState("ডায়াগনস্টিক সেন্টার");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/lab/results?orderNumber=${orderNumber}`).then(r => r.json()),
      fetch("/api/shop").then(r => r.json()).catch(() => null),
    ]).then(([orderData, shopData]) => {
      if (!orderData.error) setOrder(orderData);
      if (shopData) {
        setShopName(shopData.name ?? "ডায়াগনস্টিক সেন্টার");
        setShopAddress(shopData.address ?? "");
        setShopPhone(shopData.phone ?? "");
      }
    }).finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "80vh" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "#0891B2" }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: "center", padding: "80px", color: "#6B7280" }}>
        <p>অর্ডার পাওয়া যায়নি: {orderNumber}</p>
      </div>
    );
  }

  const resultMap = Object.fromEntries(order.results.map(r => [r.testId, r]));

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .report-page { padding: 16px !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* Print button */}
      <div className="no-print" style={{ position: "fixed", top: "20px", right: "20px", zIndex: 100 }}>
        <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "8px", background: "#0891B2", color: "#fff", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
          <Printer size={16} /> প্রিন্ট / সেভ
        </button>
      </div>

      <div className="report-page" style={{ maxWidth: "750px", margin: "0 auto", padding: "32px 24px", fontFamily: "Arial, sans-serif", color: "#111" }}>
        {/* Header */}
        <div style={{ textAlign: "center", paddingBottom: "16px", borderBottom: "2px solid #0891B2", marginBottom: "16px" }}>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#0891B2" }}>🔬 {shopName}</div>
          {shopAddress && <div style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}>{shopAddress}</div>}
          {shopPhone && <div style={{ fontSize: "13px", color: "#555" }}>ফোন: {shopPhone}</div>}
          <div style={{ fontSize: "12px", color: "#888", marginTop: "6px" }}>Lab Diagnostic Report</div>
        </div>

        {/* Patient Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", padding: "12px 16px", background: "#F8FAFC", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", border: "1px solid #E2E8F0" }}>
          <div><strong>রোগীর নাম:</strong> {order.patient.name}</div>
          <div><strong>অর্ডার নং:</strong> {order.orderNumber}</div>
          <div><strong>ফোন:</strong> {order.patient.phone ?? "—"}</div>
          <div><strong>তারিখ:</strong> {new Date(order.createdAt).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })}</div>
          {order.patient.address && <div style={{ gridColumn: "1/-1" }}><strong>ঠিকানা:</strong> {order.patient.address}</div>}
          {order.refDoctorName && <div style={{ gridColumn: "1/-1" }}><strong>রেফার করেছেন:</strong> Dr. {order.refDoctorName} {order.refDoctorPhone ? `(${order.refDoctorPhone})` : ""}</div>}
        </div>

        {/* Results Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "20px" }}>
          <thead>
            <tr style={{ background: "#0891B2", color: "#fff" }}>
              <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600 }}>পরীক্ষার নাম</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>ফলাফল</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>Unit</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>Normal Range</th>
              <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: 600 }}>Flag</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => {
              const result = resultMap[item.testId];
              const flag = result?.flag ?? "normal";
              const flagStyle = FLAG_STYLE[flag] ?? FLAG_STYLE.normal;
              const isCritical = flag === "critical";
              const isAbnormal = flag !== "normal";

              return (
                <tr key={item.testId} style={{ background: isCritical ? "#FEF2F2" : i % 2 === 0 ? "#fff" : "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: isAbnormal ? 700 : 400, color: flagStyle.color }}>{item.test.name}</div>
                    {item.test.banglaName && <div style={{ fontSize: "11px", color: "#888" }}>{item.test.banglaName}</div>}
                    {result?.note && <div style={{ fontSize: "11px", color: "#555", marginTop: "2px", fontStyle: "italic" }}>{result.note}</div>}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: isAbnormal ? 700 : 400, color: flagStyle.color, fontSize: isAbnormal ? "15px" : "13px" }}>
                    {result?.value ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "#555" }}>
                    {result?.unit ?? item.test.unit ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "#555" }}>
                    {result?.normalRange ?? item.test.normalRangeMale ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    {flagStyle.label && (
                      <span style={{ color: flagStyle.color, fontWeight: 700, fontSize: "12px" }}>{flagStyle.label}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pathologist note */}
        <div style={{ padding: "12px 16px", background: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
          <div style={{ fontWeight: 600, marginBottom: "6px", fontSize: "13px" }}>Pathologist স্বাক্ষর</div>
          <div style={{ height: "40px", borderBottom: "1px solid #CBD5E1" }} />
        </div>

        {/* Footer Disclaimer */}
        <div style={{ fontSize: "11px", color: "#888", textAlign: "center", borderTop: "1px solid #E2E8F0", paddingTop: "12px", lineHeight: 1.6 }}>
          এই রিপোর্ট শুধুমাত্র চিকিৎসা সহায়তার জন্য।
          চিকিৎসার জন্য অবশ্যই বিশেষজ্ঞ ডাক্তারের পরামর্শ নিন।
          <br />
          Report No: {order.orderNumber} | Printed: {new Date().toLocaleString("bn-BD")}
        </div>
      </div>
    </>
  );
}
