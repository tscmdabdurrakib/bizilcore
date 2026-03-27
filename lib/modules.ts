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
  Settings2,
  Tag,
  Star,
  type LucideIcon,
} from "lucide-react";

/* ─── Business Type ─────────────────────────────────────── */

export type BusinessType =
  | "fcommerce"
  | "restaurant"
  | "pharmacy"
  | "retail"
  | "salon"
  | "tailor";

export const BUSINESS_TYPES: BusinessType[] = [
  "fcommerce",
  "restaurant",
  "pharmacy",
  "retail",
  "salon",
  "tailor",
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
const ONLINE_ONLY_MODULES = new Set(["catalog", "courier", "facebook", "whatsapp"]);

/* Modules that only make sense for offline selling */
const OFFLINE_ONLY_MODULES = new Set(["pos"]);

/* ─── Module definitions per business type ───────────────── */

const BUSINESS_MODULES: Record<BusinessType, string[]> = {
  fcommerce: [
    "dashboard", "inventory", "orders", "customers",
    "hisab", "reports", "courier", "catalog", "facebook", "whatsapp", "settings", "store",
  ],
  restaurant: [
    "dashboard", "inventory", "orders", "customers",
    "hisab", "reports", "tables", "kitchen", "menu", "staff", "catalog", "courier", "settings", "store",
  ],
  pharmacy: [
    "dashboard", "inventory", "orders", "customers",
    "hisab", "reports", "prescriptions", "expiry", "pos", "catalog", "courier", "settings", "store",
  ],
  retail: [
    "dashboard", "inventory", "pos", "cash-register", "orders", "customers",
    "hisab", "reports", "catalog", "courier", "settings", "store",
  ],
  salon: [
    "dashboard", "services", "appointments", "inventory", "customers",
    "hisab", "reports", "staff", "catalog", "settings", "store",
  ],
  tailor: [
    "dashboard", "inventory", "orders", "customers",
    "hisab", "reports", "measurements", "courier", "catalog", "settings", "store",
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
    { href: "/store/setup",      icon: Store,    label: "সেটআপ",     module: "store" },
    { href: "/store/theme",      icon: Palette,  label: "থিম",        module: "store" },
    { href: "/store/appearance", icon: Image,    label: "লুক ও ফিল", module: "store" },
    { href: "/store/products",   icon: Package,  label: "পণ্য",       module: "store" },
    { href: "/store/settings",   icon: Settings2,label: "সেটিংস",    module: "store" },
    { href: "/store/orders",     icon: ShoppingBag, label: "অর্ডার", module: "store" },
    { href: "/store/coupons",    icon: Tag,      label: "কুপন",       module: "store" },
    { href: "/store/reviews",    icon: Star,     label: "রিভিউ",      module: "store" },
    { href: "/dashboard/store/analytics",  icon: BarChart2,label: "অ্যানালিটিক্স", module: "store" },
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
    STORE_NAV_GROUP,
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
