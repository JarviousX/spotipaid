import {
  ChartColumn,
  DollarSign,
  FileText,
  GitBranch,
  Home,
  Mic2,
  Rocket,
  Search,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  accent?: boolean;
}

/** Mirrors UsePaid sidebar structure with SpotiPaid routes */
export const SIDEBAR_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Search },
  { href: "/payments", label: "Payments", icon: DollarSign },
  { href: "/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/launch", label: "Launch", icon: Rocket, accent: true },
  { href: "/artists", label: "Artists", icon: Mic2 },
  { href: "/capital-flow", label: "Capital flow", icon: GitBranch },
  { href: "/disclosures", label: "Docs", icon: FileText },
];
