import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports for Cloud Run
  output: 'standalone',
  
  // Ensure dynamic routes are generated
  trailingSlash: false,
  
  // Ensure all routes are included in the build
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
};

export default nextConfig;
