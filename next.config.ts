import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker builds opt in; ordinary/Vercel builds must not copy local env files.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  outputFileTracingIncludes:{'/api/admin/archive/**/*':['./public/branding/**/*','./public/images/**/*','./.next/static/chunks/*.css','./.next/static/media/*.woff2']},
  outputFileTracingExcludes:{'*':['./.onboarding/**/*','./backups/**/*','./.media/**/*']},
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
      {source:'/:path*',headers:[
        {key:'X-Content-Type-Options',value:'nosniff'},
        {key:'X-Frame-Options',value:'DENY'},
        {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
        {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
        {key:'Content-Security-Policy',value:"frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'"},
        ...(process.env.VERCEL_ENV==='production'?[{key:'Strict-Transport-Security',value:'max-age=31536000'}]:[]),
      ]},
      ...preview,
      ...["/en/admin/:path*", "/bn/admin/:path*", "/en/security", "/bn/security", "/en/onboarding", "/bn/onboarding", "/api/auth/:path*", "/api/security/:path*", "/en/admin-preview/:path*", "/bn/admin-preview/:path*", "/api/admin/:path*"].map(source => ({
        source,
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      })),
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
