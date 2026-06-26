"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { formatBDT } from "@/lib/utils";

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#F59E0B",
};

type ReportData = {
  totalChildren: number;
  activeChildren: number;
  allergyChildren: number;
  sectionBreakdown: { section: string; count: number }[];
  monthFeeCollected: number;
  monthFeeCount: number;
  monthFeeDue: number;
  monthFeeDueCount: number;
  attendanceTrend: { date: string; present: number; absent: number; total: number }[];
  mealBreakdown: { ate_all: number; ate_half: number; didnt_eat: number; brought_from_home: number };
  dailyReportsCount: number;
};

const MEAL_COLORS = ["#10B981", "#F59E0B", "#EF4444", "#3B82F6"];
const SECTION_COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];

export default function KindergartenReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kindergarten/reports")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const mealPieData = [
    { name: "সব খেয়েছে", value: data.mealBreakdown.ate_all },
    { name: "আধা খেয়েছে", value: data.mealBreakdown.ate_half },
    { name: "খায়নি", value: data.mealBreakdown.didnt_eat },
    { name: "বাসা থেকে", value: data.mealBreakdown.brought_from_home },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-10">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "মোট শিশু", value: data.totalChildren, sub: `সক্রিয়: ${data.activeChildren}`, color: "#F59E0B" },
          { label: "Food Allergy", value: data.allergyChildren, sub: "শিশুর allergy আছে", color: "#EF4444" },
          { label: "মাসের আয়", value: formatBDT(data.monthFeeCollected), sub: `${data.monthFeeCount} জনের ফি`, color: "#10B981" },
          { label: "বকেয়া ফি", value: formatBDT(data.monthFeeDue), sub: `${data.monthFeeDueCount} জনের`, color: "#EF4444" },
        ].map(card => (
          <div key={card.label} className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
            <p className="text-xs font-medium mb-1" style={{ color: S.muted }}>{card.label}</p>
            <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
            <p className="text-xs mt-0.5" style={{ color: S.muted }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Attendance Trend */}
      <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>গত ৩০ দিনের উপস্থিতি</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.attendanceTrend.filter(d => d.total > 0)}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={((v: number, n: string) => [v, n === "present" ? "উপস্থিত" : "অনুপস্থিত"]) as never} />
            <Line type="monotone" dataKey="present" stroke="#10B981" strokeWidth={2} dot={false} name="present" />
            <Line type="monotone" dataKey="absent" stroke="#EF4444" strokeWidth={2} dot={false} name="absent" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Section Breakdown + Meal Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section Breakdown */}
        <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>সেকশন অনুযায়ী শিশু</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.sectionBreakdown}>
              <XAxis dataKey="section" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={S.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Meal Breakdown Pie */}
        <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>এই মাসের খাবার পরিস্থিতি</h3>
          {mealPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={mealPieData} dataKey="value" cx="50%" cy="50%" outerRadius={60}>
                    {mealPieData.map((_, i) => (
                      <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {mealPieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: S.muted }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center py-10 text-sm" style={{ color: S.muted }}>এখনো খাবারের তথ্য নেই</p>
          )}
        </div>
      </div>

      {/* Section attendance breakdown */}
      {data.sectionBreakdown.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>সেকশন বিবরণ</h3>
          <div className="space-y-2">
            {data.sectionBreakdown.map((sec, i) => (
              <div key={sec.section} className="flex items-center gap-3">
                <p className="text-sm w-24 flex-shrink-0" style={{ color: S.text }}>{sec.section}</p>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.round((sec.count / data.activeChildren) * 100)}%`,
                      background: SECTION_COLORS[i % SECTION_COLORS.length],
                    }}
                  />
                </div>
                <p className="text-sm font-medium w-8 text-right" style={{ color: S.text }}>{sec.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Report Stats */}
      <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <h3 className="font-semibold text-sm mb-2" style={{ color: S.text }}>এই মাসের ডেইলি রিপোর্ট</h3>
        <p className="text-3xl font-bold" style={{ color: S.primary }}>{data.dailyReportsCount}</p>
        <p className="text-xs mt-1" style={{ color: S.muted }}>মোট রিপোর্ট তৈরি ও পাঠানো</p>
      </div>
    </div>
  );
}
