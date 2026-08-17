import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" output is only for the Docker build (self-hosting) —
  // see apps/web/Dockerfile, which copies .next/standalone into the
  // final image. Vercel has its own bundling/file-tracing pipeline
  // that expects the default output layout; forcing "standalone" on a
  // Vercel build breaks it (Vercel's own build step looks for a file
  // that standalone mode restructures away). Vercel sets the VERCEL
  // env var automatically during its builds, so we use that to skip
  // "standalone" there and let Vercel do its own thing.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

export default nextConfig;
