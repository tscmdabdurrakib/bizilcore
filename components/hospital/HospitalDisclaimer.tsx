"use client";

import { ShieldAlert } from "lucide-react";

export default function HospitalDisclaimer() {
  return (
    <div
      className="rounded-xl border px-4 py-3 flex items-start gap-3 text-xs"
      style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}
    >
      <ShieldAlert size={15} style={{ color: "#B45309" }} className="mt-0.5 flex-shrink-0" />
      <p style={{ color: "#92400E" }}>
        এই সফটওয়্যার শুধুমাত্র প্রশাসনিক ব্যবস্থাপনার জন্য।
        চিকিৎসা সংক্রান্ত যেকোনো সিদ্ধান্তের জন্য অবশ্যই
        যোগ্য ও নিবন্ধিত চিকিৎসকের পরামর্শ গ্রহণ করুন।
      </p>
    </div>
  );
}
