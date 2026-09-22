import { Adm1nLoginForm } from "@/components/adm1n/login-form";
import { getAdminSession } from "@/lib/auth/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "ADM1N Sign-in",
  robots: { index: false, follow: false },
};

export default async function Adm1nLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/adm1n");

  return <Adm1nLoginForm />;
}
