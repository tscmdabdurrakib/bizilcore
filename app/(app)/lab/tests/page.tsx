"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, TestTube2, ToggleLeft, ToggleRight, Package, X, ChevronDown } from "lucide-react";

interface LabTest {
  id: string;
  name: string;
  banglaName: string | null;
  shortCode: string;
  category: string;
  price: number;
  homeCollectionPrice: number | null;
  turnaroundHours: number;
  sampleType: string | null;
  normalRangeMale: string | null;
  normalRangeFemale: string | null;
  unit: string | null;
  isActive: boolean;
}

interface TestPackage {
  id: string;
  name: string;
  banglaName: string | null;
  price: number;
  isActive: boolean;
  tests: { id: string; test: LabTest }[];
}

const CATEGORIES = [
  { key: "all", label: "সব" },
  { key: "hematology", label: "Hematology" },
  { key: "biochemistry", label: "Biochemistry" },
  { key: "microbiology", label: "Microbiology" },
  { key: "serology", label: "Serology" },
  { key: "urine", label: "Urine/Stool" },
  { key: "hormones", label: "Hormones" },
  { key: "imaging", label: "Imaging" },
  { key: "other", label: "Other" },
];

const SAMPLE_TYPES = ["Blood", "Urine", "Stool", "Swab", "Serum", "Sputum", "Other"];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "var(--c-primary)",
  bg: "var(--c-bg)",
};

const inp = (focused: boolean) => ({
  height: "40px",
  border: `1px solid ${focused ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px",
  color: S.text,
  backgroundColor: S.surface,
  padding: "0 12px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box" as const,
});

function AddTestModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: "", banglaName: "", shortCode: "", category: "hematology",
    sampleType: "Blood", price: "", homeCollectionPrice: "",
    turnaroundHours: "24", normalRangeMale: "", normalRangeFemale: "", unit: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const f = (k: string) => focused === k;

  async function save() {
    if (!form.name || !form.shortCode || !form.category || !form.price) {
      setErr("নাম, কোড, বিভাগ ও মূল্য আবশ্যক");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/lab/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Error"); return; }
      onSave();
    } catch { setErr("নেটওয়ার্ক সমস্যা"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: S.surface, borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: S.text }}>নতুন Test যোগ করুন</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={20} /></button>
        </div>
        <div style={{ padding: "24px", display: "grid", gap: "16px" }}>
          {err && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#EF4444", fontSize: "14px" }}>{err}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>পরীক্ষার নাম (English) *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} style={inp(f("name"))} placeholder="Complete Blood Count" />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>বাংলা নাম</label>
              <input value={form.banglaName} onChange={e => setForm(p => ({ ...p, banglaName: e.target.value }))} onFocus={() => setFocused("bn")} onBlur={() => setFocused(null)} style={inp(f("bn"))} placeholder="সম্পূর্ণ রক্ত গণনা" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>Short Code *</label>
              <input value={form.shortCode} onChange={e => setForm(p => ({ ...p, shortCode: e.target.value.toUpperCase() }))} onFocus={() => setFocused("code")} onBlur={() => setFocused(null)} style={inp(f("code"))} placeholder="CBC" />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>বিভাগ *</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ ...inp(false), appearance: "none" }}>
                {CATEGORIES.filter(c => c.key !== "all").map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>মূল্য (৳) *</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} onFocus={() => setFocused("price")} onBlur={() => setFocused(null)} style={inp(f("price"))} placeholder="500" />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>Home Collection মূল্য</label>
              <input type="number" value={form.homeCollectionPrice} onChange={e => setForm(p => ({ ...p, homeCollectionPrice: e.target.value }))} onFocus={() => setFocused("hcp")} onBlur={() => setFocused(null)} style={inp(f("hcp"))} placeholder="600" />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>Turnaround (ঘন্টা)</label>
              <input type="number" value={form.turnaroundHours} onChange={e => setForm(p => ({ ...p, turnaroundHours: e.target.value }))} onFocus={() => setFocused("tat")} onBlur={() => setFocused(null)} style={inp(f("tat"))} placeholder="24" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>Sample ধরন</label>
              <select value={form.sampleType} onChange={e => setForm(p => ({ ...p, sampleType: e.target.value }))} style={{ ...inp(false), appearance: "none" }}>
                {SAMPLE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>Unit</label>
              <input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} onFocus={() => setFocused("unit")} onBlur={() => setFocused(null)} style={inp(f("unit"))} placeholder="g/dL" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>Normal Range (পুরুষ)</label>
              <input value={form.normalRangeMale} onChange={e => setForm(p => ({ ...p, normalRangeMale: e.target.value }))} onFocus={() => setFocused("nrm")} onBlur={() => setFocused(null)} style={inp(f("nrm"))} placeholder="4.0-11.0" />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>Normal Range (মহিলা)</label>
              <input value={form.normalRangeFemale} onChange={e => setForm(p => ({ ...p, normalRangeFemale: e.target.value }))} onFocus={() => setFocused("nrf")} onBlur={() => setFocused(null)} style={inp(f("nrf"))} placeholder="3.5-10.5" />
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${S.border}`, display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "8px", border: `1px solid ${S.border}`, background: S.surface, color: S.text, cursor: "pointer", fontSize: "14px" }}>বাতিল</button>
          <button onClick={save} disabled={loading} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: S.primary, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
            {loading ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddPackageModal({ tests, onClose, onSave }: { tests: LabTest[]; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ name: "", banglaName: "", price: "" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const f = (k: string) => focused === k;

  const selectedTotal = tests.filter(t => selectedIds.includes(t.id)).reduce((s, t) => s + t.price, 0);

  async function save() {
    if (!form.name || !form.price || selectedIds.length === 0) {
      setErr("নাম, মূল্য ও অন্তত একটি পরীক্ষা বাছাই করুন");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/lab/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, testIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error ?? "Error"); return; }
      onSave();
    } catch { setErr("নেটওয়ার্ক সমস্যা"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: S.surface, borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: S.text }}>নতুন Package তৈরি করুন</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: S.muted }}><X size={20} /></button>
        </div>
        <div style={{ padding: "24px", display: "grid", gap: "16px" }}>
          {err && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#EF4444", fontSize: "14px" }}>{err}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>Package নাম *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} style={inp(f("name"))} placeholder="Diabetic Package" />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>বাংলা নাম</label>
              <input value={form.banglaName} onChange={e => setForm(p => ({ ...p, banglaName: e.target.value }))} onFocus={() => setFocused("bn")} onBlur={() => setFocused(null)} style={inp(f("bn"))} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "6px" }}>Package মূল্য (৳) *</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} onFocus={() => setFocused("price")} onBlur={() => setFocused(null)} style={{ ...inp(f("price")), flex: 1 }} placeholder="1500" />
              {selectedTotal > 0 && (
                <div style={{ fontSize: "12px", color: S.muted, whiteSpace: "nowrap" }}>
                  Individual: ৳{selectedTotal}
                  {form.price && parseFloat(form.price) < selectedTotal && (
                    <span style={{ color: "#16A34A", marginLeft: "6px" }}>৳{selectedTotal - parseFloat(form.price)} সাশ্রয়</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: "13px", fontWeight: 500, color: S.muted, display: "block", marginBottom: "8px" }}>পরীক্ষা নির্বাচন করুন</label>
            <div style={{ border: `1px solid ${S.border}`, borderRadius: "8px", maxHeight: "220px", overflow: "auto" }}>
              {tests.filter(t => t.isActive).map((test, i) => (
                <div key={test.id} onClick={() => setSelectedIds(p => p.includes(test.id) ? p.filter(x => x !== test.id) : [...p, test.id])} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", cursor: "pointer", borderTop: i > 0 ? `1px solid ${S.border}` : undefined, background: selectedIds.includes(test.id) ? "#ECFEFF" : "transparent" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: `2px solid ${selectedIds.includes(test.id) ? "#0891B2" : S.border}`, background: selectedIds.includes(test.id) ? "#0891B2" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selectedIds.includes(test.id) && <span style={{ color: "#fff", fontSize: "10px", fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", color: S.text }}>{test.name} <span style={{ color: S.muted }}>({test.shortCode})</span></div>
                    {test.banglaName && <div style={{ fontSize: "12px", color: S.muted }}>{test.banglaName}</div>}
                  </div>
                  <span style={{ fontWeight: 500, color: S.text }}>৳{test.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${S.border}`, display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "8px", border: `1px solid ${S.border}`, background: S.surface, color: S.text, cursor: "pointer", fontSize: "14px" }}>বাতিল</button>
          <button onClick={save} disabled={loading} style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: S.primary, color: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
            {loading ? "সেভ হচ্ছে..." : "Package তৈরি করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LabTestsPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [packages, setPackages] = useState<TestPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddTest, setShowAddTest] = useState(false);
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [tab, setTab] = useState<"tests" | "packages">("tests");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lab/tests?packages=1`);
      if (res.ok) {
        const data = await res.json();
        setTests(data.tests);
        setPackages(data.packages);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(test: LabTest) {
    await fetch("/api/lab/tests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: test.id, isActive: !test.isActive }),
    });
    load();
  }

  const filtered = tests.filter(t => {
    const matchCat = category === "all" || t.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.shortCode.toLowerCase().includes(q) || (t.banglaName ?? "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {showAddTest && <AddTestModal onClose={() => setShowAddTest(false)} onSave={() => { setShowAddTest(false); load(); }} />}
      {showAddPackage && <AddPackageModal tests={tests} onClose={() => setShowAddPackage(false)} onSave={() => { setShowAddPackage(false); load(); }} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: S.text, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <TestTube2 size={24} style={{ color: "#0891B2" }} /> পরীক্ষার তালিকা
          </h1>
          <p style={{ color: S.muted, fontSize: "14px", margin: "4px 0 0" }}>{tests.length}টি পরীক্ষা · {packages.length}টি প্যাকেজ</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowAddPackage(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "8px", border: `1px solid ${S.border}`, background: S.surface, color: S.text, cursor: "pointer", fontSize: "14px" }}>
            <Package size={15} /> নতুন Package
          </button>
          <button onClick={() => setShowAddTest(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "8px", border: "none", background: S.primary, color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}>
            <Plus size={15} /> নতুন Test
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${S.border}`, marginBottom: "20px" }}>
        {([["tests", "পরীক্ষা"], ["packages", "প্যাকেজ"]] as [string, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k as "tests" | "packages")} style={{ padding: "10px 20px", border: "none", background: "none", cursor: "pointer", fontWeight: tab === k ? 600 : 400, color: tab === k ? S.primary : S.muted, borderBottom: tab === k ? `2px solid ${S.primary}` : "2px solid transparent", fontSize: "14px", marginBottom: "-1px" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "tests" && (
        <>
          {/* Category Tabs */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            {CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setCategory(c.key)} style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${category === c.key ? S.primary : S.border}`, background: category === c.key ? "#ECFEFF" : S.surface, color: category === c.key ? "#0891B2" : S.muted, cursor: "pointer", fontSize: "13px", fontWeight: category === c.key ? 600 : 400 }}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: "20px", maxWidth: "400px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: S.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম বা কোড দিয়ে খুঁজুন..." style={{ ...inp(false), paddingLeft: "38px" }} />
          </div>

          {/* Tests Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: S.muted }}>লোড হচ্ছে...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: S.muted }}>
              <TestTube2 size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
              <p>কোনো পরীক্ষা পাওয়া যায়নি</p>
              <button onClick={() => setShowAddTest(true)} style={{ marginTop: "12px", padding: "8px 16px", borderRadius: "8px", border: "none", background: S.primary, color: "#fff", cursor: "pointer" }}>প্রথম Test যোগ করুন</button>
            </div>
          ) : (
            <div style={{ border: `1px solid ${S.border}`, borderRadius: "12px", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: S.bg }}>
                      {["পরীক্ষার নাম", "কোড", "বিভাগ", "Sample", "মূল্য", "Home", "Turnaround", "Status"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: S.muted, fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((test, i) => (
                      <tr key={test.id} style={{ borderTop: i > 0 ? `1px solid ${S.border}` : undefined }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 500, color: S.text }}>{test.name}</div>
                          {test.banglaName && <div style={{ fontSize: "12px", color: S.muted }}>{test.banglaName}</div>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontFamily: "monospace", background: "#ECFEFF", color: "#0891B2", padding: "2px 8px", borderRadius: "4px", fontSize: "13px" }}>{test.shortCode}</span>
                        </td>
                        <td style={{ padding: "12px 16px", color: S.muted, fontSize: "13px", textTransform: "capitalize" }}>{test.category}</td>
                        <td style={{ padding: "12px 16px", color: S.muted, fontSize: "13px" }}>{test.sampleType ?? "—"}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: S.text }}>৳{test.price}</td>
                        <td style={{ padding: "12px 16px", color: S.muted, fontSize: "13px" }}>{test.homeCollectionPrice ? `৳${test.homeCollectionPrice}` : "—"}</td>
                        <td style={{ padding: "12px 16px", color: S.muted, fontSize: "13px" }}>{test.turnaroundHours}h</td>
                        <td style={{ padding: "12px 16px" }}>
                          <button onClick={() => toggleStatus(test)} style={{ background: "none", border: "none", cursor: "pointer", color: test.isActive ? "#16A34A" : "#9CA3AF", display: "flex", alignItems: "center", gap: "4px" }}>
                            {test.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                            <span style={{ fontSize: "12px" }}>{test.isActive ? "Active" : "Inactive"}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "packages" && (
        <div>
          {packages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: S.muted }}>
              <Package size={40} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
              <p>কোনো প্যাকেজ নেই</p>
              <button onClick={() => setShowAddPackage(true)} style={{ marginTop: "12px", padding: "8px 16px", borderRadius: "8px", border: "none", background: S.primary, color: "#fff", cursor: "pointer" }}>প্রথম Package তৈরি করুন</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {packages.map(pkg => (
                <div key={pkg.id} style={{ border: `1px solid ${S.border}`, borderRadius: "12px", padding: "20px", background: S.surface }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "16px", color: S.text }}>{pkg.name}</div>
                      {pkg.banglaName && <div style={{ fontSize: "13px", color: S.muted }}>{pkg.banglaName}</div>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "18px", color: "#0891B2" }}>৳{pkg.price}</div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                    {pkg.tests.map(pt => (
                      <span key={pt.id} style={{ padding: "3px 10px", borderRadius: "12px", background: "#F0F9FF", color: "#0369A1", fontSize: "12px" }}>{pt.test.shortCode}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: "12px", color: S.muted }}>
                    Individual মোট: ৳{pkg.tests.reduce((s, pt) => s + pt.test.price, 0)}
                    {pkg.tests.reduce((s, pt) => s + pt.test.price, 0) > pkg.price && (
                      <span style={{ color: "#16A34A", marginLeft: "8px" }}>৳{pkg.tests.reduce((s, pt) => s + pt.test.price, 0) - pkg.price} সাশ্রয়</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
