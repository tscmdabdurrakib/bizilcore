"use client";

import { useEffect, useState } from "react";
import { ShieldOff, Clock, Mail, Phone } from "lucide-react";

interface Props {
  accountStatus: string;
  statusReason?: string | null;
}

const CONFIG = {
  disabled: {
    icon: ShieldOff,
    iconColor: "#DC2626",
    iconBg: "#FEF2F2",
    title: "আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে",
    subtitle: "আপনার BizilCore অ্যাকাউন্ট বর্তমানে নিষ্ক্রিয় (Disabled) অবস্থায় রয়েছে।",
    badgeBg: "#FEE2E2",
    badgeColor: "#991B1B",
    badgeText: "অ্যাকাউন্ট নিষ্ক্রিয়",
    borderColor: "#FECACA",
  },
  suspended: {
    icon: Clock,
    iconColor: "#D97706",
    iconBg: "#FFFBEB",
    title: "আপনার অ্যাকাউন্ট সাময়িকভাবে স্থগিত",
    subtitle: "আপনার BizilCore অ্যাকাউন্ট সাময়িকভাবে (Suspended) স্থগিত করা হয়েছে।",
    badgeBg: "#FEF3C7",
    badgeColor: "#92400E",
    badgeText: "অ্যাকাউন্ট স্থগিত",
    borderColor: "#FDE68A",
  },
};

export default function AccountStatusModal({ accountStatus, statusReason }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (accountStatus === "disabled" || accountStatus === "suspended") {
      setVisible(true);
    }
  }, [accountStatus]);

  if (!visible) return null;

  const cfg = CONFIG[accountStatus as keyof typeof CONFIG];
  if (!cfg) return null;

  const Icon = cfg.icon;
  const isDismissible = accountStatus === "suspended";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-white">
        {/* Top banner */}
        <div className="px-6 pt-6 pb-5 text-center" style={{ borderBottom: `1px solid ${cfg.borderColor}` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: cfg.iconBg }}>
            <Icon size={32} style={{ color: cfg.iconColor }} />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ backgroundColor: cfg.badgeBg, color: cfg.badgeColor }}>
            {cfg.badgeText}
          </span>
          <h2 className="text-lg font-bold mb-2" style={{ color: "#1A1A18" }}>{cfg.title}</h2>
          <p className="text-sm" style={{ color: "#6B7280" }}>{cfg.subtitle}</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Reason */}
          {statusReason && (
            <div className="rounded-xl p-4" style={{ backgroundColor: "#F9FAFB", border: `1px solid #E5E7EB` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#374151" }}>কারণ:</p>
              <p className="text-sm" style={{ color: "#4B5563" }}>{statusReason}</p>
            </div>
          )}

          {/* How to fix */}
          <div className="rounded-xl p-4" style={{ backgroundColor: "#F0FDF4", border: `1px solid #BBF7D0` }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "#166534" }}>সমাধান করতে:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: "#166534" }}>
                <Mail size={14} />
                <span>আমাদের ইমেইল করুন: <strong>support@bizilcore.com</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: "#166534" }}>
                <Phone size={14} />
                <span>অথবা WhatsApp করুন: <strong>+880 1XXXXXXXXX</strong></span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <a href="mailto:support@bizilcore.com"
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold text-center"
              style={{ backgroundColor: "#0F6E56" }}>
              সাপোর্টে যোগাযোগ করুন
            </a>
            {isDismissible && (
              <button onClick={() => setVisible(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: "#D1D5DB", color: "#6B7280" }}>
                বন্ধ করুন
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
