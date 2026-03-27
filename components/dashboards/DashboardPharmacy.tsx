import { formatBDT } from "@/lib/utils";
import Link from "next/link";
import { Pill, ShoppingBag, AlertTriangle, TrendingUp } from "lucide-react";

interface Props {
  shopName: string;
  userName: string;
  userGender?: string | null;
  todaySales: number;
  todayOrderCount: number;
  todayProfit: number;
  pendingCount: number;
}

const mockExpiryList = [
  { name: "Napa Extra 500mg",     expiry: "২০২৬-০৪-০৫", stock: 120, daysLeft: 11 },
  { name: "Amodis 400mg",         expiry: "২০২৬-০৪-০৮", stock:  60, daysLeft: 14 },
  { name: "Ranitidine 150mg",     expiry: "২০২৬-০৩-৩০", stock:  30, daysLeft:  5 },
  { name: "Cetirizine 10mg",      expiry: "২০২৬-০৩-২৮", stock:  80, daysLeft:  3 },
  { name: "Pantoprazole 40mg",    expiry: "২০২৬-০৪-১২", stock:  48, daysLeft: 18 },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function DashboardPharmacy({ shopName, userName, userGender, todaySales, todayOrderCount, todayProfit, pendingCount }: Props) {
  const greeting =
    userGender === "আপু" ? `আপু, স্বাগতম!` :
    userGender === "ভাই" ? `ভাইয়া, স্বাগতম!` :
    `স্বাগতম!`;

  const expiryAlerts  = mockExpiryList.filter(m => m.daysLeft <= 7).length;
  const lowStockCount = mockExpiryList.filter(m => m.stock < 50).length;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6">

      {/* Hero Banner */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 55%, #047857 100%)" }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute top-4 right-16 w-16 h-16 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-white/70 text-xs font-medium">ফার্মেসি ড্যাশবোর্ড</p>
            <h2 className="text-white text-xl font-bold mt-0.5">{greeting}</h2>
            <p className="text-white/80 text-sm mt-0.5">{userName} — {shopName}</p>
          </div>
          <div className="flex gap-3 sm:gap-4">
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">আজকের বিক্রি</p>
              <p className="text-white text-2xl font-bold leading-none">{formatBDT(todaySales)}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">{todayOrderCount}টি বিক্রয়</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">মেয়াদ সতর্কতা</p>
              <p className="text-white text-2xl font-bold leading-none">{expiryAlerts}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">৭ দিনের মধ্যে</p>
            </div>
            <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
              <p className="text-white text-[11px] font-bold uppercase tracking-wider mb-1.5">কম স্টক</p>
              <p className="text-white text-2xl font-bold leading-none">{lowStockCount}</p>
              <p className="text-white/80 text-[11px] mt-1.5 font-medium">পণ্য কম আছে</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1">
        {[
          { href: "/pos",            icon: ShoppingBag,    label: "দ্রুত বিক্রয়",   color: "#10B981", bg: "#ECFDF5" },
          { href: "/medicines",      icon: Pill,           label: "ওষুধ স্টক",       color: "#3B82F6", bg: "#EFF6FF" },
          { href: "/expiry",         icon: AlertTriangle,  label: "মেয়াদ চেক",       color: "#EF4444", bg: "#FEF2F2" },
          { href: "/prescriptions",  icon: TrendingUp,     label: "প্রেসক্রিপশন",   color: "#8B5CF6", bg: "#F5F3FF" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-3 px-5 py-4 rounded-2xl border flex-shrink-0 transition-all hover:scale-[1.04] hover:shadow-md active:scale-95"
            style={{ backgroundColor: S.surface, borderColor: S.border, minWidth: "90px" }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ backgroundColor: a.bg }}>
              <a.icon size={19} style={{ color: a.color }} />
            </div>
            <span className="text-[11px] font-bold text-center leading-tight whitespace-nowrap" style={{ color: S.muted }}>{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "আজকের বিক্রি",    value: formatBDT(todaySales),             sub: `${todayOrderCount}টি বিক্রয়`,           color: "#10B981", bg: "#ECFDF5" },
          { label: "মেয়াদ সতর্কতা",  value: `${expiryAlerts}টি`,               sub: "৭ দিনের মধ্যে মেয়াদ শেষ",              color: "#EF4444", bg: "#FEF2F2" },
          { label: "কম স্টক",         value: `${lowStockCount}টি`,              sub: "পণ্য রিঅর্ডার করুন",                    color: "#F59E0B", bg: "#FFFBEB" },
          { label: "আজকের লাভ",       value: formatBDT(todayProfit),            sub: todayProfit >= 0 ? "ইনকাম বেশি" : "লোকসান", color: "#3B82F6", bg: "#EFF6FF" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5" style={{ backgroundColor: stat.bg }}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stat.color }} />
            </div>
            <p className="text-[11px] mb-1" style={{ color: S.muted }}>{stat.label}</p>
            <p className="text-lg font-bold" style={{ color: S.text }}>{stat.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Expiry Alert List */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FEF2F2" }}>
              <AlertTriangle size={16} style={{ color: "#EF4444" }} />
            </div>
            <h3 className="font-bold text-sm" style={{ color: S.text }}>৭ দিনের মধ্যে মেয়াদ শেষ হবে</h3>
          </div>
          <Link href="/expiry" className="text-xs font-medium" style={{ color: "#10B981" }}>সব দেখুন →</Link>
        </div>

        <div className="space-y-2">
          {mockExpiryList.filter(m => m.daysLeft <= 7).map((med, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl border"
              style={{
                backgroundColor: "#FEF2F2",
                borderColor:     "#FECACA",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#FEE2E2" }}
                >
                  <Pill size={14} style={{ color: "#EF4444" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{med.name}</p>
                  <p className="text-[11px]" style={{ color: S.muted }}>মেয়াদ: {med.expiry} • স্টক: {med.stock} পিস</p>
                </div>
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: med.daysLeft <= 3 ? "#EF4444" : med.daysLeft <= 7 ? "#F59E0B" : "#10B981",
                  color: "#fff",
                }}
              >
                {med.daysLeft}দিন
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-[11px] mt-3 pt-3 border-t" style={{ color: S.muted, borderColor: S.border }}>
          * Mock data — real expiry data শীঘ্রই যুক্ত হবে
        </p>
      </div>
    </div>
  );
}
