import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "api.qrserver.com" }],
  },
  async redirects() {
    return [{ source: "/docs", destination: "/docs/javascript", permanent: false }];
  },
  async rewrites() {
    return [{ source: "/t/sx.js", destination: "/t/sx" }];
  },
};

export default nextConfig;
