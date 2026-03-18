import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["katex"],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
