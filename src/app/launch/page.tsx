import { LaunchWizard } from "@/components/launch/launch-wizard";
import { isDemoMode } from "@/lib/demo";
import { getConfig } from "@/lib/config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Launch a token",
  description:
    "Link a Spotify track and launch a music token with creator fees routed through SpotiPaid — wallet, walletless, or register.",
};

export default function LaunchPage() {
  const demo = isDemoMode();
  const fees = getConfig().fees;

  return (
    <div className="relative flex h-[calc(100dvh-var(--header-h))] min-h-0 w-full flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-5xl bg-[radial-gradient(ellipse_at_top,_rgba(29,185,84,0.18),_transparent_70%)]"
      />
      <div className="relative mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-3 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5 lg:px-8 lg:pb-5 lg:pt-6">
        <LaunchWizard
          demo={demo}
          artistBps={fees.artistBps}
          protocolBps={fees.protocolBps}
        />
      </div>
    </div>
  );
}
