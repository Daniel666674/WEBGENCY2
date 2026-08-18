import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/api/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
    {
      source: "/((?!api|_next/static|_next/image|demo/).*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
  // Both ship native binaries (a Chromium build, a sqlite driver) that a
  // webpack/turbopack bundle would otherwise try to inline and break.
  serverExternalPackages: ["better-sqlite3", "@sparticuz/chromium", "puppeteer-core"],
  // @sparticuz/chromium resolves its binary path at runtime
  // (chromium.executablePath()), so Next's static file tracer — which only
  // follows require()/import — never sees `bin/*.br` as a dependency of the
  // render route and leaves it out of the deployed function. Without this,
  // the function ships with no browser at all: "input directory .../bin
  // does not exist". Declared on the route itself, so only that function's
  // bundle (not every function in the app) carries the ~50MB payload.
  outputFileTracingIncludes: {
    "/api/demo-pages/render": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
};

export default nextConfig;
