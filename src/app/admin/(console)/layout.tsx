import { AdminConsoleShell } from "@/components/admin/console-shell";
import { getAdminSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminConsoleLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <AdminConsoleShell email={session.email} role={session.role}>
      {children}
    </AdminConsoleShell>
  );
}
