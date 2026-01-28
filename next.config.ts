import type { NextConfig } from "next";

const nextConfig: NextConfig = {  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "backoffice.cofrem.com.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // ⬇️ Antes estaba en experimental.serverComponentsExternalPackages
  //    Ahora va a nivel raíz como serverExternalPackages
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },

  experimental: {
    // deja aquí solo otras flags experimentales válidas si las usas
  },
};

export default nextConfig;
