import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Syne } from "next/font/google";
import { AppProviders } from "@/components/providers";
import { Shell } from "@/components/layout/shell";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SpotiPaid",
    template: "%s · SpotiPaid",
  },
  description:
    "Music trades. Artists get paid. SpotiPaid is not affiliated with or endorsed by Spotify.",
  applicationName: "SpotiPaid",
  keywords: [
    "SpotiPaid",
    "music royalties",
    "Solana",
    "artist payments",
    "music tokens",
  ],
  authors: [{ name: "SpotiPaid" }],
  creator: "SpotiPaid",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [{ url: "/logo.png" }],
  },
  openGraph: {
    title: "SpotiPaid",
    description:
      "Music trades. Artists get paid. SpotiPaid is not affiliated with or endorsed by Spotify.",
    siteName: "SpotiPaid",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SpotiPaid",
    description:
      "Music trades. Artists get paid. SpotiPaid is not affiliated with or endorsed by Spotify.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg font-sans text-fg">
        <AppProviders>
          <Shell>{children}</Shell>
        </AppProviders>
      </body>
    </html>
  );
}
