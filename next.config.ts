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
};

export default nextConfig;
