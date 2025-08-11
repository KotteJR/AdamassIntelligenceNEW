import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Next 15: use serverExternalPackages instead of experimental.serverComponentsExternalPackages
  serverExternalPackages: ["@supabase/supabase-js", "openai"],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
