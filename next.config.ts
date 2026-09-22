import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "mosaic.scdn.co",
      },
      {
        protocol: "https",
        hostname: "image-cdn-ak.spotifycdn.com",
      },
      {
        protocol: "https",
        hostname: "image-cdn-fa.spotifycdn.com",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "thisis-images.scdn.co",
      },
      {
        protocol: "https",
        hostname: "seeded-session-images.scdn.co",
      },
      {
        protocol: "https",
        hostname: "wrapped-images.spotifycdn.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
  // Solana wallet adapter / web3 polyfill-friendly bundling
  serverExternalPackages: ["pino-pretty", "lokijs", "encoding"],
  async redirects() {
    return [
      { source: "/legal/terms", destination: "/terms", permanent: true },
      { source: "/legal/privacy", destination: "/privacy", permanent: true },
      {
        source: "/legal/disclosures",
        destination: "/disclosures",
        permanent: true,
      },
      { source: "/legal/risks", destination: "/risks", permanent: true },
      { source: "/legal/opt-out", destination: "/opt-out", permanent: true },
      { source: "/legal/report", destination: "/report", permanent: true },
    ];
  },
};

export default nextConfig;
