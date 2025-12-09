import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "http",
                hostname: "localhost",
                port: "5001",
                pathname: "/uploads/**",
            },
            // Allow images from backend in production
            {
                protocol: "https",
                hostname: "**",
                pathname: "/uploads/**",
            },
            {
                protocol: "http",
                hostname: "**",
                pathname: "/uploads/**",
            },
        ],
    },
};

export default nextConfig;
