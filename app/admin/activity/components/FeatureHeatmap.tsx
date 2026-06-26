"use client";

import { useEffect, useState } from "react";

interface HeatmapRow {
  shopId: string;
  shopName: string;
  orders: number;
  products: number;
  customers: number;
  sms: number;
  facebook_reply: number;
  total: number;
  atRisk: boolean;
}

interface FeatureHeatmapProps {
  onShopClick?: (shopId: string) => void;
}

function cellIntensity(value: number, max: number): string {
  if (value === 0) return "bg-gray-50 text-gray-400";
  const ratio = max > 0 ? value / max : 0;
  if (ratio > 0.7) return "bg-emerald-600 text-white";
  if (ratio > 0.4) return "bg-emerald-400 text-white";
  if (ratio > 0.15) return "bg-emerald-200 text-emerald-900";
  return "bg-emerald-50 text-emerald-800";
}

export default function FeatureHeatmap({ onShopClick }: FeatureHeatmapProps) {
  const [rows, setRows] = useState<HeatmapRow[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/activity/heatmap?month=${month}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []))
      .finally(() => setLoading(false));
  }, [month]);

  const maxVal = Math.max(
    1,
    ...rows.flatMap((r) => [r.orders, r.products, r.customers, r.sms, r.facebook_reply]),
  );

  const columns = [
    { key: "orders", label: "Orders" },
    { key: "products", label: "Products" },
    { key: "customers", label: "Customers" },
    { key: "sms", label: "SMS" },
    { key: "facebook_reply", label: "FB Reply" },
  ] as const;

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="font-semibold text-gray-900">Feature Usage Heatmap</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-semibold">Shop Name</th>
              {columns.map((c) => (
                <th key={c.key} className="px-3 py-3 text-center font-semibold">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  লোড হচ্ছে...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  কোনো ডেটা নেই
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.shopId}
                  className={`border-b border-gray-50 ${row.atRisk ? "bg-amber-50/60" : ""}`}
                >
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => onShopClick?.(row.shopId)}
                      className="font-medium text-emerald-700 hover:underline text-left"
                    >
                      {row.shopName}
                      {row.atRisk && (
                        <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] text-amber-900">
                          at-risk
                        </span>
                      )}
                    </button>
                  </td>
                  {columns.map((c) => {
                    const val = row[c.key];
                    return (
                      <td key={c.key} className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-flex min-w-[2rem] justify-center rounded-md px-2 py-1 text-xs font-semibold ${cellIntensity(val, maxVal)}`}
                        >
                          {val}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
