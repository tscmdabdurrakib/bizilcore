import type { NextConfig } from "next";

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.replit.dev",
    "*.sisko.replit.dev",
    "*.picard.replit.dev",
    "*.worf.replit.dev",
    "*.kirk.replit.dev",
    "*.janeway.replit.dev",
    ...(replitDevDomain ? [replitDevDomain] : []),
  ],
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
