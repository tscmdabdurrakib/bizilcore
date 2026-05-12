import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BookOpen,
  BarChart2,
  Navigation,
  ChefHat,
  UtensilsCrossed,
  Pill,
  FileText,
  AlertTriangle,
  Zap,
  Calendar,
  Scissors,
  Ruler,
  Shirt,
  UserCog,
  ClipboardList,
  Store,
  Globe,
  Layers,
  ScrollText,
  DollarSign,
  Palette,
  Image,
  Settings,
  Settings2,
  Tag,
  Star,
  Bed,
  BedDouble,
  Sparkles,
  CalendarRange,
  Wrench,
  Car,
  FlaskConical,
  TestTube2,
  Microscope,
  ClipboardCheck,
  PartyPopper,
  Building2,
  GalleryHorizontalEnd,
  GraduationCap,
  BookOpenCheck,
  CalendarCheck2,
  Receipt,
  ClipboardPen,
  Wheat,
  Tractor,
  Fish,
  BirdIcon,
  SproutIcon,
  ShoppingBasket,
  Stethoscope,
  Activity,
  HeartPulse,
  BedDouble as BedDoubleIcon,
  Plane,
  Ticket,
  MapPin,
  Stamp,
  HandCoins,
  Dumbbell,
  Camera,
  Droplets,
  Truck,
  Printer,
  Home,
  PawPrint,
  Smartphone,
  Fuel,
  Scale,
  Sparkle,
  Code2,
  Clock,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";

/* ─── Business Type ─────────────────────────────────────── */

export type BusinessType =
  | "fcommerce"
  | "restaurant"
  | "pharmacy"
  | "retail"
  | "salon"
  | "tailor"
  | "hotel"
  | "garage"
  | "lab"
  | "convention"
  | "school"
  | "farm"
  | "hospital"
  | "travel"
  | "gym"
  | "photography"
  | "laundry"
  | "printing"
  | "realestate"
  | "petshop"
  | "electronics"
  | "kindergarten"
  | "carrental"
  | "legal"
  | "spa"
  | "catering"
  | "freelance";

export const BUSINESS_TYPES: BusinessType[] = [
  "fcommerce",
  "restaurant",
  "pharmacy",
  "retail",
  "salon",
  "tailor",
  "hotel",
  "garage",
  "lab",
  "convention",
  "school",
  "farm",
  "hospital",
  "travel",
  "gym",
  "photography",
  "laundry",
  "printing",
  "realestate",
  "petshop",
  "electronics",
  "kindergarten",
  "carrental",
  "legal",
  "spa",
  "catering",
  "freelance",
];

export interface BusinessTypeMeta {
  type: BusinessType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
}

export const BUSINESS_TYPE_META: Record<BusinessType, BusinessTypeMeta> = {
  fcommerce: {
    type: "fcommerce",
    label: "F-Commerce",
    description: "Facebook / online এ পণ্য বেচি",
    color: "#1877F2",
    bgColor: "#EFF6FF",
    icon: Store,
  },
  restaurant: {
    type: "restaurant",
    label: "রেস্তোরাঁ",
    description: "খাবারের ব্যবসা করি",
    color: "#EF4444",
    bgColor: "#FEF2F2",
    icon: UtensilsCrossed,
  },
  pharmacy: {
    type: "pharmacy",
    label: "ফার্মেসি",
    description: "ওষুধের দোকান চালাই",
    color: "#10B981",
    bgColor: "#ECFDF5",
    icon: Pill,
  },
  retail: {
    type: "retail",
    label: "রিটেইল দোকান",
    description: "মুদি / কাপড় / অন্য দোকান",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    icon: ShoppingBag,
  },
  salon: {
    type: "salon",
    label: "সেলুন / পার্লার",
    description: "Beauty / grooming service দিই",
    color: "#EC4899",
    bgColor: "#FDF2F8",
    icon: Scissors,
  },
  tailor: {
    type: "tailor",
    label: "দর্জি / বুটিক",
    description: "কাপড় বানাই / সেলাই করি",
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    icon: Shirt,
  },
  hotel: {
    type: "hotel",
    label: "হোটেল / গেস্টহাউস",
    description: "রুম ভাড়া দিই বা গেস্ট ম্যানেজ করি",
    color: "#0F6E56",
    bgColor: "#E1F5EE",
    icon: BedDouble,
  },
  garage: {
    type: "garage",
    label: "গ্যারেজ / সার্ভিস সেন্টার",
    description: "গাড়ি মেরামত ও সার্ভিসিং করি",
    color: "#B45309",
    bgColor: "#FEF3C7",
    icon: Wrench,
  },
  lab: {
    type: "lab",
    label: "ল্যাব / ডায়াগনস্টিক",
    description: "রোগ নির্ণয় পরীক্ষা করি",
    color: "#0891B2",
    bgColor: "#ECFEFF",
    icon: FlaskConical,
  },
  convention: {
    type: "convention",
    label: "কনভেনশন হল / ইভেন্ট",
    description: "হল ভাড়া দিই বা ইভেন্ট ম্যানেজ করি",
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    icon: Building2,
  },
  school: {
    type: "school",
    label: "স্কুল / কোচিং সেন্টার",
    description: "শিক্ষার্থী ভর্তি ও ফি ব্যবস্থাপনা করি",
    color: "#2563EB",
    bgColor: "#EFF6FF",
    icon: GraduationCap,
  },
  farm: {
    type: "farm",
    label: "ফার্ম / কৃষি ব্যবসা",
    description: "চাষাবাদ, মৎস্য বা পশুপালন করি",
    color: "#16A34A",
    bgColor: "#F0FDF4",
    icon: Wheat,
  },
  hospital: {
    type: "hospital",
    label: "হাসপাতাল / ক্লিনিক",
    description: "রোগী দেখি ও চিকিৎসা সেবা দিই",
    color: "#378ADD",
    bgColor: "#EFF6FF",
    icon: Stethoscope,
  },
  travel: {
    type: "travel",
    label: "ট্রাভেল এজেন্সি",
    description: "ট্যুর প্যাকেজ ও টিকেট বুকিং করি",
    color: "#0891B2",
    bgColor: "#ECFEFF",
    icon: Plane,
  },
  gym: {
    type: "gym",
    label: "জিম / ফিটনেস সেন্টার",
    description: "সদস্যপদ ও ট্রেনিং ম্যানেজ করি",
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    icon: Dumbbell,
  },
  photography: {
    type: "photography",
    label: "ফটোগ্রাফি / ভিডিওগ্রাফি",
    description: "ফটো ও ভিডিও সেশন ম্যানেজ করি",
    color: "#DB2777",
    bgColor: "#FDF2F8",
    icon: Camera,
  },
  laundry: {
    type: "laundry",
    label: "লন্ড্রি / ড্রাইক্লিনিং",
    description: "কাপড় ধোয়া ও পরিষ্কার সেবা দিই",
    color: "#0284C7",
    bgColor: "#E0F2FE",
    icon: Droplets,
  },
  printing: {
    type: "printing",
    label: "প্রিন্টিং / প্রেস",
    description: "ছাপানো ও প্রিন্টিং সেবা দিই",
    color: "#7C3AED",
    bgColor: "#F5F3FF",
    icon: Printer,
  },
  realestate: {
    type: "realestate",
    label: "রিয়েল এস্টেট",
    description: "বাড়ি, ফ্ল্যাট বা জমি বিক্রি/ভাড়া দিই",
    color: "#0891B2",
    bgColor: "#E0F2FE",
    icon: Home,
  },
  petshop: {
    type: "petshop",
    label: "পেট শপ / ভেটেরিনারি",
    description: "পশু-পাখির সেবা ও পণ্য বিক্রি করি",
    color: "#EA580C",
    bgColor: "#FFF7ED",
    icon: PawPrint,
  },
  electronics: {
    type: "electronics",
    label: "ইলেকট্রনিক্স রিপেয়ার",
    description: "মোবাইল, ল্যাপটপ ও ইলেকট্রনিক্স মেরামত করি",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    icon: Smartphone,
  },
  kindergarten: {
    type: "kindergarten",
    label: "কিন্ডারগার্টেন / প্লে স্কুল",
    description: "ছোট শিশুদের পরিচর্যা ও শিক্ষা দিই",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    icon: GraduationCap,
  },
  carrental: {
    type: "carrental",
    label: "কার রেন্টাল / গাড়ি ভাড়া",
    description: "গাড়ি ভাড়া দিই ও ট্রিপ ম্যানেজ করি",
    color: "#DC2626",
    bgColor: "#FEF2F2",
    icon: Car,
  },
  legal: {
    type: "legal",
    label: "আইনি সেবা / চেম্বার",
    description: "আইনি পরামর্শ ও মামলা পরিচালনা করি",
    color: "#1D4ED8",
    bgColor: "#EFF6FF",
    icon: Scale,
  },
  spa: {
    type: "spa",
    label: "স্পা / ওয়েলনেস সেন্টার",
    description: "সৌন্দর্য ও সুস্থতা সেবা প্রদান করি",
    color: "#9333EA",
    bgColor: "#FAF5FF",
    icon: Sparkle,
  },
  catering: {
    type: "catering",
    label: "ক্যাটারিং সার্ভিস",
    description: "অনুষ্ঠানে খাবার সরবরাহ করি",
    color: "#EA580C",
    bgColor: "#FFF7ED",
    icon: ChefHat,
  },
  freelance: {
    type: "freelance",
    label: "IT / ফ্রিল্যান্স সার্ভিস",
    description: "ওয়েবসাইট, ডিজাইন বা IT সেবা দিই",
    color: "#6366F1",
    bgColor: "#EEF2FF",
    icon: Code2,
  },
};

/* ─── Sales Channel ─────────────────────────────────────── */

export type SalesChannel = "online" | "offline" | "both";

export const SALES_CHANNELS: SalesChannel[] = ["online", "offline", "both"];

export interface SalesChannelMeta {
  channel: SalesChannel;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
}

export const SALES_CHANNEL_META: Record<SalesChannel, SalesChannelMeta> = {
  online: {
    channel: "online",
    label: "অনলাইন",
    description: "Facebook / WhatsApp / Website এ বিক্রি করি",
    color: "#1877F2",
    bgColor: "#EFF6FF",
    icon: Globe,
  },
  offline: {
    channel: "offline",
    label: "অফলাইন",
    description: "সরাসরি দোকান বা ব্যক্তিগতভাবে বিক্রি করি",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    icon: Store,
  },
  both: {
    channel: "both",
    label: "উভয়ই",
    description: "Online ও Offline দুটো channel-এই বিক্রি করি",
    color: "#0F6E56",
    bgColor: "#E1F5EE",
    icon: Layers,
  },
};

/* Modules that only make sense for online selling */
const ONLINE_ONLY_MODULES = new Set(["courier", "facebook", "whatsapp"]);

/* Modules that only make sense for offline selling */
const OFFLINE_ONLY_MODULES = new Set(["pos"]);

/* ─── Module definitions per business type ───────────────── */

const BUSINESS_MODULES: Record<BusinessType, string[]> = {
  fcommerce: [
    "dashboard", "inventory", "orders", "customers",
    "hisab", "reports", "courier", "settings", "store",
  ],
  restaurant: [
    "dashboard", "inventory", "orders", "customers",
    "hisab", "reports", "tables", "kitchen", "menu", "staff", "courier", "settings", "store",
  ],
  pharmacy: [
    "dashboard", "inventory", "orders", "customers",
    "hisab", "reports", "prescriptions", "expiry", "pos", "courier", "settings", "store",
  ],
  retail: [
    "dashboard", "inventory", "pos", "cash-register", "orders", "customers",
    "hisab", "reports", "courier", "settings", "store",
  ],
  salon: [
    "dashboard", "services", "appointments", "inventory", "customers",
    "hisab", "reports", "staff", "settings", "store",
  ],
  tailor: [
    "dashboard", "inventory", "orders", "customers",
    "hisab", "reports", "measurements", "courier", "settings", "store",
  ],
  hotel: [
    "dashboard", "rooms", "bookings", "housekeeping", "customers",
    "hisab", "reports", "staff", "settings", "store",
  ],
  garage: [
    "dashboard", "jobcards", "vehicles", "inventory",
    "customers", "staff", "hisab", "reports", "settings",
  ],
  lab: [
    "dashboard", "tests", "testorders", "results", "patients",
    "appointments", "hisab", "reports", "settings",
  ],
  convention: [
    "dashboard", "halls", "events", "packages",
    "vendors", "customers", "hisab", "reports", "settings",
  ],
  school: [
    "dashboard", "students", "batches", "fees",
    "attendance", "exams", "staff", "hisab", "reports", "settings",
  ],
  farm: [
    "dashboard", "lands", "crops", "livestock",
    "harvest", "buyers", "hisab", "reports", "settings",
  ],
  hospital: [
    "dashboard", "doctors", "opd", "ipd", "patients",
    "billing", "staff", "hisab", "reports", "settings",
  ],
  travel: [
    "dashboard", "packages", "bookings", "customers",
    "vendors", "visa", "hisab", "reports", "settings",
  ],
  gym: [
    "dashboard", "members", "memberships", "attendance",
    "trainers", "equipment", "hisab", "reports", "settings",
  ],
  photography: [
    "dashboard", "bookings", "packages", "portfolio",
    "equipment", "customers", "hisab", "reports", "settings",
  ],
  laundry: [
    "dashboard", "orders", "services", "customers",
    "delivery", "hisab", "reports", "settings",
  ],
  printing: [
    "dashboard", "orders", "services", "customers",
    "inventory", "hisab", "reports", "settings",
  ],
  realestate: [
    "dashboard", "properties", "leads", "deals",
    "clients", "owners", "hisab", "reports", "settings",
  ],
  petshop: [
    "dashboard", "pets", "appointments", "inventory",
    "customers", "hisab", "reports", "settings",
  ],
  electronics: [
    "dashboard", "jobcards", "devices", "inventory",
    "customers", "staff", "hisab", "reports", "settings",
  ],
  kindergarten: [
    "dashboard", "children", "classes", "attendance",
    "meals", "fees", "daily_report", "hisab", "reports", "settings",
  ],
  carrental: [
    "dashboard", "fleet", "bookings", "drivers",
    "fuel", "customers", "hisab", "reports", "settings",
  ],
  legal: [
    "dashboard", "cases", "clients", "hearings",
    "documents", "fees", "hisab", "reports", "settings",
  ],
  spa: [
    "dashboard", "appointments", "services", "rooms",
    "therapists", "customers", "hisab", "reports", "settings",
  ],
  catering: [
    "dashboard", "events", "menus", "ingredients",
    "staff", "customers", "hisab", "reports", "settings",
  ],
  freelance: [
    "dashboard", "projects", "clients", "invoices",
    "timelog", "hisab", "reports", "settings",
  ],
};

/* ─── Nav items ──────────────────────────────────────────── */

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  module: string;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

const STORE_NAV_GROUP: NavGroup = {
  label: "আমার স্টোর",
  items: [
    { href: "/store/setup", icon: Store, label: "সেটআপ", module: "store" },
    { href: "/store/theme", icon: Palette, label: "থিম", module: "store" },
    { href: "/store/appearance", icon: Image, label: "লুক ও ফিল", module: "store" },
    { href: "/store/products", icon: Package, label: "পণ্য", module: "store" },
    { href: "/store/settings", icon: Settings2, label: "সেটিংস", module: "store" },
    { href: "/store/orders", icon: ShoppingBag, label: "অর্ডার", module: "store" },
    { href: "/store/coupons", icon: Tag, label: "কুপন", module: "store" },
    { href: "/store/reviews", icon: Star, label: "রিভিউ", module: "store" },
    { href: "/dashboard/store/analytics", icon: BarChart2, label: "অ্যানালিটিক্স", module: "store" },
  ],
};

const NAV_BY_TYPE: Record<BusinessType, NavGroup[]> = {
  fcommerce: [
    {
      items: [
        { href: "/dashboard",      icon: LayoutDashboard, label: "ড্যাশবোর্ড",    module: "dashboard"  },
        { href: "/orders",         icon: ShoppingBag,     label: "অর্ডার",         module: "orders"     },
        { href: "/inventory",      icon: Package,         label: "পণ্য ও স্টক",    module: "inventory"  },
      ],
    },
    STORE_NAV_GROUP,
    {
      items: [
        { href: "/customers",      icon: Users,           label: "কাস্টমার",       module: "customers"  },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",   icon: BookOpen,  label: "হিসাব",   module: "hisab"   },
        { href: "/reports", icon: BarChart2, label: "রিপোর্ট", module: "reports" },
      ],
    },
  ],
  restaurant: [
    {
      items: [
        { href: "/dashboard",  icon: LayoutDashboard,  label: "ড্যাশবোর্ড",  module: "dashboard"  },
        { href: "/tables",     icon: UtensilsCrossed,  label: "টেবিল",        module: "tables"     },
        { href: "/orders",     icon: ShoppingBag,      label: "অর্ডার",       module: "orders"     },
        { href: "/menu",       icon: ScrollText,       label: "মেনু",         module: "menu"       },
        { href: "/inventory",  icon: Package,          label: "স্টক",         module: "inventory"  },
        { href: "/kitchen",    icon: ChefHat,          label: "কিচেন",        module: "kitchen"    },
      ],
    },
    {
      items: [
        { href: "/customers",  icon: Users,            label: "কাস্টমার",     module: "customers"  },
        { href: "/hr",         icon: UserCog,          label: "স্টাফ",        module: "staff"      },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",   icon: BookOpen,  label: "হিসাব",   module: "hisab"   },
        { href: "/reports", icon: BarChart2, label: "রিপোর্ট", module: "reports" },
      ],
    },
  ],
  pharmacy: [
    {
      items: [
        { href: "/dashboard",      icon: LayoutDashboard, label: "ড্যাশবোর্ড",        module: "dashboard"     },
        { href: "/pos",            icon: Zap,             label: "দ্রুত বিক্রয়",      module: "pos"           },
        { href: "/medicines",      icon: Pill,            label: "ওষুধ স্টক",          module: "inventory"     },
        { href: "/prescriptions",  icon: FileText,        label: "প্রেসক্রিপশন",       module: "prescriptions" },
        { href: "/expiry",         icon: AlertTriangle,   label: "মেয়াদ সতর্কতা",     module: "expiry"        },
      ],
    },
    STORE_NAV_GROUP,
    {
      items: [
        { href: "/customers",      icon: Users,           label: "কাস্টমার",           module: "customers"     },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",   icon: BookOpen,  label: "হিসাব",   module: "hisab"   },
        { href: "/reports", icon: BarChart2, label: "রিপোর্ট", module: "reports" },
      ],
    },
  ],
  retail: [
    {
      items: [
        { href: "/dashboard",      icon: LayoutDashboard, label: "ড্যাশবোর্ড",          module: "dashboard"      },
        { href: "/pos",            icon: Zap,             label: "দ্রুত বিক্রয় (POS)", module: "pos"            },
        { href: "/cash-register",  icon: DollarSign,      label: "Cash Register",        module: "cash-register"  },
        { href: "/inventory",      icon: Package,         label: "পণ্য",                 module: "inventory"      },
      ],
    },
    STORE_NAV_GROUP,
    {
      items: [
        { href: "/customers",      icon: Users,           label: "কাস্টমার",             module: "customers"      },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",   icon: BookOpen,  label: "হিসাব",   module: "hisab"   },
        { href: "/reports", icon: BarChart2, label: "রিপোর্ট", module: "reports" },
      ],
    },
  ],
  salon: [
    {
      items: [
        { href: "/dashboard",      icon: LayoutDashboard, label: "ড্যাশবোর্ড",        module: "dashboard"    },
        { href: "/appointments",   icon: Calendar,        label: "অ্যাপয়েন্টমেন্ট", module: "appointments" },
        { href: "/services",       icon: Scissors,        label: "সার্ভিস তালিকা",   module: "services"     },
        { href: "/inventory",      icon: Package,         label: "পণ্য স্টক",         module: "inventory"    },
      ],
    },
    STORE_NAV_GROUP,
    {
      items: [
        { href: "/customers",      icon: Users,           label: "কাস্টমার",           module: "customers"    },
        { href: "/hr",             icon: UserCog,         label: "স্টাফ",              module: "staff"        },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",   icon: BookOpen,  label: "হিসাব",   module: "hisab"   },
        { href: "/reports", icon: BarChart2, label: "রিপোর্ট", module: "reports" },
      ],
    },
  ],
  tailor: [
    {
      items: [
        { href: "/dashboard",    icon: LayoutDashboard, label: "ড্যাশবোর্ড",  module: "dashboard"    },
        { href: "/orders",       icon: ClipboardList,   label: "অর্ডার",       module: "orders"       },
        { href: "/measurements", icon: Ruler,           label: "মাপজোখ",       module: "measurements" },
        { href: "/inventory",    icon: Shirt,           label: "কাপড় স্টক",   module: "inventory"    },
      ],
    },
    STORE_NAV_GROUP,
    {
      items: [
        { href: "/customers",    icon: Users,           label: "কাস্টমার",     module: "customers"    },
        { href: "/delivery",     icon: Navigation,      label: "ডেলিভারি",     module: "courier"      },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",   icon: BookOpen,  label: "হিসাব",   module: "hisab"   },
        { href: "/reports", icon: BarChart2, label: "রিপোর্ট", module: "reports" },
      ],
    },
  ],
  hotel: [
    {
      items: [
        { href: "/dashboard",    icon: LayoutDashboard, label: "ড্যাশবোর্ড",   module: "dashboard"    },
        { href: "/rooms",        icon: Bed,             label: "রুম",           module: "rooms"        },
        { href: "/bookings",     icon: CalendarRange,   label: "বুকিং",         module: "bookings"     },
        { href: "/housekeeping", icon: Sparkles,        label: "হাউসকিপিং",     module: "housekeeping" },
      ],
    },
    STORE_NAV_GROUP,
    {
      items: [
        { href: "/customers",    icon: Users,           label: "গেস্ট",         module: "customers"    },
        { href: "/hr",           icon: UserCog,         label: "স্টাফ",         module: "staff"        },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",   icon: BookOpen,  label: "হিসাব",   module: "hisab"   },
        { href: "/reports", icon: BarChart2, label: "রিপোর্ট", module: "reports" },
      ],
    },
  ],
  garage: [
    {
      items: [
        { href: "/dashboard",  icon: LayoutDashboard, label: "ড্যাশবোর্ড",     module: "dashboard" },
        { href: "/jobcards",   icon: ClipboardList,   label: "জব কার্ড",        module: "jobcards"  },
        { href: "/vehicles",   icon: Car,             label: "গাড়ির তালিকা",   module: "vehicles"  },
        { href: "/inventory",  icon: Package,         label: "পার্টস স্টক",     module: "inventory" },
      ],
    },
    {
      items: [
        { href: "/customers",  icon: Users,           label: "কাস্টমার",        module: "customers" },
        { href: "/hr",         icon: UserCog,         label: "মেকানিক / স্টাফ", module: "staff"     },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",   icon: BookOpen,  label: "হিসাব",   module: "hisab"   },
        { href: "/reports", icon: BarChart2, label: "রিপোর্ট", module: "reports" },
      ],
    },
  ],
  lab: [
    {
      items: [
        { href: "/dashboard",       icon: LayoutDashboard, label: "ড্যাশবোর্ড",      module: "dashboard"   },
        { href: "/lab/testorders",  icon: ClipboardCheck,  label: "রোগী রেজিস্ট্রেশন", module: "testorders"  },
        { href: "/lab/results",     icon: Microscope,      label: "Result এন্ট্রি",   module: "results"     },
        { href: "/lab/tests",       icon: TestTube2,       label: "পরীক্ষার তালিকা",  module: "tests"       },
      ],
    },
    {
      items: [
        { href: "/customers",       icon: Users,           label: "রোগীর তালিকা",    module: "patients"    },
        { href: "/appointments",    icon: Calendar,        label: "অ্যাপয়েন্টমেন্ট", module: "appointments" },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",   icon: BookOpen,  label: "হিসাব",   module: "hisab"   },
        { href: "/reports", icon: BarChart2, label: "রিপোর্ট", module: "reports" },
      ],
    },
  ],
  convention: [
    {
      items: [
        { href: "/dashboard",           icon: LayoutDashboard,      label: "ড্যাশবোর্ড",        module: "dashboard" },
        { href: "/convention/events",   icon: PartyPopper,          label: "ইভেন্ট বুকিং",      module: "events"    },
        { href: "/convention/halls",    icon: Building2,            label: "হল ম্যানেজমেন্ট",   module: "halls"     },
        { href: "/convention/packages", icon: GalleryHorizontalEnd, label: "প্যাকেজ",           module: "packages"  },
      ],
    },
    {
      items: [
        { href: "/customers",           icon: Users,                label: "কাস্টমার",           module: "customers" },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                    icon: BookOpen,  label: "হিসাব",    module: "hisab"   },
        { href: "/convention/reports",       icon: BarChart2, label: "রিপোর্ট",  module: "reports" },
      ],
    },
  ],
  school: [
    {
      items: [
        { href: "/dashboard",          icon: LayoutDashboard, label: "ড্যাশবোর্ড",      module: "dashboard"  },
        { href: "/school/students",    icon: GraduationCap,   label: "শিক্ষার্থী",       module: "students"   },
        { href: "/school/batches",     icon: Users,           label: "ব্যাচ",            module: "batches"    },
        { href: "/school/fees",        icon: Receipt,         label: "ফি ম্যানেজমেন্ট",  module: "fees"       },
        { href: "/school/attendance",  icon: CalendarCheck2,  label: "উপস্থিতি",         module: "attendance" },
        { href: "/school/exams",       icon: BookOpenCheck,   label: "পরীক্ষার ফলাফল",  module: "exams"      },
      ],
    },
    {
      items: [
        { href: "/hr",                 icon: UserCog,         label: "শিক্ষক / স্টাফ",  module: "staff"      },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",              icon: BookOpen,        label: "হিসাব",            module: "hisab"      },
        { href: "/school/reports",     icon: BarChart2,       label: "রিপোর্ট",          module: "reports"    },
      ],
    },
  ],
  farm: [
    {
      items: [
        { href: "/dashboard",          icon: LayoutDashboard, label: "ড্যাশবোর্ড",         module: "dashboard"  },
        { href: "/farm/lands",         icon: Tractor,         label: "জমি ম্যানেজমেন্ট",   module: "lands"      },
        { href: "/farm/crops",         icon: SproutIcon,      label: "ফসল ব্যবস্থাপনা",    module: "crops"      },
        { href: "/farm/livestock",     icon: BirdIcon,        label: "পশু / মৎস্য",         module: "livestock"  },
        { href: "/farm/harvest",       icon: Wheat,           label: "ফসল তোলা ও বিক্রি",  module: "harvest"    },
        { href: "/farm/buyers",        icon: ShoppingBasket,  label: "ক্রেতা তালিকা",       module: "buyers"     },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",              icon: BookOpen,        label: "হিসাব",              module: "hisab"      },
        { href: "/farm/reports",       icon: BarChart2,       label: "রিপোর্ট",             module: "reports"    },
      ],
    },
  ],
  hospital: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",         module: "dashboard" },
        { href: "/hospital/opd",           icon: Activity,        label: "OPD",                 module: "opd"       },
        { href: "/hospital/ipd",           icon: BedDoubleIcon,   label: "IPD ভর্তি",           module: "ipd"       },
        { href: "/hospital/doctors",       icon: Stethoscope,     label: "ডাক্তার",             module: "doctors"   },
        { href: "/hospital/patients",      icon: Users,           label: "রোগীর তালিকা",        module: "patients"  },
      ],
    },
    {
      items: [
        { href: "/hr",                     icon: UserCog,         label: "স্টাফ",               module: "staff"     },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hospital/billing",       icon: Receipt,         label: "বিলিং",               module: "billing"   },
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",               module: "hisab"     },
        { href: "/hospital/reports",       icon: BarChart2,       label: "রিপোর্ট",             module: "reports"   },
      ],
    },
  ],
  travel: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",         module: "dashboard" },
        { href: "/travel/packages",        icon: MapPin,          label: "ট্যুর প্যাকেজ",       module: "packages"  },
        { href: "/travel/bookings",        icon: Ticket,          label: "বুকিং",               module: "bookings"  },
        { href: "/travel/visa",            icon: Stamp,           label: "ভিসা ট্র্যাকিং",      module: "visa"      },
        { href: "/travel/vendors",         icon: HandCoins,       label: "Vendor",               module: "vendors"   },
      ],
    },
    {
      items: [
        { href: "/customers",              icon: Users,           label: "কাস্টমার",             module: "customers" },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",               module: "hisab"     },
        { href: "/travel/reports",         icon: BarChart2,       label: "রিপোর্ট",             module: "reports"   },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/travel/settings",        icon: Settings,        label: "সেটিংস",              module: "settings"  },
      ],
    },
  ],
  gym: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",           module: "dashboard"   },
        { href: "/gym/members",            icon: Users,           label: "সদস্য",                module: "members"     },
        { href: "/gym/memberships",        icon: Dumbbell,        label: "মেম্বারশিপ প্ল্যান",   module: "memberships" },
        { href: "/gym/attendance",         icon: CalendarCheck2,  label: "উপস্থিতি",             module: "attendance"  },
        { href: "/gym/trainers",           icon: UserCog,         label: "ট্রেইনার",             module: "trainers"    },
        { href: "/gym/equipment",          icon: Wrench,          label: "সরঞ্জাম",              module: "equipment"   },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",                module: "hisab"       },
        { href: "/gym/reports",            icon: BarChart2,       label: "রিপোর্ট",              module: "reports"     },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/gym/settings",           icon: Settings,        label: "সেটিংস",               module: "settings"    },
      ],
    },
  ],
  photography: [
    {
      items: [
        { href: "/dashboard",                    icon: LayoutDashboard, label: "ড্যাশবোর্ড",       module: "dashboard" },
        { href: "/photography/bookings",         icon: CalendarRange,   label: "বুকিং",             module: "bookings"  },
        { href: "/photography/packages",         icon: Package,         label: "প্যাকেজ",           module: "packages"  },
        { href: "/photography/portfolio",        icon: Image,           label: "পোর্টফোলিও",        module: "portfolio" },
        { href: "/photography/equipment",        icon: Camera,          label: "সরঞ্জাম",           module: "equipment" },
      ],
    },
    {
      items: [
        { href: "/customers",                    icon: Users,           label: "ক্লায়েন্ট",         module: "customers" },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                        icon: BookOpen,        label: "হিসাব",             module: "hisab"     },
        { href: "/photography/reports",          icon: BarChart2,       label: "রিপোর্ট",           module: "reports"   },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/photography/settings",         icon: Settings,        label: "সেটিংস",            module: "settings"  },
      ],
    },
  ],
  laundry: [
    {
      items: [
        { href: "/dashboard",  icon: LayoutDashboard, label: "ড্যাশবোর্ড",      module: "dashboard" },
        { href: "/orders",     icon: ClipboardList,   label: "অর্ডার",           module: "orders"    },
        { href: "/services",   icon: Droplets,        label: "সার্ভিস প্রাইসিং", module: "services"  },
      ],
    },
    {
      items: [
        { href: "/customers",  icon: Users,           label: "কাস্টমার",         module: "customers" },
        { href: "/delivery",   icon: Truck,           label: "ডেলিভারি",         module: "delivery"  },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",    icon: BookOpen,  label: "হিসাব",    module: "hisab"   },
        { href: "/reports",  icon: BarChart2, label: "রিপোর্ট",  module: "reports" },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/settings", icon: Settings, label: "সেটিংস", module: "settings" },
      ],
    },
  ],
  printing: [
    {
      items: [
        { href: "/dashboard",          icon: LayoutDashboard, label: "ড্যাশবোর্ড",       module: "dashboard" },
        { href: "/printing/orders",    icon: ClipboardList,   label: "প্রিন্ট অর্ডার",    module: "orders"    },
        { href: "/printing/services",  icon: Printer,         label: "সার্ভিস প্রাইসিং",  module: "services"  },
        { href: "/inventory",          icon: Package,         label: "পেপার / ইংক স্টক",  module: "inventory" },
      ],
    },
    {
      items: [
        { href: "/customers",          icon: Users,           label: "কাস্টমার",           module: "customers" },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",              icon: BookOpen,        label: "হিসাব",              module: "hisab"     },
        { href: "/printing/reports",   icon: BarChart2,       label: "রিপোর্ট",            module: "reports"   },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/settings",           icon: Settings,        label: "সেটিংস",             module: "settings"  },
      ],
    },
  ],
  realestate: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",          module: "dashboard"   },
        { href: "/realestate/properties",  icon: Home,            label: "Property তালিকা",     module: "properties"  },
        { href: "/realestate/leads",       icon: Users,           label: "Lead ম্যানেজমেন্ট",   module: "leads"       },
        { href: "/realestate/deals",       icon: HandCoins,       label: "Deal ট্র্যাকিং",      module: "deals"       },
      ],
    },
    {
      items: [
        { href: "/customers",              icon: Users,           label: "ক্লায়েন্ট",           module: "clients"     },
        { href: "/realestate/owners",      icon: UserCog,         label: "Property Owner",       module: "owners"      },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",                module: "hisab"       },
        { href: "/realestate/reports",     icon: BarChart2,       label: "রিপোর্ট",              module: "reports"     },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/settings",               icon: Settings,        label: "সেটিংস",               module: "settings"    },
      ],
    },
  ],
  petshop: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",           module: "dashboard"    },
        { href: "/petshop/pets",           icon: PawPrint,        label: "পশু-পাখি রেজিস্ট্রি",  module: "pets"         },
        { href: "/appointments",           icon: Calendar,        label: "অ্যাপয়েন্টমেন্ট",     module: "appointments" },
        { href: "/inventory",              icon: Package,         label: "পণ্য স্টক",             module: "inventory"    },
      ],
    },
    {
      items: [
        { href: "/customers",              icon: Users,           label: "কাস্টমার",              module: "customers"    },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",                 module: "hisab"        },
        { href: "/petshop/reports",        icon: BarChart2,       label: "রিপোর্ট",               module: "reports"      },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/settings",               icon: Settings,        label: "সেটিংস",                module: "settings"     },
      ],
    },
  ],
  electronics: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",            module: "dashboard" },
        { href: "/jobcards",               icon: ClipboardList,   label: "জব কার্ড",               module: "jobcards"  },
        { href: "/devices",               icon: Smartphone,      label: "ডিভাইস তালিকা",          module: "devices"   },
        { href: "/inventory",              icon: Package,         label: "পার্টস স্টক",             module: "inventory" },
      ],
    },
    {
      items: [
        { href: "/customers",              icon: Users,           label: "কাস্টমার",               module: "customers" },
        { href: "/hr",                     icon: UserCog,         label: "টেকনিশিয়ান / স্টাফ",    module: "staff"     },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",                  module: "hisab"     },
        { href: "/electronics/reports",    icon: BarChart2,       label: "রিপোর্ট",                module: "reports"   },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/settings",               icon: Settings,        label: "সেটিংস",                 module: "settings"  },
      ],
    },
  ],
  kindergarten: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",            module: "dashboard"    },
        { href: "/children",               icon: Users,           label: "শিশু তালিকা",            module: "children"     },
        { href: "/school/batches",         icon: BookOpen,        label: "ক্লাস / গ্রুপ",          module: "classes"      },
        { href: "/school/attendance",      icon: CalendarCheck2,  label: "উপস্থিতি",               module: "attendance"   },
        { href: "/meals",                  icon: ChefHat,         label: "খাবার ট্র্যাকিং",        module: "meals"        },
        { href: "/daily-report",           icon: ClipboardPen,    label: "ডেইলি রিপোর্ট",          module: "daily_report" },
        { href: "/school/fees",            icon: Receipt,         label: "ফি ম্যানেজমেন্ট",        module: "fees"         },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",                  module: "hisab"        },
        { href: "/kindergarten/reports",   icon: BarChart2,       label: "রিপোর্ট",                module: "reports"      },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/settings",               icon: Settings,        label: "সেটিংস",                 module: "settings"     },
      ],
    },
  ],
  carrental: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",             module: "dashboard" },
        { href: "/carrental/fleet",        icon: Car,             label: "ফ্লিট / গাড়ি",           module: "fleet"     },
        { href: "/carrental/bookings",     icon: CalendarRange,   label: "বুকিং",                  module: "bookings"  },
        { href: "/carrental/drivers",      icon: UserCog,         label: "ড্রাইভার",               module: "drivers"   },
        { href: "/carrental/fuel",         icon: Fuel,            label: "জ্বালানি লগ",             module: "fuel"      },
        { href: "/customers",             icon: Users,           label: "কাস্টমার",               module: "customers" },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",                  module: "hisab"     },
        { href: "/carrental/reports",      icon: BarChart2,       label: "রিপোর্ট",                module: "reports"   },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/settings",               icon: Settings,        label: "সেটিংস",                 module: "settings"  },
      ],
    },
  ],
  legal: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",             module: "dashboard" },
        { href: "/cases",                  icon: Scale,           label: "মামলা",                  module: "cases"     },
        { href: "/hearings",               icon: Calendar,        label: "শুনানি সূচি",             module: "hearings"  },
        { href: "/customers",             icon: Users,           label: "ক্লায়েন্ট",              module: "clients"   },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",                  module: "hisab"     },
        { href: "/legal/reports",          icon: BarChart2,       label: "রিপোর্ট",                module: "reports"   },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/settings",               icon: Settings,        label: "সেটিংস",                 module: "settings"  },
      ],
    },
  ],
  spa: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",            module: "dashboard"    },
        { href: "/appointments",           icon: Calendar,        label: "অ্যাপয়েন্টমেন্ট",       module: "appointments" },
        { href: "/services",               icon: Sparkle,         label: "সার্ভিস",                module: "services"     },
        { href: "/spa/rooms",              icon: Bed,             label: "ট্রিটমেন্ট রুম",         module: "rooms"        },
        { href: "/spa/therapists",         icon: UserCog,         label: "থেরাপিস্ট",              module: "therapists"   },
      ],
    },
    {
      items: [
        { href: "/customers",              icon: Users,           label: "কাস্টমার",               module: "customers"    },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",                  module: "hisab"        },
        { href: "/spa/reports",            icon: BarChart2,       label: "রিপোর্ট",                module: "reports"      },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/settings",               icon: Settings,        label: "সেটিংস",                 module: "settings"     },
      ],
    },
  ],
  catering: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",             module: "dashboard" },
        { href: "/catering/events",        icon: CalendarRange,   label: "ইভেন্ট বুকিং",           module: "events"    },
        { href: "/catering/menus",         icon: ScrollText,      label: "Menu Templates",          module: "menus"     },
        { href: "/customers",              icon: Users,           label: "কাস্টমার",               module: "customers" },
        { href: "/hr",                     icon: UserCog,         label: "স্টাফ",                  module: "staff"     },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",                  module: "hisab"     },
        { href: "/catering/reports",       icon: BarChart2,       label: "রিপোর্ট",                module: "reports"   },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/settings",               icon: Settings,        label: "সেটিংস",                 module: "settings"  },
      ],
    },
  ],
  freelance: [
    {
      items: [
        { href: "/dashboard",              icon: LayoutDashboard, label: "ড্যাশবোর্ড",             module: "dashboard" },
        { href: "/freelance/projects",     icon: FolderKanban,    label: "প্রজেক্ট",               module: "projects"  },
        { href: "/freelance/invoices",     icon: FileText,        label: "Invoice",                module: "invoices"  },
        { href: "/freelance/timelog",      icon: Clock,           label: "টাইম লগ",                module: "timelog"   },
        { href: "/customers",              icon: Users,           label: "ক্লায়েন্ট",             module: "clients"   },
      ],
    },
    {
      label: "আর্থিক",
      items: [
        { href: "/hisab",                  icon: BookOpen,        label: "হিসাব",                  module: "hisab"     },
        { href: "/freelance/reports",      icon: BarChart2,       label: "রিপোর্ট",                module: "reports"   },
      ],
    },
    {
      label: "সিস্টেম",
      items: [
        { href: "/settings",               icon: Settings,        label: "সেটিংস",                 module: "settings"  },
      ],
    },
  ],
};

/* ─── Helper functions ───────────────────────────────────── */

export function getModules(businessType: string, salesChannel = "both"): string[] {
  const all = BUSINESS_MODULES[businessType as BusinessType] ?? BUSINESS_MODULES.fcommerce;
  if (salesChannel === "online")  return all.filter(m => !OFFLINE_ONLY_MODULES.has(m));
  if (salesChannel === "offline") return all.filter(m => !ONLINE_ONLY_MODULES.has(m));
  return all;
}

export function hasModule(businessType: string, module: string, salesChannel = "both"): boolean {
  return getModules(businessType, salesChannel).includes(module);
}

export function getNavGroups(businessType: string, salesChannel = "both"): NavGroup[] {
  const groups = NAV_BY_TYPE[businessType as BusinessType] ?? NAV_BY_TYPE.fcommerce;
  if (salesChannel === "both") return groups;
  return groups
    .map(g => ({
      ...g,
      items: g.items.filter(item => {
        if (salesChannel === "online")  return !OFFLINE_ONLY_MODULES.has(item.module);
        if (salesChannel === "offline") return !ONLINE_ONLY_MODULES.has(item.module);
        return true;
      }),
    }))
    .filter(g => g.items.length > 0);
}

export function getNavItems(businessType: string, salesChannel = "both"): NavItem[] {
  return getNavGroups(businessType, salesChannel).flatMap(g => g.items);
}

export function getBusinessTypeMeta(businessType: string): BusinessTypeMeta {
  return BUSINESS_TYPE_META[businessType as BusinessType] ?? BUSINESS_TYPE_META.fcommerce;
}

export function isValidBusinessType(value: string): value is BusinessType {
  return BUSINESS_TYPES.includes(value as BusinessType);
}

export function isValidSalesChannel(value: string): value is SalesChannel {
  return SALES_CHANNELS.includes(value as SalesChannel);
}
