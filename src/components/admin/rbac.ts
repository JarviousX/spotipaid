import type { AdminRole, Permission } from "@/types/domain";
import { ROLE_PERMISSIONS } from "@/types/domain";

export type AdminNavItem = {
  href: string;
  label: string;
  permission?: Permission;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview" },
  {
    href: "/admin/settings",
    label: "Protocol settings",
    permission: "settings:write",
  },
  {
    href: "/admin/claims",
    label: "Artists / claims",
    permission: "claims:review",
  },
  { href: "/admin/tokens", label: "Tokens", permission: "tokens:moderate" },
  { href: "/admin/payments", label: "Payments", permission: "finance:read" },
  {
    href: "/admin/integrations",
    label: "Integrations",
    permission: "admin:read",
  },
  { href: "/admin/audit", label: "Audit log", permission: "audit:read" },
];

export function roleCan(role: AdminRole, permission?: Permission): boolean {
  if (!permission) return true;
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}
