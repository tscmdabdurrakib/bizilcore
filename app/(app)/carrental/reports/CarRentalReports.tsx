"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatBDT } from "@/lib/utils";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#DC2626",
};

type ReportData = {
  totalVehicles: number;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  totalFuelCost: number;
  totalFuelLiters: number;
  vehicleBreakdown: { vehicle?: { regNumber: string; brand: string; model: string }; bookings: number; revenue: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  driverBreakdown: { driver?: { name: string }; trips: number }[];
  utilizationRate: number;
};

export default function CarRentalReports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/carrental/reports").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
    </div>
  );
  if (!data) return null;

  const netProfit = data.totalRevenue - data.totalFuelCost;

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-10">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "মোট আয়", value: formatBDT(data.totalRevenue), color: "#10B981" },
          { label: "জ্বালানি খরচ", value: formatBDT(data.totalFuelCost), color: "#EF4444" },
          { label: "নেট লাভ", value: formatBDT(netProfit), color: netProfit >= 0 ? "#8B5CF6" : "#EF4444" },
          { label: "মোট বুকিং", value: `${data.completedBookings}/${data.totalBookings}টি`, color: "#F59E0B" },
        ].map(card => (
          <div key={card.label} className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
            <p className="text-xs font-medium mb-1" style={{ color: S.muted }}>{card.label}</p>
            <p className="text-xl font-bold" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <h3 className="font-semibold text-sm mb-4" style={{ color: S.text }}>মাসিক আয় (গত ৬ মাস)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.monthlyRevenue}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={((v: number) => [formatBDT(v), "আয়"]) as never} />
            <Bar dataKey="revenue" fill={S.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vehicle Performance */}
      <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>গাড়ি পারফরম্যান্স (বুকিং অনুযায়ী)</h3>
        {data.vehicleBreakdown.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: S.muted }}>ডেটা নেই</p>
        ) : (
          <div className="space-y-2">
            {data.vehicleBreakdown.slice(0, 8).map((v, i) => {
              const maxBookings = data.vehicleBreakdown[0]?.bookings ?? 1;
              return (
                <div key={i} className="flex items-center gap-3">
                  <p className="text-sm flex-shrink-0 w-36 truncate" style={{ color: S.text }}>
                    {v.vehicle ? `${v.vehicle.brand} [${v.vehicle.regNumber}]` : "Unknown"}
                  </p>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${Math.round((v.bookings / maxBookings) * 100)}%`, background: S.primary }} />
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-medium" style={{ color: S.text }}>{v.bookings} ট্রিপ</p>
                    <p className="text-xs" style={{ color: S.muted }}>{formatBDT(v.revenue)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fuel Stats + Driver Stats side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>জ্বালানি পরিসংখ্যান</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: S.muted }}>মোট জ্বালানি খরচ</span>
              <span className="font-bold" style={{ color: "#EF4444" }}>{formatBDT(data.totalFuelCost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: S.muted }}>মোট লিটার</span>
              <span className="font-bold" style={{ color: S.text }}>{data.totalFuelLiters.toFixed(1)} লি.</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: S.muted }}>গড় প্রতি লিটার</span>
              <span className="font-bold" style={{ color: S.text }}>
                {data.totalFuelLiters > 0 ? formatBDT(data.totalFuelCost / data.totalFuelLiters) : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: S.muted }}>Utilization Rate</span>
              <span className="font-bold" style={{ color: "#8B5CF6" }}>{data.utilizationRate}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>ড্রাইভার পারফরম্যান্স</h3>
          {data.driverBreakdown.length === 0 ? (
            <p className="text-sm" style={{ color: S.muted }}>ডেটা নেই</p>
          ) : (
            <div className="space-y-2">
              {data.driverBreakdown.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: S.text }}>{d.driver?.name ?? "Unknown"}</span>
                  <span className="font-bold" style={{ color: "#10B981" }}>{d.trips} ট্রিপ</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
