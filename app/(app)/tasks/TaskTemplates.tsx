"use client";

import { useState } from "react";
import {
  X, Package, Truck, MessageCircle, Archive, Bookmark, Trash2, Search,
  CreditCard, RotateCcw, Users, Megaphone, Calculator, ShoppingBag, Star, ClipboardList,
} from "lucide-react";

export interface TaskTemplate {
  name: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  tags: string;
  subtasks: string[];
}

const CUSTOM_TEMPLATE_KEY = "bizilcore-task-templates";

function loadCustomTemplates(): TaskTemplate[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(CUSTOM_TEMPLATE_KEY) : null;
    if (raw) return JSON.parse(raw) as TaskTemplate[];
  } catch {}
  return [];
}

export function saveCustomTemplate(template: TaskTemplate) {
  const existing = loadCustomTemplates();
  const updated = [...existing.filter(t => t.name !== template.name), template];
  try { localStorage.setItem(CUSTOM_TEMPLATE_KEY, JSON.stringify(updated)); } catch {}
}

export function deleteCustomTemplate(name: string) {
  const existing = loadCustomTemplates();
  const updated = existing.filter(t => t.name !== name);
  try { localStorage.setItem(CUSTOM_TEMPLATE_KEY, JSON.stringify(updated)); } catch {}
}

const BUILTIN_TEMPLATES: Array<{
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  category: string;
  template: TaskTemplate;
}> = [
  {
    icon: <Package size={17} />,
    color: "#0F6E56",
    bgColor: "#E1F5EE",
    category: "অর্ডার",
    template: {
      name: "অর্ডার প্রসেস",
      title: "নতুন অর্ডার প্রসেস করুন",
      description: "নতুন অর্ডার পেয়েছি। নিচের ধাপ অনুসরণ করুন।",
      category: "order",
      priority: "high",
      tags: "অর্ডার, প্রসেস",
      subtasks: [
        "অর্ডার কনফার্ম করুন",
        "পেমেন্ট চেক করুন",
        "প্রোডাক্ট প্যাক করুন",
        "ডেলিভারি বুক করুন",
        "ট্র্যাকিং নম্বর পাঠান",
      ],
    },
  },
  {
    icon: <Truck size={17} />,
    color: "#1D4ED8",
    bgColor: "#DBEAFE",
    category: "ডেলিভারি",
    template: {
      name: "ডেলিভারি ফলো-আপ",
      title: "ডেলিভারি স্ট্যাটাস ফলো-আপ",
      description: "ডেলিভারি স্ট্যাটাস চেক করুন এবং কাস্টমারকে আপডেট দিন।",
      category: "delivery",
      priority: "medium",
      tags: "ডেলিভারি, ফলো-আপ, ট্র্যাকিং",
      subtasks: [
        "কুরিয়ার ট্র্যাকিং চেক করুন",
        "ডেলিভারি স্ট্যাটাস কাস্টমারকে জানান",
        "সমস্যা থাকলে কুরিয়ারে যোগাযোগ করুন",
        "ডেলিভারি কমপ্লিট হলে রেটিং নিন",
      ],
    },
  },
  {
    icon: <MessageCircle size={17} />,
    color: "#DC2626",
    bgColor: "#FEE2E2",
    category: "সাপোর্ট",
    template: {
      name: "অভিযোগ সমাধান",
      title: "কাস্টমার অভিযোগ সমাধান",
      description: "কাস্টমারের অভিযোগ গ্রহণ করেছি। নিচের ধাপে সমাধান করুন।",
      category: "order",
      priority: "urgent",
      tags: "অভিযোগ, কাস্টমার-সার্ভিস",
      subtasks: [
        "অভিযোগের বিস্তারিত লিখুন",
        "কাস্টমারের সাথে যোগাযোগ করুন",
        "সমাধানের পদক্ষেপ নিন",
        "রিফান্ড/রিপ্লেসমেন্ট প্রসেস করুন (যদি প্রয়োজন)",
        "সমাধান নিশ্চিত করুন",
      ],
    },
  },
  {
    icon: <Archive size={17} />,
    color: "#CA8A04",
    bgColor: "#FEF9C3",
    category: "স্টক",
    template: {
      name: "স্টক রিফিল",
      title: "স্টক রিফিল অর্ডার",
      description: "স্টক শেষ হওয়ার আগেই সাপ্লায়ারকে অর্ডার দিন।",
      category: "supplier",
      priority: "high",
      tags: "স্টক, সাপ্লায়ার, রিফিল",
      subtasks: [
        "কোন প্রোডাক্টের স্টক কম চেক করুন",
        "সাপ্লায়ারের সাথে যোগাযোগ করুন",
        "পরিমাণ নির্ধারণ করুন",
        "অর্ডার দিন",
        "ডেলিভারি নিশ্চিত করুন",
      ],
    },
  },
  {
    icon: <CreditCard size={17} />,
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    category: "পেমেন্ট",
    template: {
      name: "পেমেন্ট কনফার্মেশন",
      title: "অগ্রিম পেমেন্ট যাচাই করুন",
      description: "bKash/Nagad পেমেন্ট পেয়েছি, যাচাই করে অর্ডার কনফার্ম করুন।",
      category: "finance",
      priority: "high",
      tags: "পেমেন্ট, bKash, Nagad",
      subtasks: [
        "ট্রানজেকশন আইডি চেক করুন",
        "পরিমাণ মিলিয়ে দেখুন",
        "কাস্টমারকে কনফার্মেশন পাঠান",
        "অর্ডার প্রসেস শুরু করুন",
      ],
    },
  },
  {
    icon: <RotateCcw size={17} />,
    color: "#EA580C",
    bgColor: "#FFEDD5",
    category: "রিটার্ন",
    template: {
      name: "রিটার্ন/রিফান্ড",
      title: "রিটার্ন ও রিফান্ড প্রসেস",
      description: "কাস্টমার পণ্য ফেরত দিতে চায়। নিচের ধাপে প্রসেস করুন।",
      category: "order",
      priority: "urgent",
      tags: "রিটার্ন, রিফান্ড, কাস্টমার",
      subtasks: [
        "রিটার্নের কারণ জানুন",
        "পণ্যের ছবি নিন",
        "রিটার্ন পিকআপ বুক করুন",
        "পণ্য ফেরত পেলে চেক করুন",
        "রিফান্ড/এক্সচেঞ্জ প্রসেস করুন",
        "কাস্টমারকে নিশ্চিত করুন",
      ],
    },
  },
  {
    icon: <Users size={17} />,
    color: "#0891B2",
    bgColor: "#CFFAFE",
    category: "কাস্টমার",
    template: {
      name: "কাস্টমার ফলো-আপ",
      title: "ডেলিভারি-পরবর্তী কাস্টমার ফলো-আপ",
      description: "পণ্য পৌঁছানোর পর কাস্টমারের অভিজ্ঞতা জানুন।",
      category: "order",
      priority: "low",
      tags: "কাস্টমার, ফলো-আপ, রিভিউ",
      subtasks: [
        "ডেলিভারি কনফার্ম করুন",
        "পণ্যের মান নিয়ে জিজ্ঞেস করুন",
        "ফেসবুক রিভিউ চান",
        "পরবর্তী অর্ডারের জন্য অফার দিন",
      ],
    },
  },
  {
    icon: <Megaphone size={17} />,
    color: "#DB2777",
    bgColor: "#FCE7F3",
    category: "মার্কেটিং",
    template: {
      name: "ফেসবুক প্রোমোশন",
      title: "ফেসবুক পেজে পণ্য প্রোমোশন",
      description: "নতুন পণ্য বা অফার ফেসবুকে পোস্ট করুন।",
      category: "marketing",
      priority: "medium",
      tags: "ফেসবুক, পোস্ট, মার্কেটিং",
      subtasks: [
        "পণ্যের সুন্দর ছবি তুলুন/এডিট করুন",
        "আকর্ষণীয় ক্যাপশন লিখুন",
        "মূল্য ও অফার উল্লেখ করুন",
        "পোস্ট সময়মতো শিডিউল করুন",
        "কমেন্টে রিপ্লাই দিন",
      ],
    },
  },
  {
    icon: <Calculator size={17} />,
    color: "#059669",
    bgColor: "#D1FAE5",
    category: "হিসাব",
    template: {
      name: "সাপ্তাহিক হিসাব",
      title: "সাপ্তাহিক আয়-ব্যয় হিসাব",
      description: "এই সপ্তাহের সকল আয়-ব্যয় হিসাব করুন।",
      category: "finance",
      priority: "medium",
      tags: "হিসাব, সাপ্তাহিক, ফাইন্যান্স",
      subtasks: [
        "মোট বিক্রয় হিসাব করুন",
        "পণ্যের খরচ বাদ দিন",
        "ডেলিভারি খরচ হিসাব করুন",
        "মোট মুনাফা বের করুন",
        "পেন্ডিং পেমেন্ট চেক করুন",
        "হিসাব রেকর্ড সংরক্ষণ করুন",
      ],
    },
  },
  {
    icon: <ShoppingBag size={17} />,
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    category: "পণ্য",
    template: {
      name: "নতুন পণ্য লঞ্চ",
      title: "নতুন পণ্য বাজারে আনুন",
      description: "নতুন পণ্য স্টকে যোগ করে ফেসবুকে প্রচার করুন।",
      category: "product",
      priority: "high",
      tags: "পণ্য, লঞ্চ, নতুন",
      subtasks: [
        "পণ্যের বিবরণ লিখুন",
        "মূল্য নির্ধারণ করুন",
        "স্টকে যোগ করুন",
        "প্রোডাক্ট ছবি তুলুন",
        "ফেসবুকে পোস্ট করুন",
        "প্রথম ৫ ক্রেতাকে বিশেষ ছাড় দিন",
      ],
    },
  },
  {
    icon: <Star size={17} />,
    color: "#CA8A04",
    bgColor: "#FEF9C3",
    category: "সাপ্লায়ার",
    template: {
      name: "সাপ্লায়ার পেমেন্ট",
      title: "সাপ্লায়ারকে বকেয়া পেমেন্ট করুন",
      description: "সাপ্লায়ারের বকেয়া টাকা পরিশোধ করুন।",
      category: "finance",
      priority: "high",
      tags: "সাপ্লায়ার, পেমেন্ট, বকেয়া",
      subtasks: [
        "বকেয়া পরিমাণ যাচাই করুন",
        "পেমেন্ট পদ্ধতি নির্ধারণ করুন",
        "পেমেন্ট পাঠান",
        "রসিদ সংরক্ষণ করুন",
        "সাপ্লায়ারকে কনফার্ম করুন",
      ],
    },
  },
  {
    icon: <ClipboardList size={17} />,
    color: "#0F6E56",
    bgColor: "#E1F5EE",
    category: "রিপোর্ট",
    template: {
      name: "মাসিক রিপোর্ট",
      title: "মাসিক ব্যবসায়িক রিপোর্ট তৈরি",
      description: "এই মাসের সামগ্রিক ব্যবসায়িক কার্যক্ষমতা বিশ্লেষণ করুন।",
      category: "finance",
      priority: "medium",
      tags: "রিপোর্ট, মাসিক, বিশ্লেষণ",
      subtasks: [
        "মোট অর্ডার সংখ্যা গণনা করুন",
        "আয়-ব্যয় বিশ্লেষণ করুন",
        "সবচেয়ে বেশি বিক্রিত পণ্য চিহ্নিত করুন",
        "রিটার্ন/অভিযোগের সংখ্যা যাচাই করুন",
        "পরের মাসের লক্ষ্যমাত্রা নির্ধারণ করুন",
      ],
    },
  },
];

const CATEGORIES: Array<{ label: string; icon: React.ReactNode }> = [
  { label: "সব", icon: <ClipboardList size={13} /> },
  { label: "অর্ডার", icon: <Package size={13} /> },
  { label: "ডেলিভারি", icon: <Truck size={13} /> },
  { label: "সাপোর্ট", icon: <MessageCircle size={13} /> },
  { label: "স্টক", icon: <Archive size={13} /> },
  { label: "পেমেন্ট", icon: <CreditCard size={13} /> },
  { label: "রিটার্ন", icon: <RotateCcw size={13} /> },
  { label: "কাস্টমার", icon: <Users size={13} /> },
  { label: "মার্কেটিং", icon: <Megaphone size={13} /> },
  { label: "হিসাব", icon: <Calculator size={13} /> },
  { label: "পণ্য", icon: <ShoppingBag size={13} /> },
  { label: "সাপ্লায়ার", icon: <Star size={13} /> },
  { label: "রিপোর্ট", icon: <ClipboardList size={13} /> },
];

interface Props {
  onSelect: (template: TaskTemplate) => void;
  onClose: () => void;
}

export default function TaskTemplatesModal({ onSelect, onClose }: Props) {
  const [customTemplates, setCustomTemplates] = useState<TaskTemplate[]>(loadCustomTemplates);
  const [activeCategory, setActiveCategory] = useState("সব");
  const [search, setSearch] = useState("");

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
  };

  const handleDeleteCustom = (name: string) => {
    deleteCustomTemplate(name);
    setCustomTemplates(loadCustomTemplates());
  };

  const filtered = BUILTIN_TEMPLATES.filter(t => {
    const matchCat = activeCategory === "সব" || t.category === activeCategory;
    const matchSearch = !search || t.template.name.includes(search) || t.template.title.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border overflow-hidden flex flex-col"
        style={{ backgroundColor: S.surface, borderColor: S.border, height: "82vh", maxHeight: "640px" }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header (fixed) ── */}
        <div
          className="px-5 py-4 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, var(--c-primary) 0%, #0a5540 100%)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-white">টাস্ক টেমপ্লেট</h2>
              <p className="text-[11px] text-white/70 mt-0.5">{BUILTIN_TEMPLATES.length}টি বিল্ট-ইন · একটি বেছে নিন</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <X size={18} className="text-white" />
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveCategory("সব"); }}
              placeholder="টেমপ্লেট খুঁজুন..."
              className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border-0 outline-none placeholder:text-white/40"
              style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}
            />
          </div>
        </div>

        {/* ── Body: sidebar + content (single scrollable zone) ── */}
        <div className="flex flex-1 min-h-0">

          {/* Left sidebar — categories (no scrollbar) */}
          <div
            className="w-36 flex-shrink-0 flex flex-col border-r py-2"
            style={{ borderColor: S.border, backgroundColor: "#F7F6F2" }}
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => { setActiveCategory(cat.label); setSearch(""); }}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left transition-colors relative"
                style={{
                  color: activeCategory === cat.label ? "var(--c-primary)" : S.muted,
                  backgroundColor: activeCategory === cat.label ? "var(--c-primary-light)" : "transparent",
                  borderRight: activeCategory === cat.label ? "2px solid var(--c-primary)" : "2px solid transparent",
                }}
              >
                <span style={{ opacity: activeCategory === cat.label ? 1 : 0.6 }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right content — ONE scrollbar only */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: S.border }}>
                  <Search size={16} style={{ color: S.muted }} />
                </div>
                <p className="text-sm font-medium" style={{ color: S.muted }}>কোনো টেমপ্লেট পাওয়া যায়নি</p>
              </div>
            )}
            {filtered.map(t => (
              <button
                key={t.template.name}
                onClick={() => { onSelect(t.template); onClose(); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-md group"
                style={{ borderColor: S.border, backgroundColor: S.surface }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: t.bgColor, color: t.color }}
                >
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{t.template.name}</p>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: S.muted }}>
                    {t.template.subtasks.length}টি ধাপ · {t.template.title}
                  </p>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                  style={{ backgroundColor: t.bgColor, color: t.color }}
                >
                  {t.template.priority === "urgent" ? "জরুরি" : t.template.priority === "high" ? "হাই" : t.template.priority === "medium" ? "মিডিয়াম" : "লো"}
                </span>
              </button>
            ))}

            {/* Custom templates */}
            {customTemplates.length > 0 && activeCategory === "সব" && !search && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wider px-1 pt-3 pb-1" style={{ color: S.muted }}>আমার টেমপ্লেট</p>
                {customTemplates.map(t => (
                  <div
                    key={t.name}
                    className="flex items-center gap-2 p-3 rounded-xl border"
                    style={{ borderColor: S.border, backgroundColor: S.surface }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}
                    >
                      <Bookmark size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: S.text }}>{t.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: S.muted }}>
                        {t.subtasks?.length ?? 0}টি সাব-টাস্ক
                      </p>
                    </div>
                    <button
                      onClick={() => { onSelect(t); onClose(); }}
                      className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}
                    >
                      ব্যবহার
                    </button>
                    <button
                      onClick={() => handleDeleteCustom(t.name)}
                      className="p-1.5 rounded-lg hover:opacity-70 flex-shrink-0"
                    >
                      <Trash2 size={13} style={{ color: "#E24B4A" }} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
