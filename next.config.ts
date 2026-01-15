import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // TODO: remove ignoreDuringBuilds once CI is stable.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
