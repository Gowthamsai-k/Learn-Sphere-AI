import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse and pdfjs-dist use dynamic require() calls (for workers) that
  // Turbopack cannot statically analyse. Mark them as external so Next.js
  // loads them via native Node.js require() at runtime instead of bundling.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  outputFileTracingIncludes: {
    "/api/**/*": ["node_modules/pdf-parse/**/*"],
  },
};

export default nextConfig;
