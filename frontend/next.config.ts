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
  
  // Configure page extensions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Ensure proper handling of dynamic routes
  async headers() {
    return [
      {
        source: '/projects/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Add catch-all route configuration
  async redirects() {
    return [
      {
        source: '/projects/:userid/:projectid/:action',
        destination: '/projects/[userid]/[projectid]/[action]',
        permanent: false,
      },
    ];
  },
  
  // Ensure proper App Router configuration
  experimental: {
    // This should help with dynamic route handling
    serverComponentsExternalPackages: [],
  },
  
  // Add specific configuration for dynamic routes
  async rewrites() {
    return [
      {
        source: '/projects/:userid/:projectid/:action',
        destination: '/projects/[userid]/[projectid]/[action]',
      },
    ];
  },
};

export default nextConfig;
