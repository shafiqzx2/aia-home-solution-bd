import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker builds opt in; ordinary/Vercel builds must not copy local env files.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  async headers() {
    const preview = process.env.VERCEL_ENV === "preview"
      ? [
          {
            source: "/:path*",
            headers: [
              { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
            ],
          },
        ]
      : [];
    return [
      ...preview,
      {
        source: "/branding/:asset([a-z0-9-]+\\.[a-f0-9]+\\.(?:png|webp))",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
