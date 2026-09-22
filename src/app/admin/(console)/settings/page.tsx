import { SettingsForm } from "@/components/admin/settings-form";
import { roleCan } from "@/components/admin/rbac";
import { getAdminSession } from "@/lib/auth/session";
import { getPublicSafeSettings } from "@/services/admin";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Protocol settings" };

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!roleCan(session.role, "settings:write")) {
    redirect("/admin");
  }

  const settings = await getPublicSafeSettings();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Protocol settings</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Artist / protocol splits, minimums, treasury, chains, launchpads, and
          maintenance. Changes are audit-logged.
        </p>
      </header>
      <SettingsForm initial={settings} />
    </div>
  );
}
