import { describe, expect, it } from "vitest";
import {
  AdminAuthError,
  assertPermission,
  roleHasPermission,
  ROLE_PERMISSIONS,
} from "@/lib/auth/admin";
import type { AdminRole, Permission } from "@/types/domain";

const ALL_PERMISSIONS: readonly Permission[] = [
  "admin:read",
  "admin:write",
  "claims:review",
  "finance:read",
  "finance:payout",
  "tokens:moderate",
  "settings:write",
  "audit:read",
] as const;

const ROLES: readonly AdminRole[] = [
  "SUPER_ADMIN",
  "MODERATOR",
  "FINANCE",
  "READONLY",
] as const;

describe("authorization / ROLE_PERMISSIONS", () => {
  it("defines permissions for every admin role", () => {
    for (const role of ROLES) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });

  it("gives SUPER_ADMIN every permission", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(roleHasPermission("SUPER_ADMIN", permission)).toBe(true);
    }
    expect(ROLE_PERMISSIONS.SUPER_ADMIN).toEqual(
      expect.arrayContaining([...ALL_PERMISSIONS]),
    );
  });

  it("scopes MODERATOR to review and moderate, not finance write", () => {
    expect(roleHasPermission("MODERATOR", "admin:read")).toBe(true);
    expect(roleHasPermission("MODERATOR", "claims:review")).toBe(true);
    expect(roleHasPermission("MODERATOR", "tokens:moderate")).toBe(true);
    expect(roleHasPermission("MODERATOR", "audit:read")).toBe(true);

    expect(roleHasPermission("MODERATOR", "admin:write")).toBe(false);
    expect(roleHasPermission("MODERATOR", "finance:read")).toBe(false);
    expect(roleHasPermission("MODERATOR", "finance:payout")).toBe(false);
    expect(roleHasPermission("MODERATOR", "settings:write")).toBe(false);
  });

  it("scopes FINANCE to payout paths without claims review", () => {
    expect(roleHasPermission("FINANCE", "admin:read")).toBe(true);
    expect(roleHasPermission("FINANCE", "finance:read")).toBe(true);
    expect(roleHasPermission("FINANCE", "finance:payout")).toBe(true);
    expect(roleHasPermission("FINANCE", "audit:read")).toBe(true);

    expect(roleHasPermission("FINANCE", "claims:review")).toBe(false);
    expect(roleHasPermission("FINANCE", "tokens:moderate")).toBe(false);
    expect(roleHasPermission("FINANCE", "settings:write")).toBe(false);
    expect(roleHasPermission("FINANCE", "admin:write")).toBe(false);
  });

  it("scopes READONLY to read-only permissions", () => {
    expect(ROLE_PERMISSIONS.READONLY).toEqual([
      "admin:read",
      "finance:read",
      "audit:read",
    ]);
    expect(roleHasPermission("READONLY", "admin:write")).toBe(false);
    expect(roleHasPermission("READONLY", "claims:review")).toBe(false);
    expect(roleHasPermission("READONLY", "finance:payout")).toBe(false);
    expect(roleHasPermission("READONLY", "settings:write")).toBe(false);
  });

  it("assertPermission throws FORBIDDEN when role lacks permission", () => {
    expect(() => assertPermission("READONLY", "settings:write")).toThrow(
      AdminAuthError,
    );
    try {
      assertPermission("MODERATOR", "finance:payout");
      expect.unreachable("expected assertPermission to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(AdminAuthError);
      expect((err as AdminAuthError).code).toBe("FORBIDDEN");
    }
  });

  it("assertPermission allows when role has permission", () => {
    expect(() => assertPermission("SUPER_ADMIN", "settings:write")).not.toThrow();
    expect(() => assertPermission("FINANCE", "finance:payout")).not.toThrow();
  });
});
