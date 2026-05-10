"use client";

import { useState, useEffect, useCallback } from "react";
import { ChefHat, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#F59E0B",
};

const MEAL_TYPES = [
  { key: "breakfast", label: "সকালের নাস্তা" },
  { key: "lunch",     label: "দুপুরের খাবার" },
  { key: "snack",     label: "বিকেলের নাস্তা" },
];

const MEAL_STATUS = [
  { key: "ate_all",          label: "সব খেয়েছে",          color: "#10B981", bg: "#DCFCE7" },
  { key: "ate_half",         label: "আধা খেয়েছে",         color: "#F59E0B", bg: "#FEF3C7" },
  { key: "didnt_eat",        label: "খায়নি",               color: "#EF4444", bg: "#FEE2E2" },
  { key: "brought_from_home",label: "বাসা থেকে এনেছে",    color: "#3B82F6", bg: "#EFF6FF" },
];

const SECTIONS = ["", "Playgroup", "Nursery", "KG-1", "KG-2", "Pre-School"];

type StudentMeal = {
  id: string;
  name: string;
  section?: string | null;
  foodAllergies?: string | null;
  mealRecords: { id: string; status: string; note?: string | null }[];
};

type MealMap = Record<string, string>;

export default function MealsBoard() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [mealType, setMealType] = useState("breakfast");
  const [section, setSection] = useState("");
  const [students, setStudents] = useState<StudentMeal[]>([]);
  const [mealMap, setMealMap] = useState<MealMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ date, mealType });
    if (section) params.set("section", section);
    const res = await fetch(`/api/kindergarten/meals?${params}`);
    const data = await res.json();
    const list: StudentMeal[] = Array.isArray(data) ? data : [];
    setStudents(list);
    const map: MealMap = {};
    list.forEach(s => {
      if (s.mealRecords.length > 0) map[s.id] = s.mealRecords[0].status;
    });
    setMealMap(map);
    setLoading(false);
  }, [date, mealType, section]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const setStatus = (studentId: string, status: string) => {
    setMealMap(prev => ({ ...prev, [studentId]: status }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const records = students.map(s => ({ studentId: s.id, status: mealMap[s.id] ?? "didnt_eat" }));
    await fetch("/api/kindergarten/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, mealType, records }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const counts = {
    ate_all: students.filter(s => mealMap[s.id] === "ate_all").length,
    ate_half: students.filter(s => mealMap[s.id] === "ate_half").length,
    didnt_eat: students.filter(s => mealMap[s.id] === "didnt_eat").length,
    unrecorded: students.filter(s => !mealMap[s.id]).length,
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="date"
          className="border rounded-lg px-3 py-2 text-sm"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ borderColor: S.border, background: S.surface }}
        />
        <select value={section} onChange={e => setSection(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: S.border, background: S.surface }}>
          {SECTIONS.map(s => <option key={s} value={s}>{s || "সব সেকশন"}</option>)}
        </select>
      </div>

      {/* Meal type tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: S.border }}>
        {MEAL_TYPES.map(t => (
          <button
            key={t.key}
            onClick={() => setMealType(t.key)}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderColor: mealType === t.key ? S.primary : "transparent",
              color: mealType === t.key ? S.primary : S.muted,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary badges */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "#DCFCE7", color: "#166534" }}>সব খেয়েছে: {counts.ate_all}</span>
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>আধা খেয়েছে: {counts.ate_half}</span>
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "#FEE2E2", color: "#7F1D1D" }}>খায়নি: {counts.didnt_eat}</span>
        {counts.unrecorded > 0 && <span className="text-xs px-3 py-1 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>রেকর্ড নেই: {counts.unrecorded}</span>}
      </div>

      {/* Student list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin" size={26} style={{ color: S.primary }} />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <ChefHat size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো শিশু পাওয়া যায়নি</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map(student => {
            const current = mealMap[student.id];
            return (
              <div key={student.id} className="rounded-xl p-3" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm" style={{ color: S.text }}>{student.name}</p>
                      {student.section && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FFFBEB", color: "#B45309" }}>{student.section}</span>}
                      {student.foodAllergies && (
                        <span className="text-xs flex items-center gap-1 font-medium" style={{ color: "#DC2626" }}>
                          <AlertTriangle size={10} />
                          {student.foodAllergies}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {MEAL_STATUS.map(s => (
                    <button
                      key={s.key}
                      onClick={() => setStatus(student.id, s.key)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all border-2"
                      style={{
                        background: current === s.key ? s.bg : "transparent",
                        color: current === s.key ? s.color : S.muted,
                        borderColor: current === s.key ? s.color : "transparent",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save button */}
      {students.length > 0 && (
        <div className="sticky bottom-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            style={{ background: saved ? "#10B981" : S.primary }}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle size={18} /> : null}
            {saving ? "সেভ হচ্ছে..." : saved ? "সেভ হয়েছে ✓" : "সেভ করুন"}
          </button>
        </div>
      )}
    </div>
  );
}
