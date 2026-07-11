import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Disable eslint check during build for faster docker compilation
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable typescript checks during build to guarantee compile speed
    ignoreBuildErrors: true,
  },
  async rewrites() {
    const isProd = process.env.NODE_ENV === "production";
    const backendUrl = process.env.BACKEND_API_URL || (isProd ? "http://backend:8000" : "http://localhost:8000");
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  }
};

export default nextConfig;
