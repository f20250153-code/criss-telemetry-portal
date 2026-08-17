import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Minimal, self-contained production build for the Docker image —
  // only the files actually needed at runtime get copied into the
  // final container stage (see apps/web/Dockerfile).
  output: "standalone",
};

export default nextConfig;
