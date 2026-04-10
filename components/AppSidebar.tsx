"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BookOpen,
  BarChart2,
  Settings,
  ShieldCheck,
  Truck,
  MessageCircle,
  ClipboardList,
  RotateCcw,
  Navigation,
  Headphones,
  TrendingDown,
  FileText,
  ShoppingCart,
  UserCog,
  CalendarClock,
  CreditCard,
  Grid3X3,
  X,
  LogOut,
  CheckSquare,
  Wallet,
  Store,
  TrendingUp,
  Lightbulb,
  Palette,
  Image as ImageIcon,
  Settings2,
  Tag,
  Star,
  MessageSquare,
} from "lucide-react";
import { getNavGroups, getNavItems, BUSINESS_TYPE_META, type NavItem as ModuleNavItem } from "@/lib/modules";
import { createPortal } from "react-dom";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const storeSubItems: NavItem[] = [
  { href: "/store/setup",                icon: Store,       label: "সেটআপ"          },
  { href: "/store/theme",                icon: Palette,     label: "থিম"             },
  { href: "/store/appearance",           icon: ImageIcon,   label: "লুক ও ফিল"      },
  { href: "/store/products",             icon: Package,     label: "পণ্য"            },
  { href: "/store/orders",               icon: ShoppingBag, label: "অর্ডার"          },
  { href: "/store/coupons",              icon: Tag,         label: "কুপন"            },
  { href: "/store/reviews",              icon: Star,        label: "রিভিউ"           },
  { href: "/store/settings",             icon: Settings2,   label: "সেটিংস"          },
  { href: "/dashboard/store/analytics",  icon: BarChart2,   label: "অ্যানালিটিক্স"  },
];

function StoreHoverItem({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const storeActive = pathname.startsWith("/store");
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.top, left: rect.right + 6 });
    }
    setOpen(true);
  };

  const hide = () => {
    timerRef.current = setTimeout(() => setOpen(false), 150);
  };

  const flyout = open && mounted ? (
    <div
      className="fixed z-[9999] rounded-xl shadow-2xl border overflow-hidden"
      style={{
        top: pos.top,
        left: pos.left,
        width: 196,
        backgroundColor: "var(--shell-bg)",
        borderColor: "var(--shell-border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <div className="px-3 pt-2.5 pb-1 border-b" style={{ borderColor: "var(--shell-border)" }}>
        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#0F6E56" }}>আমার স্টোর</p>
      </div>
      <div className="p-1.5">
        {storeSubItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: active ? "#E1F5EE" : "transparent",
                color: active ? "#0F6E56" : "var(--shell-nav-inactive)",
              }}
            >
              <item.icon size={14} className="flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div ref={triggerRef} onMouseEnter={show} onMouseLeave={hide}>
        <div
          className="flex items-center rounded-lg mb-0.5 text-sm font-medium transition-all cursor-default select-none"
          style={{
            backgroundColor: storeActive ? "var(--shell-nav-active-bg)" : "transparent",
            color: storeActive ? "var(--shell-nav-active-color)" : "var(--shell-nav-inactive)",
            borderLeft: storeActive ? "3px solid var(--shell-nav-active-border)" : "3px solid transparent",
            padding: collapsed ? "10px 0" : "10px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : 12,
          }}
        >
          <Store size={16} className="flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="truncate flex-1">আমার স্টোর</span>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: 0.45 }}>
                <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </div>
      </div>
      {mounted && flyout ? createPortal(flyout, document.body) : null}
    </>
  );
}

const navGroups: NavGroup[] = [
  {
    items: [
      { href: "/dashboard",   icon: LayoutDashboard, label: "ড্যাশবোর্ড" },
      { href: "/orders",      icon: ShoppingBag,     label: "অর্ডার" },
      { href: "/fb-orders",   icon: MessageSquare,   label: "FB কমেন্ট অর্ডার" },
      { href: "/messenger",   icon: MessageCircle,   label: "Messenger Reply" },
      { href: "/delivery",    icon: Navigation,      label: "ডেলিভারি" },
      { href: "/returns",     icon: RotateCcw,       label: "রিটার্ন" },
      { href: "/inventory",   icon: Package,         label: "পণ্য ও স্টক" },
      { href: "/customers",   icon: Users,           label: "কাস্টমার" },
      { href: "/suppliers",   icon: Truck,           label: "Supplier" },
      { href: "/tasks",       icon: CheckSquare,     label: "টাস্ক" },
    ],
  },
  {
    label: "আর্থিক ব্যবস্থাপনা",
    items: [
      { href: "/hisab",            icon: BookOpen,     label: "হিসাব" },
      { href: "/expenses",         icon: TrendingDown, label: "খরচ ট্র্যাকার" },
      { href: "/invoices",         icon: FileText,     label: "ইনভয়েস" },
      { href: "/purchase-orders",  icon: ShoppingCart, label: "ক্রয় অর্ডার" },
      { href: "/cod",              icon: Wallet,       label: "COD ট্র্যাকার" },
      { href: "/reports",          icon: BarChart2,    label: "রিপোর্ট" },
    ],
  },
  {
    label: "HR / টিম",
    items: [
      { href: "/hr",        icon: UserCog,       label: "কর্মী ব্যবস্থাপনা" },
      { href: "/hr/shifts", icon: CalendarClock, label: "শিফট ম্যানেজমেন্ট" },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/shops",           icon: Store,       label: "Multi-Shop" },
      { href: "/affiliate",       icon: TrendingUp,  label: "Affiliate" },
      { href: "/community-tips",  icon: Lightbulb,   label: "Community টিপস" },
    ],
  },
  {
    items: [
      { href: "/billing",        icon: CreditCard,    label: "Billing" },
      { href: "/communications", icon: MessageCircle, label: "যোগাযোগ" },
      { href: "/activity-log",   icon: ClipboardList, label: "Activity Log" },
      { href: "/support",        icon: Headphones,    label: "সাপোর্ট" },
      { href: "/settings",       icon: Settings,      label: "সেটিংস" },
    ],
  },
];

const systemNavGroup: NavGroup = {
  label: "সিস্টেম",
  items: [
    { href: "/billing",        icon: CreditCard,    label: "Billing"          },
    { href: "/community-tips", icon: Lightbulb,     label: "Community টিপস"  },
    { href: "/settings",       icon: Settings,      label: "সেটিংস"          },
    { href: "/support",        icon: Headphones,    label: "সাপোর্ট"         },
  ],
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/hr") return pathname === "/hr";
  return pathname.startsWith(href);
}

interface Props {
  salesChannel?: string;
  shopName: string;
  plan?: string;
  isAdmin?: boolean;
  logoUrl?: string | null;
  businessType?: string;
}

const PRO_LOCKED_HREFS = ["/delivery", "/reports", "/hr", "/hr/shifts", "/communications", "/tasks"];

const mobileBottomItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "হোম" },
  { href: "/orders",    icon: ShoppingBag,     label: "অর্ডার" },
  { href: "/inventory", icon: Package,         label: "পণ্য" },
  { href: "/customers", icon: Users,           label: "কাস্টমার" },
];

const moreMenuGroups = [
  {
    label: "বিক্রয় ও ডেলিভারি",
    accent: "#3B82F6",
    iconBg: "#EFF6FF",
    items: [
      { href: "/fb-orders",  icon: MessageSquare, label: "FB অর্ডার" },
      { href: "/messenger",  icon: MessageCircle, label: "Messenger" },
      { href: "/returns",    icon: RotateCcw,    label: "রিটার্ন" },
      { href: "/delivery",   icon: Navigation,   label: "ডেলিভারি" },
      { href: "/suppliers",  icon: Truck,        label: "Supplier" },
      { href: "/tasks",      icon: CheckSquare,  label: "টাস্ক" },
    ],
  },
  {
    label: "আর্থিক ব্যবস্থাপনা",
    accent: "#10B981",
    iconBg: "#ECFDF5",
    items: [
      { href: "/hisab",           icon: BookOpen,     label: "হিসাব" },
      { href: "/expenses",        icon: TrendingDown, label: "খরচ" },
      { href: "/invoices",        icon: FileText,     label: "ইনভয়েস" },
      { href: "/purchase-orders", icon: ShoppingCart, label: "ক্রয় অর্ডার" },
      { href: "/cod",             icon: Wallet,       label: "COD" },
      { href: "/reports",         icon: BarChart2,    label: "রিপোর্ট" },
    ],
  },
  {
    label: "HR / টিম",
    accent: "#F59E0B",
    iconBg: "#FFFBEB",
    items: [
      { href: "/hr",        icon: UserCog,       label: "কর্মী" },
      { href: "/hr/shifts", icon: CalendarClock, label: "শিফট" },
    ],
  },
  {
    label: "আমার স্টোর",
    accent: "#0F6E56",
    iconBg: "#E1F5EE",
    items: [
      { href: "/store/setup",      icon: Store,      label: "সেটআপ"     },
      { href: "/store/theme",      icon: Palette,    label: "থিম"        },
      { href: "/store/appearance", icon: ImageIcon,  label: "লুক ও ফিল" },
      { href: "/store/products",   icon: Package,    label: "পণ্য"       },
      { href: "/store/settings",   icon: Settings2,  label: "সেটিংস"    },
      { href: "/store/orders",     icon: ShoppingBag,label: "অর্ডার"    },
      { href: "/store/coupons",    icon: Tag,        label: "কুপন"       },
      { href: "/store/reviews",    icon: Star,       label: "রিভিউ"     },
      { href: "/dashboard/store/analytics",  icon: BarChart2,  label: "অ্যানালিটিক্স" },
    ],
  },
  {
    label: "Growth",
    accent: "#10B981",
    iconBg: "#ECFDF5",
    items: [
      { href: "/shops",     icon: Store,      label: "Multi-Shop" },
      { href: "/affiliate", icon: TrendingUp, label: "Affiliate" },
    ],
  },
  {
    label: "সেটিং ও সাপোর্ট",
    accent: "#8B5CF6",
    iconBg: "#F5F3FF",
    items: [
      { href: "/billing",        icon: CreditCard,    label: "Billing" },
      { href: "/communications", icon: MessageCircle, label: "SMS" },
      { href: "/activity-log",   icon: ClipboardList, label: "লগ" },
      { href: "/support",        icon: Headphones,    label: "সাপোর্ট" },
      { href: "/settings",       icon: Settings,      label: "সেটিংস" },
    ],
  },
];

function buildDynamicMoreMenuGroups(businessType: string, salesChannel = "both") {
  const meta    = BUSINESS_TYPE_META[businessType as keyof typeof BUSINESS_TYPE_META] ?? BUSINESS_TYPE_META.fcommerce;
  const groups  = getNavGroups(businessType, salesChannel);
  const result: { label: string; accent: string; iconBg: string; items: ModuleNavItem[] }[] = [];

  for (const group of groups) {
    result.push({
      label:  group.label ?? "মূল মেনু",
      accent: group.label ? "#10B981" : meta.color,
      iconBg: group.label ? "#ECFDF5" : meta.bgColor,
      items:  group.items,
    });
  }

  result.push({
    label:  "সিস্টেম",
    accent: "#8B5CF6",
    iconBg: "#F5F3FF",
    items: [
      { href: "/billing",        icon: CreditCard, label: "Billing",         module: "billing"   },
      { href: "/community-tips", icon: Lightbulb,  label: "Community টিপস", module: "community" },
      { href: "/settings",       icon: Settings,   label: "সেটিংস",         module: "settings"  },
      { href: "/support",        icon: Headphones, label: "সাপোর্ট",        module: "support"   },
    ],
  });

  return result;
}

export default function AppSidebar({ shopName, plan = "free", isAdmin = false, logoUrl, businessType = "fcommerce", salesChannel = "both" }: Props) {
  const pathname = usePathname();
  const isFreePlan   = plan === "free";
  const isFCommerce  = businessType === "fcommerce";
  const [moreOpen, setMoreOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);
  const [tipsCount, setTipsCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("sidebar-collapsed") : null;
    if (saved === "1") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== "undefined") localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
  };

  useEffect(() => {
    if (plan === "free") return;
    fetch("/api/tasks/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setOverdueCount(d.overdue ?? 0); })
      .catch(() => {});
  }, [plan]);

  useEffect(() => {
    fetch("/api/community-tips/count")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setTipsCount(d.count ?? 0); })
      .catch(() => {});
  }, []);

  const activeNavGroups: NavGroup[] = isFCommerce
    ? navGroups
    : [
        ...getNavGroups(businessType, salesChannel).map(g => ({
          label: g.label,
          items: g.items as NavItem[],
        })),
        systemNavGroup,
      ];

  const activeMobileBottomItems: NavItem[] = isFCommerce
    ? mobileBottomItems
    : (getNavItems(businessType, salesChannel).slice(0, 4) as NavItem[]);

  const activeMoreMenuGroups = isFCommerce
    ? moreMenuGroups
    : buildDynamicMoreMenuGroups(businessType, salesChannel);

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(pathname, item.href);
    const locked = isFreePlan && PRO_LOCKED_HREFS.includes(item.href);
    const showOverdueBadge = item.href === "/tasks" && !locked && overdueCount > 0;
    const showTipsBadge = item.href === "/community-tips" && tipsCount > 0;
    return (
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className="flex items-center rounded-lg mb-0.5 text-sm font-medium transition-all relative"
        style={{
          backgroundColor: active ? "var(--shell-nav-active-bg)" : "transparent",
          color: locked
            ? "var(--shell-nav-inactive)"
            : active ? "var(--shell-nav-active-color)" : "var(--shell-nav-inactive)",
          borderLeft: active ? "3px solid var(--shell-nav-active-border)" : "3px solid transparent",
          opacity: locked ? 0.6 : 1,
          padding: collapsed ? "10px 0" : "10px 12px",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: collapsed ? 0 : 12,
        }}
      >
        <item.icon size={16} className="flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="truncate flex-1">{item.label}</span>
            {showOverdueBadge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#E24B4A", color: "#fff" }}>
                {overdueCount > 9 ? "9+" : overdueCount}
              </span>
            )}
            {showTipsBadge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#D97706", color: "#fff" }}>
                {tipsCount > 99 ? "99+" : tipsCount}
              </span>
            )}
            {locked && (
              <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: "#FFF3DC", color: "#EF9F27" }}>
                PRO
              </span>
            )}
          </>
        )}
        {collapsed && showOverdueBadge && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: "#E24B4A" }} />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 border-r h-full transition-all duration-200"
        style={{
          width: collapsed ? 52 : 210,
          backgroundColor: "var(--shell-bg)",
          borderColor: "var(--shell-border)",
        }}
      >
        {/* Logo + collapse toggle */}
        <div
          className="flex items-center h-[52px] border-b flex-shrink-0"
          style={{
            borderColor: "var(--shell-border)",
            padding: collapsed ? "0 6px" : "0 8px 0 16px",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <img src="/logo.svg" alt="BizilCore" className="w-7 h-7 flex-shrink-0" />
              <span className="font-semibold text-sm truncate" style={{ color: "var(--shell-text)" }}>BizilCore</span>
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "সাইডবার বড় করুন" : "সাইডবার ছোট করুন"}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ color: "var(--shell-nav-inactive)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--shell-nav-active-bg)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
          >
            {collapsed ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 overflow-y-auto overflow-x-hidden">
          {activeNavGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-2" : ""}>
              {group.label && !collapsed && (
                <p
                  className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "var(--shell-text-muted)" }}
                >
                  {group.label}
                </p>
              )}
              {collapsed && gi > 0 && (
                <div className="my-2 mx-auto" style={{ width: 24, height: 1, backgroundColor: "var(--shell-border)" }} />
              )}
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
              {gi === 0 && isFCommerce && <StoreHoverItem collapsed={collapsed} />}
            </div>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              title={collapsed ? "Admin Panel" : undefined}
              className="flex items-center rounded-lg mb-0.5 text-sm font-medium transition-all mt-2"
              style={{
                backgroundColor: pathname.startsWith("/admin") ? "#FFF3DC" : "transparent",
                color: pathname.startsWith("/admin") ? "#92600A" : "var(--shell-text-muted)",
                borderLeft: pathname.startsWith("/admin") ? "3px solid #EF9F27" : "3px solid transparent",
                padding: collapsed ? "10px 0" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 12,
              }}
            >
              <ShieldCheck size={16} className="flex-shrink-0" />
              {!collapsed && <span>Admin Panel</span>}
            </Link>
          )}
        </nav>

        {/* Shop info + Logout */}
        <div className="p-2 border-t" style={{ borderColor: "var(--shell-border)" }}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: logoUrl ? "transparent" : "#0F6E56" }}
                title={shopName}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt={shopName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                    {shopName?.[0]?.toUpperCase() ?? "S"}
                  </div>
                )}
              </div>
              <button
                onClick={async () => { await signOut({ redirect: false }); window.location.replace("/login"); }}
                title="লগআউট"
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-red-50"
                style={{ color: "#9CA3AF" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 px-1">
              <div
                className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden"
                style={{ backgroundColor: logoUrl ? "transparent" : "#0F6E56" }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt={shopName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                    {shopName?.[0]?.toUpperCase() ?? "S"}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--shell-text)" }}>{shopName}</p>
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                  style={{
                    backgroundColor:
                      plan === "business" ? "#FFF3DC" :
                      plan === "pro"      ? "#E1F5EE" :
                                           "#F3F4F6",
                    color:
                      plan === "business" ? "#EF9F27" :
                      plan === "pro"      ? "#0F6E56" :
                                           "#6B7280",
                  }}
                >
                  {plan === "business" ? "👑 Business" : plan === "pro" ? "⚡ Pro" : "Free"}
                </span>
              </div>
              <button
                onClick={async () => { await signOut({ redirect: false }); window.location.replace("/login"); }}
                title="লগআউট"
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-red-50"
                style={{ color: "#9CA3AF" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          backgroundColor: "var(--shell-bg)",
          borderTop: "1px solid var(--shell-border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex items-end justify-around px-1 pt-1 pb-2 relative">
          {/* Left 2 items */}
          {activeMobileBottomItems.slice(0, 2).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
                style={{ color: active ? "#0F6E56" : "var(--shell-nav-inactive)" }}
              >
                <div
                  className="w-10 h-8 flex items-center justify-center rounded-xl transition-all"
                  style={{ backgroundColor: active ? "var(--shell-nav-active-bg)" : "transparent" }}
                >
                  <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* Center FAB button */}
          <div className="flex flex-col items-center" style={{ marginTop: "-18px" }}>
            <button
              onClick={() => setMoreOpen(true)}
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
              style={{
                background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)",
                boxShadow: "0 4px 20px rgba(15, 110, 86, 0.45)",
              }}
            >
              <Grid3X3 size={24} color="white" strokeWidth={1.8} />
            </button>
            <span className="text-[9px] font-bold mt-1" style={{ color: "#0F6E56" }}>মেনু</span>
          </div>

          {/* Right 2 items */}
          {activeMobileBottomItems.slice(2, 4).map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
                style={{ color: active ? "#0F6E56" : "var(--shell-nav-inactive)" }}
              >
                <div
                  className="w-10 h-8 flex items-center justify-center rounded-xl transition-all"
                  style={{ backgroundColor: active ? "var(--shell-nav-active-bg)" : "transparent" }}
                >
                  <item.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More Menu Overlay */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            animation: "bbFadeIn 0.22s ease-out both",
          }}
          onClick={() => setMoreOpen(false)}
        >
          <style>{`
            @keyframes bbFadeIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
            @keyframes bbSlideUp {
              from { transform: translateY(100%); opacity: 0.6; }
              to   { transform: translateY(0);    opacity: 1;   }
            }
          `}</style>
          <div
            className="rounded-t-[28px] flex flex-col"
            style={{
              backgroundColor: "var(--shell-bg)",
              maxHeight: "88vh",
              animation: "bbSlideUp 0.38s cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2.5 pb-0 flex-shrink-0">
              <div className="w-9 h-[3.5px] rounded-full" style={{ backgroundColor: "var(--shell-border)" }} />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0 border-b"
              style={{ borderColor: "var(--shell-border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden"
                  style={{ background: logoUrl ? "transparent" : "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt={shopName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                      {shopName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight" style={{ color: "var(--shell-text)" }}>{shopName}</p>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: plan === "business" ? "#FFF3DC" : plan === "pro" ? "#ECFDF5" : "var(--shell-border)",
                      color: plan === "business" ? "#92600A" : plan === "pro" ? "#0F6E56" : "var(--shell-text-muted)",
                    }}
                  >
                    {plan === "business" ? "👑 Business" : plan === "pro" ? "⚡ Pro" : "Free Plan"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ backgroundColor: "var(--shell-border)" }}
              >
                <X size={18} style={{ color: "var(--shell-text-muted)" }} />
              </button>
            </div>

            {/* Scrollable nav groups */}
            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-5 pb-8">
              {activeMoreMenuGroups.map((group) => (
                <div key={group.label}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="h-4 w-[3px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.accent }}
                    />
                    <p
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: group.accent }}
                    >
                      {group.label}
                    </p>
                  </div>

                  {/* 3-column grid */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      const locked = isFreePlan && PRO_LOCKED_HREFS.includes(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl relative transition-all active:scale-[0.94]"
                          style={{
                            backgroundColor: active ? group.accent + "18" : "var(--shell-surface)",
                            border: `1.5px solid ${active ? group.accent + "60" : "var(--shell-border)"}`,
                            opacity: locked ? 0.6 : 1,
                          }}
                        >
                          {/* Colored icon background */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: active ? group.accent + "25" : group.iconBg,
                            }}
                          >
                            <item.icon
                              size={19}
                              strokeWidth={active ? 2.4 : 1.8}
                              style={{ color: active ? group.accent : group.accent + "CC" }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-semibold text-center leading-tight"
                            style={{ color: active ? group.accent : "var(--shell-text-muted)" }}
                          >
                            {item.label}
                          </span>
                          {locked && (
                            <span
                              className="absolute top-1.5 right-1.5 text-[7px] font-bold px-1 py-0.5 rounded-md"
                              style={{ backgroundColor: "#FFF3DC", color: "#EF9F27" }}
                            >
                              PRO
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Admin section */}
              {isAdmin && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-4 w-[3px] rounded-full flex-shrink-0" style={{ backgroundColor: "#EF4444" }} />
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#EF4444" }}>অ্যাডমিন</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <Link
                      href="/admin"
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl transition-all active:scale-[0.94]"
                      style={{
                        backgroundColor: isActive(pathname, "/admin") ? "#FEF2F2" : "var(--shell-surface)",
                        border: `1.5px solid ${isActive(pathname, "/admin") ? "#EF444460" : "var(--shell-border)"}`,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: isActive(pathname, "/admin") ? "#FEE2E2" : "#FEF2F2" }}
                      >
                        <ShieldCheck size={19} strokeWidth={1.8} style={{ color: "#EF4444" }} />
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: isActive(pathname, "/admin") ? "#EF4444" : "var(--shell-text-muted)" }}>
                        অ্যাডমিন
                      </span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Upgrade CTA for free plan */}
              {isFreePlan && (
                <Link
                  href="/checkout"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)",
                  }}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">⚡</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white leading-tight">Pro-তে আপগ্রেড করুন</p>
                    <p className="text-[10px] text-white/70 mt-0.5">সব ফিচার আনলক করুন</p>
                  </div>
                  <div className="text-white/60 text-base">›</div>
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={async () => { setMoreOpen(false); await signOut({ redirect: false }); window.location.replace("/login"); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all active:scale-[0.98]"
                style={{ backgroundColor: "#FEF2F2", border: "1.5px solid #FECACA" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FEE2E2" }}>
                  <LogOut size={17} color="#EF4444" />
                </div>
                <p className="text-sm font-semibold" style={{ color: "#EF4444" }}>লগআউট</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
