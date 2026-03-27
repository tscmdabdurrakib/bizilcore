"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "BizilCore কি বিনামূল্যে?",
    a: "হ্যাঁ, Free plan চিরকাল বিনামূল্যে। কোনো credit card লাগবে না।",
  },
  {
    q: "bKash এ payment দেওয়া যাবে?",
    a: "হ্যাঁ, bKash ও Nagad উভয় সাপোর্ট করে। সহজেই পেমেন্ট করুন।",
  },
  {
    q: "Mobile এ কাজ করবে?",
    a: "হ্যাঁ, সম্পূর্ণ mobile-friendly। Android ও iOS উভয় ব্রাউজারে চমৎকারভাবে কাজ করে।",
  },
  {
    q: "Data কি safe?",
    a: "হ্যাঁ, আপনার সব data encrypted ও secure server এ থাকে। আমরা কখনো তৃতীয় পক্ষের সাথে share করি না।",
  },
  {
    q: "Cancel করতে পারব?",
    a: "যেকোনো সময় cancel করা যাবে। কোনো hidden fee বা long-term commitment নেই।",
  },
];

export default function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "#E8E6DF" }}
        >
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left"
            style={{ backgroundColor: openIdx === i ? "#E1F5EE" : "#FFFFFF" }}
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
          >
            <span className="font-medium text-sm" style={{ color: "#1A1A18" }}>
              {faq.q}
            </span>
            <ChevronDown
              size={18}
              className="flex-shrink-0 ml-4 transition-transform"
              style={{
                color: "#0F6E56",
                transform: openIdx === i ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          {openIdx === i && (
            <div
              className="px-5 pb-4 text-sm leading-relaxed"
              style={{ color: "#5A5A56", backgroundColor: "#FFFFFF" }}
            >
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
