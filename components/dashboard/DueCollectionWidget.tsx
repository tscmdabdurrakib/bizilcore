import Link from "next/link";
import { Wallet, MessageCircle, Phone } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { T } from "@/lib/theme";
import Card from "@/components/ui/Card";

interface Debtor {
  id: string;
  name: string;
  phone: string | null;
  dueAmount: number;
}

interface Props {
  totalDue: number;
  shopName: string;
  debtors: Debtor[];
}

function waLink(phone: string, name: string, due: number, shopName: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  const intl = digits.startsWith("0") ? `88${digits}` : digits;
  const message =
    `আস্সালামু আলাইকুম ${name}!\n\n` +
    `${shopName} থেকে জানানো হচ্ছে, আপনার কাছে ৳${due.toLocaleString("en-IN")} বাকি রয়েছে। ` +
    `সুবিধামতো পরিশোধ করার অনুরোধ রইলো।\n\nধন্যবাদ! 🙏`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

export default function DueCollectionWidget({ totalDue, shopName, debtors }: Props) {
  if (debtors.length === 0) return null;

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: T.danger.iconBg }}>
            <Wallet size={15} style={{ color: T.danger.iconText }} />
          </div>
          <div>
            <h3 className="font-bold text-sm font-display" style={{ color: "var(--c-text)" }}>বাকি আদায়</h3>
            <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>মোট পাওনা {formatBDT(totalDue)}</p>
          </div>
        </div>
        <Link href="/customers?sort=due" className="text-xs font-semibold" style={{ color: "var(--c-primary)" }}>সব দেখুন →</Link>
      </div>

      <div className="space-y-2">
        {debtors.map((c) => {
          const initial = (c.name || "?")[0].toUpperCase();
          return (
            <div
              key={c.id}
              className="flex items-center gap-3 p-2.5 rounded-2xl border card-premium"
              style={{ borderColor: "var(--c-border)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                style={{ backgroundColor: T.danger.text }}
              >
                {initial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{c.name}</p>
                <p className="text-xs font-bold" style={{ color: T.danger.text }}>{formatBDT(c.dueAmount)} বাকি</p>
              </div>
              {c.phone && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <a
                    href={waLink(c.phone, c.name, c.dueAmount, shopName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ backgroundColor: T.success.iconBg }}
                    title="WhatsApp এ রিমাইন্ডার"
                  >
                    <MessageCircle size={15} style={{ color: T.success.iconText }} />
                  </a>
                  <a
                    href={`tel:${c.phone}`}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ backgroundColor: T.info.iconBg }}
                    title="কল করুন"
                  >
                    <Phone size={14} style={{ color: T.info.iconText }} />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
