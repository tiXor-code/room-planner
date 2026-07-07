import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile above the repo doesn't make
  // Turbopack mis-infer it (breaks output file tracing on deploy).
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
};

export default nextConfig;
