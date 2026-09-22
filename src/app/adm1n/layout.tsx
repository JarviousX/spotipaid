import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ADM1N",
  robots: { index: false, follow: false },
};

export default function Adm1nRootLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#050505] text-fg antialiased">{children}</div>
  );
}
