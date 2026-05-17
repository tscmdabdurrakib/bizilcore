"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, X, ChevronRight, ChevronLeft, Printer, User, TestTube2, Banknote, Clock } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface Patient { id: string; name: string; phone: string | null; address: string | null; }
interface LabTest { id: string; name: string; banglaName: string | null; shortCode: string; category: string; price: number; homeCollectionPrice: number | null; sampleType: string | null; }
interface TestPackage { id: string; name: string; price: number; tests: { id: string; test: LabTest }[]; }
interface SelectedTest { testId: string; name: string; shortCode: string; price: number; }
interface TestOrder {
  id: string; orderNumber: string; status: string; urgency: string; createdAt: string;
  totalAmount: number; netAmount: number; paidAmount: number; dueAmount: number;
  patient: { name: string; phone: string | null };
  items: { test: { name: string; shortCode: string } }[];
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  registered:       { label: "নিবন্ধিত",     color: "#0C447C", bg: "#E6F1FB" },
  sample_collected: { label: "Sample নেওয়া", color: "#B45309", bg: "#FEF3C7" },
  processing:       { label: "Processing",   color: "#7C3AED", bg: "#EDE9FE" },
  ready:            { label: "Result Ready", color: "#166534", bg: "#DCFCE7" },
  delivered:        { label: "Delivered",    color: "#6B7280", bg: "#F3F4F6" },
};

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", primary: "var(--c-primary)", bg: "var(--c-bg)",
};

const inp = (focused: boolean) => ({
  height: "40px", border: `1px solid ${focused ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px", color: S.text, backgroundColor: S.surface,
  padding: "0 12px", fontSize: "14px", outline: "none", width: "100%",
  boxSizing: "border-box" as const,
});

function TokenSlip({ order, onClose }: { order: TestOrder & { patient: Patient }; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "400px" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#0891B2" }}>🔬 Lab Token</div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: "#111", marginTop: "4px" }}>{order.orderNumber}</div>
          </div>
          <div id="token-content" style={{ border: "1px dashed #D1D5DB", borderRadius: "8px", padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600 }}>রোগী:</span>
              <span>{order.patient.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontWeight: 600 }}>ফোন:</span>
              <span>{order.patient.phone ?? "—"}</span>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>পরীক্ষা:</div>
              <div style={{ fontSize: "13px", color: "#6B7280" }}>{order.items.map(i => i.test.name).join(", ")}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontWeight: 600 }}>মোট:</span>
              <span>{formatBDT(order.netAmount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontWeight: 600 }}>পরিশোধ:</span>
              <span style={{ color: "#16A34A" }}>{formatBDT(order.paidAmount)}</span>
            </div>
            {order.dueAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontWeight: 600 }}>বাকি:</span>
                <span style={{ color: "#EF4444" }}>{formatBDT(order.dueAmount)}</span>
              </div>
            )}
            <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "12px", textAlign: "center" }}>
              {new Date(order.createdAt).toLocaleString("bn-BD")}
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "8px", border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontSize: "14px" }}>
            <Printer size={15} /> প্রিন্ট
          </button>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "8px", border: "none", background: "#0891B2", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>বন্ধ করুন</button>
        </div>
      </div>
    </div>
  );
}

function RegistrationModal({
  tests, packages, onClose, onSave,
}: {
  tests: LabTest[];
  packages: TestPackage[];
  onClose: () => void;
  onSave: (order: TestOrder & { patient: Patient }) => void;
}) {
  const [step, setStep] = useState(1);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({ name: "", phone: "", age: "", gender: "male", bloodGroup: "", address: "" });
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [refDoctor, setRefDoctor] = useState({ name: "", phone: "" });
  const [collectionType, setCollectionType] = useState("lab");
  const [homeInfo, setHomeInfo] = useState({ address: "", date: "", time: "" });
  const [urgency, setUrgency] = useState("normal");
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [testSearch, setTestSearch] = useState("");
  const [testResults, setTestResults] = useState<LabTest[]>([]);
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "pct">("flat");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const f = (k: string) => focused === k;

  useEffect(() => {
    fetch("/api/customers?limit=200").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setPatients(data);
      else if (Array.isArray(data.customers)) setPatients(data.customers);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!patientSearch.trim()) { setPatientSuggestions([]); return; }
    const q = patientSearch.toLowerCase();
    setPatientSuggestions(patients.filter(p => p.name.toLowerCase().includes(q) || (p.phone ?? "").includes(q)).slice(0, 5));
  }, [patientSearch, patients]);

  useEffect(() => {
    if (!testSearch.trim()) { setTestResults([]); return; }
    const q = testSearch.toLowerCase();
    setTestResults(tests.filter(t => t.isActive !== false && (t.name.toLowerCase().includes(q) || t.shortCode.toLowerCase().includes(q) || (t.banglaName ?? "").toLowerCase().includes(q))).slice(0, 10));
  }, [testSearch, tests]);

  function addTest(test: LabTest) {
    if (!selectedTests.find(t => t.testId === test.id)) {
      setSelectedTests(p => [...p, { testId: test.id, name: test.name, shortCode: test.shortCode, price: collectionType === "home" && test.homeCollectionPrice ? test.homeCollectionPrice : test.price }]);
    }
    setTestSearch("");
    setTestResults([]);
  }

  function addPackage(pkg: TestPackage) {
    pkg.tests.forEach(pt => {
      if (!selectedTests.find(t => t.testId === pt.test.id)) {
        setSelectedTests(p => [...p, { testId: pt.test.id, name: pt.test.name, shortCode: pt.test.shortCode, price: collectionType === "home" && pt.test.homeCollectionPrice ? pt.test.homeCollectionPrice : pt.test.price }]);
      }
    });
  }

  const total = selectedTests.reduce((s, t) => s + t.price, 0);
  const discAmt = discountType === "flat" ? parseFloat(discount || "0") : (total * parseFloat(discount || "0") / 100);
  const net = Math.max(0, total - discAmt);
  const due = Math.max(0, net - parseFloat(paidAmount || "0"));

  async function submit() {
    setLoading(true);
    setErr("");
    try {
      const patientData = selectedPatient ?? { ...newPatient };
      if (!selectedPatient && !newPatient.name) { setErr("রোগীর নাম দিন"); setLoading(false); return; }
      if (selectedTests.length === 0) { setErr("অন্তত একটি পরীক্ষা নির্বাচন করুন"); setLoading(false); return; }

      const homeTime = homeInfo.date && homeInfo.time ? new Date(`${homeInfo.date}T${homeInfo.time}`) : null;

      const res = await fetch("/api/lab/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientData,
          refDoctorName: refDoctor.name || null,
          refDoctorPhone: refDoctor.phone || null,
          collectionType,
          homeAddress: homeInfo.address || null,
          homeTime,
          urgency,
          items: selectedTests.map(t => ({ testId: t.testId, price: t.price })),
          totalAmount: total,
          discountAmount: discAmt,
          netAmount: net,
          paidAmount: parseFloat(paidAmount || "0"),
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Error"); return; }
      onSave(data);
    } catch { setErr("নেটওয়ার্ক সমস্যা"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: S.surface, borderRadius: "16px", width: "100%", maxWidth: "680px", maxHeight: "92vh", overflow: "auto" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: S.text }}>নতুন রোগী রেজিস্ট্রেশন</h2>
            <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: step === n ? S.primary : step > n ? "#16A34A" : S.bg, color: step >= n ? "#fff" : S.muted, fontSize: "12px", fontWeight: 700 }}>{step > n ? "✓" : n}</div>
                  <span style={{ fontSize: "12px", color: step === n ? S.primary : S.muted }}>{["রোগীর তথ্য", "পরীক্ষা", "পেমেন্ট"][n - 1]}</span>
                  {n < 3 && <ChevronRight size={14} style={{ color: S.muted }} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={20} /></button>
        </div>

        <div style={{ padding: "24px" }}>
          {err && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#EF4444", fontSize: "14px", marginBottom: "16px" }}>{err}</div>}

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: "grid", gap: "16px" }}>
              {/* Patient Search */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>রোগী খুঁজুন (নাম বা ফোন)</label>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: S.muted }} />
                  <input value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null); setIsNewPatient(false); }} onFocus={() => setFocused("psearch")} onBlur={() => setTimeout(() => setFocused(null), 200)} style={{ ...inp(f("psearch")), paddingLeft: "38px" }} placeholder="নাম বা ফোন নম্বর দিন..." />
                  {patientSuggestions.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: S.surface, border: `1px solid ${S.border}`, borderRadius: "8px", zIndex: 100, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                      {patientSuggestions.map(p => (
                        <div key={p.id} onClick={() => { setSelectedPatient(p); setPatientSearch(p.name); setPatientSuggestions([]); setIsNewPatient(false); }} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
                          <User size={16} style={{ color: S.muted }} />
                          <div>
                            <div style={{ fontWeight: 500, color: S.text }}>{p.name}</div>
                            <div style={{ fontSize: "12px", color: S.muted }}>{p.phone}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedPatient && (
                  <div style={{ marginTop: "10px", padding: "10px 14px", background: "#ECFEFF", borderRadius: "8px", border: "1px solid #A5F3FC", display: "flex", alignItems: "center", gap: "10px" }}>
                    <User size={16} style={{ color: "#0891B2" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: S.text }}>{selectedPatient.name}</div>
                      <div style={{ fontSize: "12px", color: S.muted }}>{selectedPatient.phone} {selectedPatient.address ? `· ${selectedPatient.address}` : ""}</div>
                    </div>
                    <button onClick={() => { setSelectedPatient(null); setPatientSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={14} /></button>
                  </div>
                )}
                {!selectedPatient && (
                  <button onClick={() => setIsNewPatient(true)} style={{ marginTop: "8px", fontSize: "13px", color: S.primary, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    + নতুন রোগী যোগ করুন
                  </button>
                )}
              </div>

              {/* New Patient Form */}
              {isNewPatient && !selectedPatient && (
                <div style={{ border: `1px solid ${S.border}`, borderRadius: "10px", padding: "16px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: S.text, marginBottom: "12px" }}>নতুন রোগীর তথ্য</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: S.muted, display: "block", marginBottom: "4px" }}>নাম *</label>
                      <input value={newPatient.name} onChange={e => setNewPatient(p => ({ ...p, name: e.target.value }))} onFocus={() => setFocused("np_name")} onBlur={() => setFocused(null)} style={{ ...inp(f("np_name")), height: "36px" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: S.muted, display: "block", marginBottom: "4px" }}>ফোন *</label>
                      <input value={newPatient.phone} onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))} onFocus={() => setFocused("np_phone")} onBlur={() => setFocused(null)} style={{ ...inp(f("np_phone")), height: "36px" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: S.muted, display: "block", marginBottom: "4px" }}>বয়স *</label>
                      <input type="number" value={newPatient.age} onChange={e => setNewPatient(p => ({ ...p, age: e.target.value }))} onFocus={() => setFocused("np_age")} onBlur={() => setFocused(null)} style={{ ...inp(f("np_age")), height: "36px" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: S.muted, display: "block", marginBottom: "4px" }}>লিঙ্গ</label>
                      <select value={newPatient.gender} onChange={e => setNewPatient(p => ({ ...p, gender: e.target.value }))} style={{ ...inp(false), height: "36px", appearance: "none" }}>
                        <option value="male">পুরুষ</option>
                        <option value="female">মহিলা</option>
                        <option value="other">অন্যান্য</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: S.muted, display: "block", marginBottom: "4px" }}>Blood Group</label>
                      <select value={newPatient.bloodGroup} onChange={e => setNewPatient(p => ({ ...p, bloodGroup: e.target.value }))} style={{ ...inp(false), height: "36px", appearance: "none" }}>
                        <option value="">জানা নেই</option>
                        {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", color: S.muted, display: "block", marginBottom: "4px" }}>ঠিকানা</label>
                      <input value={newPatient.address} onChange={e => setNewPatient(p => ({ ...p, address: e.target.value }))} onFocus={() => setFocused("np_addr")} onBlur={() => setFocused(null)} style={{ ...inp(f("np_addr")), height: "36px" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Ref Doctor */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>রেফার ডাক্তারের নাম</label>
                  <input value={refDoctor.name} onChange={e => setRefDoctor(p => ({ ...p, name: e.target.value }))} onFocus={() => setFocused("ref_name")} onBlur={() => setFocused(null)} style={inp(f("ref_name"))} placeholder="Dr. ..." />
                </div>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>ডাক্তারের ফোন</label>
                  <input value={refDoctor.phone} onChange={e => setRefDoctor(p => ({ ...p, phone: e.target.value }))} onFocus={() => setFocused("ref_phone")} onBlur={() => setFocused(null)} style={inp(f("ref_phone"))} />
                </div>
              </div>

              {/* Collection Type */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "8px" }}>Sample সংগ্রহ</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {[["lab", "Lab এ আসবে"], ["home", "Home Collection"]].map(([val, label]) => (
                    <button key={val} onClick={() => setCollectionType(val)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${collectionType === val ? S.primary : S.border}`, background: collectionType === val ? "#ECFEFF" : S.surface, color: collectionType === val ? "#0891B2" : S.muted, cursor: "pointer", fontWeight: collectionType === val ? 600 : 400, fontSize: "14px" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {collectionType === "home" && (
                <div style={{ border: `1px solid ${S.border}`, borderRadius: "10px", padding: "14px" }}>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px", color: S.muted, display: "block", marginBottom: "4px" }}>বাসার ঠিকানা</label>
                      <input value={homeInfo.address} onChange={e => setHomeInfo(p => ({ ...p, address: e.target.value }))} onFocus={() => setFocused("h_addr")} onBlur={() => setFocused(null)} style={{ ...inp(f("h_addr")), height: "36px" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: S.muted, display: "block", marginBottom: "4px" }}>তারিখ</label>
                        <DatePicker value={homeInfo.date} onChange={v => setHomeInfo(p => ({ ...p, date: v }))} style={{ ...inp(f("h_date")), height: "36px" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: S.muted, display: "block", marginBottom: "4px" }}>সময়</label>
                        <input type="time" value={homeInfo.time} onChange={e => setHomeInfo(p => ({ ...p, time: e.target.value }))} onFocus={() => setFocused("h_time")} onBlur={() => setFocused(null)} style={{ ...inp(f("h_time")), height: "36px" }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Urgency */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "8px" }}>অগ্রাধিকার</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {[["normal", "⚪ Normal"], ["urgent", "🔴 Urgent"]].map(([val, label]) => (
                    <button key={val} onClick={() => setUrgency(val)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${urgency === val ? (val === "urgent" ? "#EF4444" : S.primary) : S.border}`, background: urgency === val ? (val === "urgent" ? "#FEF2F2" : "#ECFEFF") : S.surface, color: urgency === val ? (val === "urgent" ? "#EF4444" : "#0891B2") : S.muted, cursor: "pointer", fontWeight: urgency === val ? 600 : 400, fontSize: "14px" }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: "grid", gap: "16px" }}>
              {/* Package Shortcuts */}
              {packages.length > 0 && (
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: S.muted, marginBottom: "8px" }}>Quick Package</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {packages.map(pkg => (
                      <button key={pkg.id} onClick={() => addPackage(pkg)} style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid #0891B2`, background: "#ECFEFF", color: "#0891B2", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}>
                        {pkg.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Search */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>পরীক্ষা খুঁজুন</label>
                <div style={{ position: "relative" }}>
                  <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: S.muted }} />
                  <input value={testSearch} onChange={e => setTestSearch(e.target.value)} onFocus={() => setFocused("tsearch")} onBlur={() => setTimeout(() => setFocused(null), 200)} style={{ ...inp(f("tsearch")), paddingLeft: "38px" }} placeholder="CBC, Blood Sugar, TSH..." />
                  {testResults.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: S.surface, border: `1px solid ${S.border}`, borderRadius: "8px", zIndex: 100, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                      {testResults.map(test => (
                        <div key={test.id} onClick={() => addTest(test)} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div>
                            <span style={{ color: S.text, fontWeight: 500 }}>{test.name}</span>
                            <span style={{ color: S.muted, fontSize: "12px", marginLeft: "6px" }}>({test.shortCode})</span>
                          </div>
                          <span style={{ color: "#0891B2", fontWeight: 600 }}>৳{collectionType === "home" && test.homeCollectionPrice ? test.homeCollectionPrice : test.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Tests */}
              {selectedTests.length > 0 ? (
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: S.muted, marginBottom: "8px" }}>নির্বাচিত পরীক্ষা ({selectedTests.length}টি)</div>
                  <div style={{ border: `1px solid ${S.border}`, borderRadius: "8px", overflow: "hidden" }}>
                    {selectedTests.map((t, i) => (
                      <div key={t.testId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderTop: i > 0 ? `1px solid ${S.border}` : undefined }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "monospace", background: "#ECFEFF", color: "#0891B2", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>{t.shortCode}</span>
                          <span style={{ color: S.text, fontSize: "14px" }}>{t.name}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontWeight: 600, color: S.text }}>৳{t.price}</span>
                          <button onClick={() => setSelectedTests(p => p.filter(x => x.testId !== t.testId))} style={{ background: "none", border: "none", cursor: "pointer", color: "#EF4444" }}><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                    <div style={{ padding: "10px 14px", borderTop: `1px solid ${S.border}`, background: S.bg, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, color: S.text }}>মোট</span>
                      <span style={{ fontWeight: 700, fontSize: "16px", color: S.primary }}>৳{total}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "40px", textAlign: "center", color: S.muted, border: `1px dashed ${S.border}`, borderRadius: "8px" }}>
                  <TestTube2 size={28} style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: "14px" }}>কোনো পরীক্ষা নির্বাচন করা হয়নি</p>
                </div>
              )}

              {/* Discount */}
              {selectedTests.length > 0 && (
                <div>
                  <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>ছাড় (Discount)</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} onFocus={() => setFocused("disc")} onBlur={() => setFocused(null)} style={{ ...inp(f("disc")), flex: 1 }} placeholder="0" />
                    <select value={discountType} onChange={e => setDiscountType(e.target.value as "flat" | "pct")} style={{ ...inp(false), width: "80px", appearance: "none" }}>
                      <option value="flat">৳</option>
                      <option value="pct">%</option>
                    </select>
                  </div>
                  {net !== total && (
                    <div style={{ marginTop: "8px", fontSize: "14px", color: S.muted }}>
                      নেট পরিমাণ: <strong style={{ color: S.primary }}>৳{net.toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ padding: "14px", background: S.bg, borderRadius: "8px", border: `1px solid ${S.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: S.muted }}>মোট</span>
                  <span style={{ fontWeight: 500, color: S.text }}>৳{total}</span>
                </div>
                {discAmt > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "#16A34A" }}>ছাড়</span>
                    <span style={{ color: "#16A34A" }}>-৳{discAmt.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${S.border}`, paddingTop: "8px" }}>
                  <span style={{ fontWeight: 700, color: S.text }}>নেট পরিমাণ</span>
                  <span style={{ fontWeight: 700, fontSize: "18px", color: S.primary }}>৳{net.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>পরিশোধ (৳)</label>
                <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} onFocus={() => setFocused("paid")} onBlur={() => setFocused(null)} style={inp(f("paid"))} placeholder={`${net}`} />
              </div>

              <div>
                <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>পেমেন্ট পদ্ধতি</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {["cash", "bkash", "nagad", "card", "other"].map(m => (
                    <button key={m} onClick={() => setPaymentMethod(m)} style={{ padding: "8px 16px", borderRadius: "8px", border: `1px solid ${paymentMethod === m ? S.primary : S.border}`, background: paymentMethod === m ? "#ECFEFF" : S.surface, color: paymentMethod === m ? "#0891B2" : S.muted, cursor: "pointer", fontSize: "13px", fontWeight: paymentMethod === m ? 600 : 400, textTransform: "capitalize" }}>
                      {m === "cash" ? "নগদ" : m === "card" ? "কার্ড" : m === "other" ? "অন্যান্য" : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {due > 0 && (
                <div style={{ padding: "12px", background: "#FEF2F2", borderRadius: "8px", border: "1px solid #FECACA" }}>
                  <span style={{ color: "#EF4444", fontWeight: 600 }}>বাকি: ৳{due.toFixed(2)}</span>
                </div>
              )}
              {parseFloat(paidAmount || "0") >= net && net > 0 && (
                <div style={{ padding: "12px", background: "#DCFCE7", borderRadius: "8px", border: "1px solid #BBF7D0" }}>
                  <span style={{ color: "#16A34A", fontWeight: 600 }}>✓ সম্পূর্ণ পরিশোধ</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${S.border}`, display: "flex", gap: "10px", justifyContent: "space-between" }}>
          <button onClick={step === 1 ? onClose : () => setStep(s => s - 1)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "8px", border: `1px solid ${S.border}`, background: S.surface, color: S.text, cursor: "pointer", fontSize: "14px" }}>
            <ChevronLeft size={16} /> {step === 1 ? "বাতিল" : "পেছনে"}
          </button>
          {step < 3 ? (
            <button onClick={() => {
              if (step === 1 && !selectedPatient && !isNewPatient) { setErr("রোগী নির্বাচন করুন বা নতুন যোগ করুন"); return; }
              if (step === 1 && isNewPatient && !newPatient.name) { setErr("রোগীর নাম দিন"); return; }
              if (step === 2 && selectedTests.length === 0) { setErr("অন্তত একটি পরীক্ষা নির্বাচন করুন"); return; }
              setErr(""); setStep(s => s + 1);
            }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "8px", border: "none", background: S.primary, color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
              পরবর্তী <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={submit} disabled={loading} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: "#16A34A", color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
              {loading ? "রেজিস্ট্রেশন হচ্ছে..." : "রেজিস্ট্রেশন করুন"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LabTestOrdersPage() {
  const [orders, setOrders] = useState<TestOrder[]>([]);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [packages, setPackages] = useState<TestPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tokenOrder, setTokenOrder] = useState<(TestOrder & { patient: Patient }) | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFilter) params.set("date", dateFilter);
      const [ordersRes, testsRes] = await Promise.all([
        fetch(`/api/lab/orders?${params}`),
        fetch("/api/lab/tests?packages=1"),
      ]);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (testsRes.ok) {
        const d = await testsRes.json();
        setTests(d.tests ?? []);
        setPackages(d.packages ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  async function collectSample(orderId: string) {
    await fetch(`/api/lab/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "collect_sample" }),
    });
    loadOrders();
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {showModal && (
        <RegistrationModal
          tests={tests}
          packages={packages}
          onClose={() => setShowModal(false)}
          onSave={order => { setTokenOrder(order); setShowModal(false); loadOrders(); }}
        />
      )}
      {tokenOrder && <TokenSlip order={tokenOrder} onClose={() => { setTokenOrder(null); }} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: S.text, margin: 0 }}>Test Orders</h1>
          <p style={{ color: S.muted, fontSize: "14px", margin: "4px 0 0" }}>{orders.length}টি অর্ডার</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "8px", border: "none", background: S.primary, color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
          <Plus size={16} /> নতুন রোগী রেজিস্ট্রেশন
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <DatePicker value={dateFilter} onChange={v => setDateFilter(v)} style={{ ...inp(false), width: "160px" }} />
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[["all", "সব"], ["registered", "নিবন্ধিত"], ["sample_collected", "Sample নেওয়া"], ["processing", "Processing"], ["ready", "Ready"], ["delivered", "Delivered"]].map(([k, label]) => (
            <button key={k} onClick={() => setStatusFilter(k)} style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${statusFilter === k ? S.primary : S.border}`, background: statusFilter === k ? "#ECFEFF" : S.surface, color: statusFilter === k ? "#0891B2" : S.muted, cursor: "pointer", fontSize: "13px" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: S.muted }}>লোড হচ্ছে...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px", color: S.muted }}>
          <TestTube2 size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
          <p>কোনো অর্ডার পাওয়া যায়নি</p>
          <button onClick={() => setShowModal(true)} style={{ marginTop: "12px", padding: "10px 20px", borderRadius: "8px", border: "none", background: S.primary, color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            প্রথম রোগী রেজিস্ট্রেশন করুন
          </button>
        </div>
      ) : (
        <div style={{ border: `1px solid ${S.border}`, borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: S.bg }}>
                  {["অর্ডার নং", "রোগী", "পরীক্ষা", "পরিমাণ", "Status", "সময়", "অগ্রাধিকার", "Action"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: S.muted, fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => {
                  const st = STATUS_MAP[order.status] ?? { label: order.status, color: "#6B7280", bg: "#F3F4F6" };
                  return (
                    <tr key={order.id} style={{ borderTop: i > 0 ? `1px solid ${S.border}` : undefined }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0891B2" }}>{order.orderNumber}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 500, color: S.text }}>{order.patient.name}</div>
                        <div style={{ fontSize: "12px", color: S.muted }}>{order.patient.phone}</div>
                      </td>
                      <td style={{ padding: "12px 16px", color: S.muted, maxWidth: "200px", fontSize: "13px" }}>
                        {order.items.map(it => it.test.shortCode).join(", ")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: S.text }}>৳{order.netAmount}</div>
                        {order.dueAmount > 0 && <div style={{ fontSize: "12px", color: "#EF4444" }}>বাকি ৳{order.dueAmount}</div>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, color: st.color, background: st.bg }}>{st.label}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: S.muted, fontSize: "12px", whiteSpace: "nowrap" }}>
                        {new Date(order.createdAt).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {order.urgency === "urgent"
                          ? <span style={{ color: "#EF4444", fontSize: "12px", fontWeight: 600 }}>🔴</span>
                          : <span style={{ color: S.muted, fontSize: "12px" }}>⚪</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {order.status === "registered" && (
                            <button onClick={() => collectSample(order.id)} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #0891B2", background: "#ECFEFF", color: "#0891B2", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}>
                              Sample নিন
                            </button>
                          )}
                          {order.status === "sample_collected" && (
                            <Link href={`/lab/results?order=${order.id}`} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #16A34A", background: "#DCFCE7", color: "#16A34A", fontSize: "12px", textDecoration: "none", whiteSpace: "nowrap" }}>
                              Result দিন
                            </Link>
                          )}
                          {order.status === "ready" && (
                            <Link href={`/lab/results/${order.orderNumber}`} target="_blank" style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #7C3AED", background: "#EDE9FE", color: "#7C3AED", fontSize: "12px", textDecoration: "none", whiteSpace: "nowrap" }}>
                              রিপোর্ট
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
        </div>
      )}
    </div>
  );
}
