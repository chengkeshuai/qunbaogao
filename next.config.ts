import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: '.next',
  transpilePackages: ['@tailwindcss/postcss']
};

export default nextConfig;
