/**
 * Lazy-loaded Lucide icons for nav — avoids pulling the full modules registry
 * into client bundles that only need a single icon by name.
 */
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BookOpen,
  BarChart2,
  Settings,
  type LucideIcon,
} from "lucide-react";

const NAV_ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BookOpen,
  BarChart2,
  Settings,
};

export function getNavIcon(name: string): LucideIcon {
  return NAV_ICON_MAP[name] ?? LayoutDashboard;
}

export type { LucideIcon };
