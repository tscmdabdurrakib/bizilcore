"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatBDT } from "@/lib/utils";
import { ArrowLeft, Car, ClipboardList, Loader2 } from "lucide-react";

const VEHICLE_ICONS: Record<string, string> = {
  car: "🚗", motorcycle: "🏍️", cng: "🛺", microbus: "🚐", truck: "🚛", bus: "🚌",
};

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  received:       { label: "গাড়ি এসেছে",   color: "#0C447C", bg: "#E6F1FB" },
  diagnosing:     { label: "Diagnosis",     color: "#B45309", bg: "#FEF3C7" },
  waiting_parts:  { label: "Parts অপেক্ষা", color: "#7C3AED", bg: "#EDE9FE" },
  repairing:      { label: "মেরামত",        color: "#0F6E56", bg: "#E1F5EE" },
  quality_check:  { label: "Quality Check", color: "#0369A1", bg: "#E0F2FE" },
  ready:          { label: "Ready",         color: "#166534", bg: "#DCFCE7" },
  delivered:      { label: "Delivered",     color: "#6B7280", bg: "#F3F4F6" },
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "#B45309",
};

type VehicleData = {
  id: string;
  regNumber: string;
  type: string;
  brand: string;
  model: string;
  year?: number | null;
  color?: string | null;
  fuelType?: string | null;
  engineCC?: number | null;
  lastMileage?: number | null;
  notes?: string | null;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    address?: string | null;
  } | null;
  jobCards: Array<{
    id: string;
    jobNumber: string;
    status: string;
    complaint: string;
    totalAmount: number;
    dueAmount: number;
    advancePaid: number;
    createdAt: string;
    deliveredAt?: string | null;
  }>;
};

export default function VehicleDetail({ id }: { id: string }) {
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVehicle = useCallback(async () => {
    try {
      const res = await fetch(`/api/vehicles/${id}`, { cache: "no-store" });
      if (res.ok) setVehicle(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchVehicle(); }, [fetchVehicle]);

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin" style={{ color: S.primary }} size={32} /></div>;
  }
  if (!vehicle) {
    return <div className="p-6 text-center" style={{ color: S.muted }}>গাড়ি পাওয়া যায়নি</div>;
  }

  const icon = VEHICLE_ICONS[vehicle.type] ?? "🚗";
  const totalSpent = vehicle.jobCards.reduce((sum, j) => sum + j.totalAmount, 0);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/vehicles" className="p-2 rounded-lg border" style={{ borderColor: S.border }}>
          <ArrowLeft size={16} style={{ color: S.muted }} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h1 className="font-bold text-xl" style={{ color: S.text }}>{vehicle.regNumber}</h1>
          </div>
          <p className="text-sm" style={{ color: S.muted }}>{vehicle.brand} {vehicle.model}</p>
        </div>
        <Link
          href={`/jobcards?new=1`}
          className="px-3 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: S.primary }}
        >
          নতুন Job Card
        </Link>
      </div>

      {/* Vehicle info */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <h3 className="font-semibold text-sm" style={{ color: S.text }}>গাড়ির তথ্য</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[
            { label: "ধরন", value: vehicle.type },
            { label: "ব্র্যান্ড", value: vehicle.brand },
            { label: "মডেল", value: vehicle.model },
            { label: "বছর", value: vehicle.year?.toString() },
            { label: "রং", value: vehicle.color },
            { label: "জ্বালানি", value: vehicle.fuelType },
            { label: "ইঞ্জিন CC", value: vehicle.engineCC ? `${vehicle.engineCC}cc` : undefined },
            { label: "মাইলেজ", value: vehicle.lastMileage ? `${vehicle.lastMileage} km` : undefined },
          ].filter(r => r.value).map(row => (
            <div key={row.label}>
              <p className="text-xs" style={{ color: S.muted }}>{row.label}</p>
              <p className="font-medium" style={{ color: S.text }}>{row.value}</p>
            </div>
          ))}
        </div>
        {vehicle.notes && <p className="text-sm" style={{ color: S.muted }}>নোট: {vehicle.notes}</p>}
      </div>

      {/* Owner info */}
      {vehicle.customer && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
          <h3 className="font-semibold text-sm" style={{ color: S.text }}>মালিকের তথ্য</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ background: S.primary }}>
              {vehicle.customer.name[0]}
            </div>
            <div>
              <p className="font-semibold" style={{ color: S.text }}>{vehicle.customer.name}</p>
              {vehicle.customer.phone && <p className="text-sm" style={{ color: S.muted }}>{vehicle.customer.phone}</p>}
              {vehicle.customer.address && <p className="text-xs" style={{ color: S.muted }}>{vehicle.customer.address}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 text-center" style={{ background: "#E1F5EE", border: "1px solid #86EFAC" }}>
          <p className="text-xl font-bold" style={{ color: "#0F6E56" }}>{vehicle.jobCards.length}</p>
          <p className="text-xs" style={{ color: "#0F6E56" }}>মোট সার্ভিস</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: "#FEF3C7", border: "1px solid #FCD34D" }}>
          <p className="text-lg font-bold" style={{ color: "#B45309" }}>{formatBDT(totalSpent)}</p>
          <p className="text-xs" style={{ color: "#B45309" }}>মোট খরচ</p>
        </div>
      </div>

      {/* Job card history */}
      <div className="rounded-xl p-4 space-y-3" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
        <div className="flex items-center gap-2">
          <ClipboardList size={16} style={{ color: S.primary }} />
          <h3 className="font-semibold text-sm" style={{ color: S.text }}>সার্ভিস হিস্ট্রি ({vehicle.jobCards.length})</h3>
        </div>
        {vehicle.jobCards.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: S.muted }}>কোনো সার্ভিস হিস্ট্রি নেই</p>
        ) : (
          <div className="space-y-2">
            {vehicle.jobCards.map(job => {
              const st = STATUS_LABEL[job.status] ?? STATUS_LABEL.received;
              return (
                <Link key={job.id} href={`/jobcards/${job.id}`}>
                  <div
                    className="flex items-center justify-between p-3 rounded-lg hover:opacity-80"
                    style={{ background: "#F9FAFB", border: `1px solid ${S.border}` }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: S.text }}>{job.jobNumber}</p>
                      <p className="text-xs truncate max-w-[180px]" style={{ color: S.muted }}>{job.complaint}</p>
                      <p className="text-xs" style={{ color: S.muted }}>{new Date(job.createdAt).toLocaleDateString("bn-BD")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                      <span className="text-xs font-medium" style={{ color: S.text }}>{formatBDT(job.totalAmount)}</span>
                      {job.dueAmount > 0 && (
                        <span className="text-xs" style={{ color: "#DC2626" }}>বাকি {formatBDT(job.dueAmount)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
