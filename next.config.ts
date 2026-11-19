import type { NextConfig } from "next";

// Built as a static site (for GitHub Pages). NEXT_PUBLIC_BASE_PATH is the path the
// site is served under, e.g. "/arrowhead"; leave it unset to serve from the root.
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
