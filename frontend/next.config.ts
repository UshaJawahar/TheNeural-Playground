import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove standalone output to allow proper static generation
  // output: 'standalone',
  
  // Ensure dynamic routes are generated
  trailingSlash: false,
  
  // Ensure all routes are included in the build
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;
