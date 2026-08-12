import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Both ship native binaries (a Chromium build, a sqlite driver) that a
  // webpack/turbopack bundle would otherwise try to inline and break.
  serverExternalPackages: ["better-sqlite3", "@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
