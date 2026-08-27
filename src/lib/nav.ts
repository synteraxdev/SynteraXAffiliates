import {
  BadgeDollarSign,
  BarChart3,
  Bell,
  ClipboardCheck,
  LayoutDashboard,
  Link2,
  Megaphone,
  Settings,
  ShieldAlert,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const userNav: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/offers", label: "Promote", icon: Megaphone },
  { href: "/links", label: "My links", icon: Link2 },
  { href: "/conversions", label: "Earnings", icon: BadgeDollarSign },
  { href: "/reports", label: "Results", icon: BarChart3 },
  { href: "/payouts", label: "Cash out", icon: Wallet },
  { href: "/tools", label: "Help", icon: Wrench },
  { href: "/notifications", label: "Alerts", icon: Bell },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Admin home", icon: LayoutDashboard },
  { href: "/admin/offers", label: "Offers", icon: Megaphone },
  { href: "/admin/applications", label: "Access requests", icon: ClipboardCheck },
  { href: "/admin/conversions", label: "Approve earnings", icon: BadgeDollarSign },
  { href: "/admin/affiliates", label: "People", icon: Users },
  { href: "/admin/payouts", label: "Pay affiliates", icon: Wallet },
  { href: "/admin/reports", label: "Network results", icon: BarChart3 },
  { href: "/admin/fraud", label: "Flags", icon: ShieldAlert },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export const mobileTabs: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/offers", label: "Promote", icon: Megaphone },
  { href: "/conversions", label: "Earnings", icon: BadgeDollarSign },
  { href: "/payouts", label: "Cash out", icon: Wallet },
];
