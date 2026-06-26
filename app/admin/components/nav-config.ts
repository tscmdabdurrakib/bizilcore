import {

  LayoutDashboard, BarChart3, Users, Store, CreditCard, Tag,

  HandCoins, DollarSign, Mail, Lightbulb, Star, MessageSquare,

  Clock, Settings, Inbox, Gauge, ShieldAlert, UserPlus, MessagesSquare, Activity, FileText,

  type LucideIcon,

} from "lucide-react";



export interface NavItem {

  href: string;

  label: string;

  icon: LucideIcon;

  badgeKey?: "pendingPayments" | "newFeedback";

}



export interface NavGroup {

  title: string;

  items: NavItem[];

}



export const ADMIN_NAV: NavGroup[] = [

  {

    title: "OVERVIEW",

    items: [

      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },

      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },

      { href: "/admin/nps", label: "NPS", icon: Gauge },

    ],

  },

  {

    title: "USERS & SHOPS",

    items: [

      { href: "/admin/users", label: "Users", icon: Users },

      { href: "/admin/shops", label: "Shops", icon: Store },

      { href: "/admin/fraud", label: "Fraud", icon: ShieldAlert },

    ],

  },

  {

    title: "REVENUE",

    items: [

      { href: "/admin/payments", label: "Payments", icon: CreditCard, badgeKey: "pendingPayments" },

      { href: "/admin/promo-codes", label: "Promo Codes", icon: Tag },

      { href: "/admin/affiliates", label: "Affiliates", icon: HandCoins },

      { href: "/admin/referrals", label: "Referrals", icon: UserPlus },

      { href: "/admin/pricing", label: "Pricing Plans", icon: DollarSign },

    ],

  },

  {

    title: "ENGAGEMENT",

    items: [

      { href: "/admin/feedback", label: "Feedback", icon: Inbox, badgeKey: "newFeedback" },

      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },

      { href: "/admin/blog", label: "Blog", icon: FileText },

      { href: "/admin/community-tips", label: "Community Tips", icon: Lightbulb },

      { href: "/admin/community-posts", label: "Community Posts", icon: MessagesSquare },

      { href: "/admin/reviews", label: "Reviews", icon: Star },

    ],

  },

  {

    title: "SYSTEM",

    items: [

      { href: "/admin/sms-credits", label: "SMS Credits", icon: MessageSquare },

      { href: "/admin/cron", label: "Cron Jobs", icon: Clock },

      { href: "/admin/activity", label: "Activity", icon: Activity },

      { href: "/admin/system", label: "Settings", icon: Settings },

    ],

  },

];



export const PAGE_TITLES: Record<string, string> = {

  "/admin": "Dashboard",

  "/admin/analytics": "Analytics",

  "/admin/nps": "NPS Dashboard",

  "/admin/users": "Users",

  "/admin/shops": "Shops",

  "/admin/fraud": "Fraud",

  "/admin/payments": "Payments",

  "/admin/promo-codes": "Promo Codes",

  "/admin/affiliates": "Affiliates",

  "/admin/referrals": "Referrals",

  "/admin/pricing": "Pricing Plans",

  "/admin/feedback": "Feedback",

  "/admin/newsletter": "Newsletter",

  "/admin/blog": "Blog",

  "/admin/community-tips": "Community Tips",

  "/admin/community-posts": "Community Posts",

  "/admin/reviews": "Reviews",

  "/admin/sms-credits": "SMS Credits",

  "/admin/cron": "Cron Jobs",

  "/admin/activity": "User Activity",

  "/admin/system": "System",

};



export function resolvePageTitle(pathname: string): string {

  if (pathname.startsWith("/admin/sms-credits/logs")) return "SMS Usage Logs";

  if (pathname.startsWith("/admin/sms-credits")) return "SMS Credits";

  const entry = Object.entries(PAGE_TITLES).find(([path]) =>

    path === "/admin" ? pathname === "/admin" : pathname === path || pathname.startsWith(path + "/")

  );

  return entry?.[1] ?? "Admin";

}


