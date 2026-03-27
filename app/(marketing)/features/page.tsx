import Link from "next/link";
import {
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Bell,
  TrendingUp,
  TrendingDown,
  Shield,
  Smartphone,
  SlidersHorizontal,
  Truck,
  FileText,
  MessageSquare,
  Download,
  Upload,
  UserCheck,
  Tags,
  Layers,
  RefreshCcw,
  CreditCard,
  Search,
  Globe,
  Barcode,
  PieChart,
  BookOpen,
  Settings,
  ArrowRight,
  CheckCircle2,
  Zap,
  Star,
  Clock,
  Calendar,
  LayoutGrid,
  Tag,
  Crown,
  CalendarDays,
  ListTodo,
  Wallet,
  Image,
  KeyRound,
  CalendarClock,
} from "lucide-react";

const C = {
  primary: "#0F6E56",
  primaryDark: "#0A5240",
  primaryLight: "#E1F5EE",
  bg: "#F7F6F2",
  surface: "#FFFFFF",
  border: "#E8E6DF",
  text: "#1A1A18",
  textSub: "#5A5A56",
  textMuted: "#A8A69E",
};

const categories = [
  {
    id: "stock",
    label: "স্টক ও ইনভেন্টরি",
    icon: Package,
    color: "#059669",
    bg: "#ECFDF5",
    features: [
      {
        icon: Package,
        title: "Product Variant ট্র্যাকিং",
        desc: "Size (S/M/L/XL) ও Color অনুযায়ী আলাদা স্টক রাখুন। প্রতিটি variant এর আলাদা দাম ও স্টক।",
        highlight: true,
      },
      {
        icon: Barcode,
        title: "SKU ও Barcode",
        desc: "প্রতিটি পণ্যে unique SKU ও barcode। Barcode scanner দিয়ে সহজে খুঁজুন।",
        highlight: false,
      },
      {
        icon: Bell,
        title: "Low Stock Alert",
        desc: "নির্দিষ্ট সংখ্যার নিচে গেলে তাৎক্ষণিক notification। কখনো out-of-stock হবেন না।",
        highlight: false,
      },
      {
        icon: Upload,
        title: "CSV Bulk Import",
        desc: "হাজারো পণ্য একসাথে Excel/CSV থেকে import করুন। মিনিটের মধ্যে পুরো catalog সেট আপ।",
        highlight: false,
      },
      {
        icon: RefreshCcw,
        title: "স্টক Adjustment",
        desc: "Manual stock correction করুন কারণসহ। প্রতিটি change এর ইতিহাস সংরক্ষিত থাকে।",
        highlight: false,
      },
      {
        icon: Layers,
        title: "Category ও Tag",
        desc: "পণ্য সহজে গুছিয়ে রাখুন category ও tag দিয়ে। দ্রুত filter ও search করুন।",
        highlight: false,
      },
      {
        icon: Image,
        title: "পণ্যের ছবি (Business)",
        desc: "Business plan এ URL দিয়ে প্রতিটি পণ্যে সর্বোচ্চ ৫টি ছবি যোগ করুন। Catalog পেজে সুন্দরভাবে দেখাবে।",
        highlight: false,
        badge: "Business",
      },
    ],
  },
  {
    id: "orders",
    label: "অর্ডার ম্যানেজমেন্ট",
    icon: ShoppingCart,
    color: "#2563EB",
    bg: "#EFF6FF",
    features: [
      {
        icon: ShoppingCart,
        title: "সম্পূর্ণ Order Lifecycle",
        desc: "Pending → Confirmed → Processing → Shipped → Delivered → Returned — প্রতিটি ধাপ track করুন।",
        highlight: true,
      },
      {
        icon: CreditCard,
        title: "Payment ট্র্যাকিং",
        desc: "COD ও Advance payment আলাদাভাবে track করুন। কত টাকা পাওনা আছে এক নজরে দেখুন।",
        highlight: false,
      },
      {
        icon: FileText,
        title: "Invoice ও Due Date",
        desc: "Professional invoice auto-generate হবে। Due date, overdue badge, ও payment status সহ। Customer কে পাঠান বা print করুন।",
        highlight: false,
      },
      {
        icon: RefreshCcw,
        title: "Return Management",
        desc: "Return অর্ডার track করুন। কারণ ও refund হিসাব সব রেকর্ড হবে।",
        highlight: false,
      },
      {
        icon: Tags,
        title: "Discount ও Coupon",
        desc: "Order এ discount দিন বা coupon apply করুন। Special offer manage করুন সহজে।",
        highlight: false,
      },
      {
        icon: Globe,
        title: "Facebook Order Import",
        desc: "Facebook comment থেকে automatic order suggestion। Manual entry কমিয়ে সময় বাঁচান।",
        highlight: false,
      },
    ],
  },
  {
    id: "customers",
    label: "কাস্টমার ও সাপ্লায়ার",
    icon: Users,
    color: "#7C3AED",
    bg: "#F5F3FF",
    features: [
      {
        icon: Users,
        title: "Customer Profile",
        desc: "প্রতিটি customer এর নাম, ঠিকানা, ফোন, অর্ডার ইতিহাস ও বাকির হিসাব এক জায়গায়।",
        highlight: true,
      },
      {
        icon: BookOpen,
        title: "বাকি (Credit) ট্র্যাকিং",
        desc: "কার কাছে কত বাকি আছে auto-track হবে। Payment নিলে automatically কমে যাবে।",
        highlight: false,
      },
      {
        icon: MessageSquare,
        title: "Bulk WhatsApp Message",
        desc: "একসাথে অনেক customer কে WhatsApp message পাঠান। Offer, delivery update জানান।",
        highlight: false,
      },
      {
        icon: Search,
        title: "Customer Search ও Filter",
        desc: "নাম, ফোন বা এলাকা দিয়ে দ্রুত customer খুঁজুন। Regular buyer আলাদা করে দেখুন।",
        highlight: false,
      },
      {
        icon: Truck,
        title: "Supplier Management",
        desc: "সাপ্লায়ারের তথ্য, purchase ইতিহাস ও বাকি manage করুন। কার থেকে কী কিনেছেন track।",
        highlight: false,
      },
      {
        icon: TrendingUp,
        title: "Customer Analytics",
        desc: "কোন customer সবচেয়ে বেশি কেনেন, কোন এলাকায় বিক্রি বেশি — বিস্তারিত analysis।",
        highlight: false,
      },
    ],
  },
  {
    id: "finance",
    label: "ফিনান্স ও রিপোর্ট",
    icon: BarChart3,
    color: "#D97706",
    bg: "#FFFBEB",
    features: [
      {
        icon: BarChart3,
        title: "P&L (লাভ-ক্ষতি) রিপোর্ট",
        desc: "দৈনিক, সাপ্তাহিক ও মাসিক profit-loss রিপোর্ট। আয় ও ব্যয়ের সম্পূর্ণ চিত্র।",
        highlight: true,
      },
      {
        icon: BookOpen,
        title: "হিসাব বই (Daily Cashbook)",
        desc: "প্রতিদিনের income ও expense রেকর্ড রাখুন। Cash in hand সবসময় জানুন।",
        highlight: false,
      },
      {
        icon: PieChart,
        title: "Sales Analytics",
        desc: "কোন পণ্য সবচেয়ে বেশি বিক্রি, কোন সময়ে বিক্রি বেশি — visual chart এ দেখুন।",
        highlight: false,
      },
      {
        icon: Download,
        title: "Excel Export",
        desc: "যেকোনো report Excel/CSV তে export করুন। Accountant কে দিন বা নিজে বিশ্লেষণ করুন।",
        highlight: false,
      },
      {
        icon: Package,
        title: "Purchase ট্র্যাকিং",
        desc: "সাপ্লায়ার থেকে কী কিনেছেন, কত খরচ হয়েছে — সব purchase record এ থাকবে।",
        highlight: false,
      },
      {
        icon: TrendingUp,
        title: "Sales Target",
        desc: "মাসিক বিক্রির লক্ষ্য নির্ধারণ করুন। Dashboard এ progress দেখুন।",
        highlight: false,
      },
    ],
  },
  {
    id: "expenses",
    label: "খরচ ট্র্যাকিং",
    icon: TrendingDown,
    color: "#DC2626",
    bg: "#FEF2F2",
    badge: "নতুন",
    features: [
      {
        icon: TrendingDown,
        title: "বিজনেস খরচ ট্র্যাকার",
        desc: "অফিস ভাড়া, বেতন, utility, marketing — সব ধরনের খরচ আলাদাভাবে রেকর্ড করুন।",
        highlight: true,
      },
      {
        icon: Tag,
        title: "ক্যাটাগরি অনুযায়ী বিশ্লেষণ",
        desc: "৮টি ক্যাটাগরিতে খরচ ভাগ করুন। কোন খাতে কত খরচ হচ্ছে এক নজরে দেখুন।",
        highlight: false,
      },
      {
        icon: BarChart3,
        title: "খরচ vs আয় তুলনা",
        desc: "মাসিক খরচের বিপরীতে আয় কত — P&L রিপোর্টে স্বয়ংক্রিয়ভাবে যুক্ত হবে।",
        highlight: false,
      },
      {
        icon: Download,
        title: "Excel Export",
        desc: "যেকোনো সময়ের খরচের তালিকা Excel এ export করুন। Accountant কে দিন সহজে।",
        highlight: false,
      },
      {
        icon: Search,
        title: "ক্যাটাগরি ফিল্টার",
        desc: "নির্দিষ্ট ক্যাটাগরির খরচ আলাদা করে দেখুন। দ্রুত খুঁজুন ও বিশ্লেষণ করুন।",
        highlight: false,
      },
      {
        icon: PieChart,
        title: "মাসিক খরচের Chart",
        desc: "প্রতি মাসে কোন ক্যাটাগরিতে কত খরচ হয়েছে visual chart এ দেখুন। ট্রেন্ড বিশ্লেষণ করুন।",
        highlight: false,
      },
    ],
  },
  {
    id: "tasks",
    label: "টাস্ক ম্যানেজমেন্ট",
    icon: ListTodo,
    color: "#6366F1",
    bg: "#EEF2FF",
    badge: "নতুন",
    features: [
      {
        icon: LayoutGrid,
        title: "Kanban Board",
        desc: "করতে হবে → চলছে → রিভিউ → সম্পন্ন — visual Kanban board এ সব কাজ track করুন।",
        highlight: true,
      },
      {
        icon: CalendarDays,
        title: "Task Calendar",
        desc: "ক্যালেন্ডার ভিউতে deadline অনুযায়ী সব task দেখুন। কোনো deadline miss হবে না।",
        highlight: false,
      },
      {
        icon: Bell,
        title: "Priority ও Deadline",
        desc: "জরুরি/হাই/মিডিয়াম/লো — priority অনুযায়ী task সাজান। Deadline reminder পাবেন।",
        highlight: false,
      },
      {
        icon: Users,
        title: "Staff কে Task Assign",
        desc: "Team member কে task assign করুন। কে কোন কাজ করছে এক জায়গায় দেখুন।",
        highlight: false,
      },
      {
        icon: SlidersHorizontal,
        title: "ক্যাটাগরি ও ফিল্টার",
        desc: "অর্ডার, ডেলিভারি, সাপ্লায়ার, একাউন্টস — ক্যাটাগরি অনুযায়ী task ফিল্টার করুন। Saved preset সুবিধা।",
        highlight: false,
      },
      {
        icon: Download,
        title: "Task CSV Export ও রিপোর্ট",
        desc: "Task রিপোর্ট CSV তে export করুন। কত কাজ সম্পন্ন হয়েছে, টিমের productivity analytics দেখুন।",
        highlight: false,
      },
    ],
  },
  {
    id: "hr",
    label: "HR ও কর্মী ব্যবস্থাপনা",
    icon: Users,
    color: "#0F766E",
    bg: "#CCFBF1",
    badge: "নতুন",
    features: [
      {
        icon: Users,
        title: "কর্মী Overview ও প্রোফাইল",
        desc: "মোট কর্মী, সক্রিয়/নিষ্ক্রিয়, মাসিক বেতন খরচ — সব overview এক dashboard এ। পদবী, ফোন ও বিস্তারিত প্রোফাইল।",
        highlight: true,
      },
      {
        icon: Calendar,
        title: "উপস্থিতি ট্র্যাকিং",
        desc: "উপস্থিত/অনুপস্থিত/দেরি/ছুটি — প্রতিদিনের attendance রেকর্ড করুন। Check-in/out সময় রাখুন।",
        highlight: false,
      },
      {
        icon: Clock,
        title: "শিফট ম্যানেজমেন্ট",
        desc: "Morning/Evening শিফট তৈরি করুন। কার্যদিবস নির্ধারণ ও কর্মী নিয়োগ করুন সহজে।",
        highlight: false,
      },
      {
        icon: CreditCard,
        title: "বেতন ট্র্যাকিং",
        desc: "প্রতিটি কর্মীর মাসিক বেতন রেকর্ড করুন। মোট বেতন খরচ এক নজরে দেখুন।",
        highlight: false,
      },
      {
        icon: Calendar,
        title: "ছুটি ম্যানেজমেন্ট (Leave)",
        desc: "কর্মীর ছুটির আবেদন ও অনুমোদন track করুন। কে কোন দিন ছুটিতে ছিলেন রেকর্ড রাখুন।",
        highlight: false,
      },
      {
        icon: Download,
        title: "HR CSV Export ও রিপোর্ট",
        desc: "উপস্থিতি, বেতন ও ছুটির রিপোর্ট CSV/Excel এ export করুন। মাসিক সারাংশ এক ক্লিকে পাবেন।",
        highlight: false,
      },
    ],
  },
  {
    id: "courier",
    label: "কুরিয়ার ইন্টিগ্রেশন",
    icon: Truck,
    color: "#DC2626",
    bg: "#FEF2F2",
    features: [
      {
        icon: Truck,
        title: "১২টি Courier সংযুক্ত",
        desc: "Pathao, eCourier, Steadfast, RedX, Sundarban, Paperfly, CarryBee, Delivery Tiger, Karatoa, Janani, Sheba, SA Paribahan — সব বড় courier এক app এ।",
        highlight: true,
      },
      {
        icon: Zap,
        title: "এক-ক্লিক Booking",
        desc: "Order থেকে সরাসরি courier booking দিন। আলাদা app বা website এ যেতে হবে না।",
        highlight: false,
      },
      {
        icon: Search,
        title: "Parcel Tracking",
        desc: "Tracking number দিয়ে সরাসরি delivery status দেখুন। Customer কে update দিন।",
        highlight: false,
      },
      {
        icon: Wallet,
        title: "COD Tracker Dashboard",
        desc: "Courier রেমিটেন্স এর বিস্তারিত ট্র্যাক করুন। বকেয়া, overdue ও প্রাপ্ত COD আলাদাভাবে দেখুন।",
        highlight: false,
      },
      {
        icon: FileText,
        title: "Bulk Print Queue",
        desc: "একসাথে অনেক parcel এর slip print করুন। সময় বাঁচান, ভুল কমান।",
        highlight: false,
      },
      {
        icon: BarChart3,
        title: "Delivery Analytics",
        desc: "কোন courier দিয়ে কত delivery হয়েছে, success rate কত — সব data এক জায়গায়।",
        highlight: false,
      },
      {
        icon: KeyRound,
        title: "eCourier API Credentials (Business)",
        desc: "নিজস্ব eCourier API key ও secret দিয়ে সরাসরি booking করুন। Per-user credential সাপোর্ট — একাধিক seller একই app এ।",
        highlight: false,
        badge: "Business",
      },
    ],
  },
  {
    id: "system",
    label: "সিস্টেম ও অ্যাডমিন",
    icon: Settings,
    color: "#0891B2",
    bg: "#ECFEFF",
    features: [
      {
        icon: UserCheck,
        title: "Staff Management",
        desc: "Multiple staff যোগ করুন। Role-based permission দিন — কে কী দেখতে বা করতে পারবে।",
        highlight: true,
      },
      {
        icon: Globe,
        title: "পাবলিক Ecommerce Catalog",
        desc: "নিজস্ব URL এ ecommerce পেজ তৈরি করুন। QR কোড শেয়ার, WhatsApp অর্ডার বাটন ও product showcase।",
        highlight: false,
        badge: "Business",
      },
      {
        icon: Globe,
        title: "Multiple Facebook Page",
        desc: "একসাথে অনেক Facebook Page manage করুন। প্রতিটি page এর আলাদা order track।",
        highlight: false,
      },
      {
        icon: Shield,
        title: "Activity Log",
        desc: "কোন staff কী করেছে সব record থাকে। Unauthorized change হলে সাথে সাথে জানুন।",
        highlight: false,
      },
      {
        icon: Bell,
        title: "In-app Notification",
        desc: "New order, low stock, payment — সব important event এর notification পাবেন।",
        highlight: false,
      },
      {
        icon: Shield,
        title: "Dark Mode",
        desc: "রাতে কাজ করুন আরামে। এক ক্লিকে dark/light mode switch করুন।",
        highlight: false,
      },
      {
        icon: Smartphone,
        title: "Mobile Friendly",
        desc: "যেকোনো স্মার্টফোন থেকে সম্পূর্ণ ব্যবহারযোগ্য। আলাদা app লাগবে না — browser এই চলবে।",
        highlight: false,
      },
    ],
  },
];

const allFeatures = [
  "Product Variants (Size/Color)", "SKU ও Barcode", "Low Stock Alert", "CSV Bulk Import",
  "পণ্যের ছবি (Business)", "অর্ডার Lifecycle Track", "Invoice ও Due Date", "Return Management", "COD Tracking",
  "Customer Profile", "বাকি ট্র্যাকিং", "Bulk WhatsApp", "Supplier Management",
  "P&L Report", "হিসাব বই", "Excel Export", "Sales Analytics",
  "Pathao Integration", "eCourier Integration", "eCourier API Credentials (Business)", "RedX Integration", "Steadfast Integration", "CarryBee Integration", "Delivery Tiger Integration", "Karatoa KCS Integration", "Janani Express Integration", "Sheba Delivery Integration", "SA Paribahan Integration",
  "Staff Management", "Role Permission", "Activity Log", "Multiple Facebook Page",
  "Dark Mode", "Mobile Friendly", "In-app Notification", "Facebook Comment Import",
  "Purchase Tracking", "Sales Target", "Discount & Coupon", "Delivery Analytics",
  "খরচ ট্র্যাকার", "ক্যাটাগরি ভিত্তিক খরচ", "Kanban Task Board", "Task Calendar",
  "Task Priority & Deadline", "Task Template", "Task CSV Export", "Staff Task Assignment",
  "কর্মী উপস্থিতি ট্র্যাকিং", "শিফট ম্যানেজমেন্ট", "বেতন ট্র্যাকিং", "HR মাসিক রিপোর্ট",
  "পাবলিক Catalog পেজ (Business)", "COD Tracker Dashboard", "Supplier Ledger", "Paperfly Integration",
];

export default function FeaturesPage() {
  return (
    <div style={{ backgroundColor: C.bg }}>

      {/* Hero */}
      <section
        style={{ background: `linear-gradient(135deg, #0A5240 0%, #0F6E56 60%, #1A9472 100%)` }}
        className="relative overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 bg-white" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 bg-white/20 text-white border border-white/30">
            <Star size={12} className="fill-current" />
            Production-Ready Features
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5">
            BizilCore এর সব ফিচার
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            বাংলাদেশের Facebook seller দের জন্য বিশেষভাবে তৈরি। স্টক থেকে কুরিয়ার, HR থেকে task — সব এক জায়গায়।
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white font-semibold transition-all hover:bg-green-50"
              style={{ color: C.primary }}
            >
              বিনামূল্যে শুরু করুন <ArrowRight size={16} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-medium border border-white/40 text-white hover:bg-white/10 transition-all"
            >
              প্ল্যান দেখুন
            </Link>
          </div>
        </div>
      </section>

      {/* Quick feature count */}
      <section style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { value: "৫৫+", label: "Total Features" },
              { value: "১২টি", label: "Courier Integration" },
              { value: "৩টি", label: "Subscription Plan" },
              { value: "১০০%", label: "Bangla UI" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold mb-0.5" style={{ color: C.primary }}>{s.value}</p>
                <p className="text-sm" style={{ color: C.textSub }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature categories */}
      {categories.map((cat, catIdx) => (
        <section
          key={cat.id}
          style={{ backgroundColor: catIdx % 2 === 0 ? C.bg : C.surface }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            {/* Category header */}
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.bg }}>
                <cat.icon size={22} style={{ color: cat.color }} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold" style={{ color: C.text }}>{cat.label}</h2>
                  {"badge" in cat && cat.badge && (
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: cat.color, color: "#fff" }}
                    >
                      {cat.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm" style={{ color: C.textSub }}>{cat.features.length}টি ফিচার</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.features.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl p-5 border relative"
                  style={{
                    backgroundColor: f.highlight ? cat.bg : C.surface,
                    borderColor: f.highlight ? cat.color + "40" : C.border,
                  }}
                >
                  {f.highlight && (
                    <span
                      className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: cat.color, color: "#fff" }}
                    >
                      মূল ফিচার
                    </span>
                  )}
                  {"badge" in f && f.badge && !f.highlight && (
                    <span
                      className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ backgroundColor: "#EF9F27", color: "#fff" }}
                    >
                      <Crown size={10} />
                      {f.badge}
                    </span>
                  )}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: cat.bg }}
                  >
                    <f.icon size={18} style={{ color: cat.color }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-1.5" style={{ color: C.text }}>{f.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: C.textSub }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Complete feature list */}
      <section style={{ backgroundColor: C.surface }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>সম্পূর্ণ ফিচার তালিকা</h2>
            <p className="text-sm" style={{ color: C.textSub }}>সব ফিচার এক নজরে</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {allFeatures.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 border"
                style={{ backgroundColor: C.bg, borderColor: C.border }}
              >
                <CheckCircle2 size={13} style={{ color: C.primary }} className="flex-shrink-0" />
                <span className="text-xs" style={{ color: C.text }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose BizilCore */}
      <section style={{ backgroundColor: C.bg }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>কেন BizilCore বেছে নেবেন?</h2>
            <p style={{ color: C.textSub }}>অন্য বিকল্পের চেয়ে কোথায় আলাদা</p>
          </div>
          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: C.border }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: C.primary }}>
                  <th className="text-left px-6 py-4 text-white font-semibold">ফিচার</th>
                  <th className="px-6 py-4 text-white font-semibold text-center">BizilCore</th>
                  <th className="px-6 py-4 text-white/70 font-semibold text-center">Excel/Google Sheet</th>
                  <th className="px-6 py-4 text-white/70 font-semibold text-center">সাধারণ POS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Facebook অর্ডার Import", true, false, false],
                  ["Courier Integration", true, false, false],
                  ["Product Variant ট্র্যাকিং", true, "manual", true],
                  ["Real-time Low Stock Alert", true, false, true],
                  ["Bulk WhatsApp Message", true, false, false],
                  ["Multiple Facebook Page", true, false, false],
                  ["P&L Report (Auto)", true, "manual", true],
                  ["HR ও Attendance Management", true, false, false],
                  ["Task Management (Kanban)", true, false, false],
                  ["Expense Tracker", true, "manual", false],
                  ["Public Ecommerce Catalog", true, false, false],
                  ["COD Tracker Dashboard", true, false, false],
                  ["Staff Management", true, false, "limited"],
                  ["Mobile Friendly", true, "partial", "partial"],
                  ["বাংলা ভাষা সাপোর্ট", true, false, "partial"],
                ].map(([label, bizilcore, excel, pos], i) => (
                  <tr
                    key={String(label)}
                    style={{ backgroundColor: i % 2 === 0 ? C.surface : C.bg }}
                  >
                    <td className="px-6 py-3.5 font-medium" style={{ color: C.text }}>{label}</td>
                    {[bizilcore, excel, pos].map((val, j) => (
                      <td key={j} className="px-6 py-3.5 text-center">
                        {val === true ? (
                          <span className="inline-flex justify-center">
                            <CheckCircle2 size={18} style={{ color: C.primary }} />
                          </span>
                        ) : val === false ? (
                          <span className="text-gray-300 text-xl">✗</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                            {val}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: `linear-gradient(135deg, #0A5240 0%, #0F6E56 60%, #1A9472 100%)` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            সব ফিচার বিনামূল্যে ব্যবহার করে দেখুন
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Free plan এ শুরু করুন। Credit card লাগবে না।
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white font-semibold text-lg hover:bg-green-50 transition-all shadow-lg"
              style={{ color: C.primary }}
            >
              বিনামূল্যে সাইনআপ করুন <ArrowRight size={20} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg border border-white/40 text-white hover:bg-white/10 transition-all"
            >
              প্ল্যান ও মূল্য দেখুন
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
