import Link from "next/link";
import { UserPlus, MessageCircle, Repeat } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { T } from "@/lib/theme";
import Card from "@/components/ui/Card";

interface InactiveCustomer {
  id: string;
  name: string;
  phone: string | null;
  lastOrderAt: Date | string | null;
}

interface Props {
  newCustomers: number;
  repeatCustomers: number;
  customersWithOrders: number;
  shopName: string;
  inactiveCustomers: InactiveCustomer[];
}

function waLink(phone: string, name: string, shopName: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  const intl = digits.startsWith("0") ? `88${digits}` : digits;
  const message =
    `আস্সালামু আলাইকুম ${name}!\n\n` +
    `অনেকদিন আপনাকে দেখি না। ${shopName} এ নতুন পণ্য এসেছে — একবার ঘুরে যান! ` +
    `আপনার জন্য বিশেষ অফারও থাকতে পারে। 😊\n\nধন্যবাদ!`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export default function CustomerInsightWidget({
  newCustomers,
  repeatCustomers,
  customersWithOrders,
  shopName,
  inactiveCustomers,
}: Props) {
  const repeatRate = customersWithOrders > 0 ? Math.round((repeatCustomers / customersWithOrders) * 100) : 0;

  if (customersWithOrders === 0 && inactiveCustomers.length === 0) return null;

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: T.purple.iconBg }}>
            <Repeat size={15} style={{ color: T.purple.iconText }} />
          </div>
          <h3 className="font-bold text-sm font-display" style={{ color: "var(--c-text)" }}>গ্রাহক ইনসাইট</h3>
        </div>
        <Link href="/customers" className="text-xs font-semibold" style={{ color: "var(--c-primary)" }}>সব দেখুন →</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3 card-stat">
          <p className="text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1" style={{ color: T.info.text }}>
            <UserPlus size={11} /> নতুন গ্রাহক
          </p>
          <p className="text-lg font-bold mt-0.5 font-display" style={{ color: T.info.text }}>{newCustomers}জন</p>
          <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>এই মাসে</p>
        </div>
        <div className="rounded-xl p-3 card-stat">
          <p className="text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1" style={{ color: T.purple.text }}>
            <Repeat size={11} /> ফিরতি গ্রাহক
          </p>
          <p className="text-lg font-bold mt-0.5 font-display" style={{ color: T.purple.text }}>{repeatRate}%</p>
          <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{repeatCustomers}জন বারবার কেনেন</p>
        </div>
      </div>

      {inactiveCustomers.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: "var(--c-text-muted)" }}>নিষ্ক্রিয় গ্রাহক — ফিরিয়ে আনুন</p>
          <div className="space-y-2">
            {inactiveCustomers.map((c) => {
              const initial = (c.name || "?")[0].toUpperCase();
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-2.5 rounded-2xl border card-premium"
                  style={{ borderColor: "var(--c-border)" }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: T.purple.text }}
                  >
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{c.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--c-text-muted)" }}>
                      {c.lastOrderAt ? `শেষ অর্ডার: ${formatRelativeDate(c.lastOrderAt)}` : "অনেকদিন অর্ডার নেই"}
                    </p>
                  </div>
                  {c.phone && (
                    <a
                      href={waLink(c.phone, c.name, shopName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80 flex-shrink-0"
                      style={{ backgroundColor: T.success.iconBg }}
                      title="WhatsApp এ মেসেজ"
                    >
                      <MessageCircle size={15} style={{ color: T.success.iconText }} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
