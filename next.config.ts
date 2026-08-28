import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "api.qrserver.com" }],
  },
  async rewrites() {
    return [{ source: "/t/sx.js", destination: "/t/sx" }];
  },
};

export default nextConfig;
